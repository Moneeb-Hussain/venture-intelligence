from __future__ import annotations

import os
import json
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import requests
from sqlalchemy.orm import Session

from app.domain import normalize_founder_name
from app.domain.founder_score import compute_founder_score, SignalPoint
from app.models import Founder, Signal, ScoreSnapshotRow, AuditEvent
from app.repositories import FounderRepository
from backend.llm.wrapper import call_llm

logger = logging.getLogger("scanner")

STATUS_FILE = Path(__file__).resolve().parent / "scan_status.json"


def load_status() -> list[dict[str, Any]]:
    if STATUS_FILE.exists():
        try:
            return json.loads(STATUS_FILE.read_text())
        except Exception:
            pass
    return [
        {"source": "github", "last_run": None, "founders_total": 0, "cached": False},
        {"source": "hn", "last_run": None, "founders_total": 0, "cached": False},
        {"source": "yc", "last_run": None, "founders_total": 0, "cached": False},
    ]


def save_status(status_list: list[dict[str, Any]]) -> None:
    try:
        STATUS_FILE.write_text(json.dumps(status_list, indent=2))
    except Exception as e:
        logger.error(f"Failed to save scan status: {e}")


def update_source_status(source: str, cached: bool, founders_count: int) -> None:
    status_list = load_status()
    now_str = datetime.now(timezone.utc).isoformat()
    for entry in status_list:
        if entry["source"] == source:
            entry["last_run"] = now_str
            entry["founders_total"] = founders_count
            entry["cached"] = cached
            break
    save_status(status_list)


def load_scan_cache(source: str) -> list[dict[str, Any]]:
    cache_path = Path(__file__).resolve().parent / "scan_cache.json"
    if cache_path.exists():
        try:
            data = json.loads(cache_path.read_text())
            return [item for entry in data if (item := _match_source(entry, source))]
        except Exception as e:
            logger.error(f"Failed to read scan_cache.json: {e}")
    return []


def _match_source(entry: dict[str, Any], source: str) -> dict[str, Any] | None:
    if entry.get("source") == source:
        return entry
    return None


def ingest_candidate(
    db: Session,
    source: str,
    raw_payload: dict[str, Any],
    candidate_profile: dict[str, Any],
) -> tuple[bool, bool]:
    """Ingest a candidate profile into database memory.

    Uses identity resolution to prevent duplicates, and updates scores. Returns
    (is_new_founder, is_new_signal).
    """
    repo = FounderRepository(db)

    # Clean display name & username fallback
    name = candidate_profile.get("founder_name") or candidate_profile.get("display_name")
    if not name:
        name = candidate_profile.get("username") or "Unknown Founder"

    normalized = normalize_founder_name(name)
    if not normalized:
        return False, False

    # Check for existing founder by normalized name
    existing_founder = repo.get_by_normalized_name(normalized)

    # Setup timestamps
    now = datetime.now(timezone.utc)

    # Determine signal text and url
    text = candidate_profile.get("relevance_rationale") or candidate_profile.get("headline") or "Spotted building in AI infrastructure."
    url = raw_payload.get("profile_url") or raw_payload.get("url")

    # Generate unique signal ID
    signal_id = f"sig_{source}_{uuid.uuid4().hex[:12]}"

    if existing_founder:
        # Check if we already have this signal URL or text to prevent duplicate signals
        existing_texts = {s.text.strip().lower() for s in existing_founder.signals}
        if text.strip().lower() in existing_texts:
            return False, False

        # Add signal to existing founder record (Triangulation!)
        signal = Signal(
            id=signal_id,
            founder_id=existing_founder.id,
            ts=now,
            source=source,
            text=text,
            url=url,
        )
        repo.add_signal(signal)

        # Recalculate score snapshot with new signal added
        points = [SignalPoint(ts=s.ts, source=s.source) for s in existing_founder.signals] + [
            SignalPoint(ts=now, source=source)
        ]
        
        # Get latest score
        latest_score = None
        if existing_founder.score_snapshots:
            # Sort by ts descending to find newest
            snapshots = sorted(existing_founder.score_snapshots, key=lambda x: x.ts, reverse=True)
            latest_score = snapshots[0].score

        snapshot = compute_founder_score(points, snapshot_ts=now, previous_score=latest_score)
        score_row = ScoreSnapshotRow(
            founder_id=existing_founder.id,
            ts=now,
            score=snapshot.score,
            band=snapshot.band,
            trend=snapshot.trend,
        )
        repo.add_score_snapshot(score_row)

        db.add(
            AuditEvent(
                ts=now,
                stage="ingest",
                actor="system",
                action="enriched_founder_profile",
                detail=f"Added {source} signal to existing founder '{existing_founder.name}' via triangulation.",
                founder_id=existing_founder.id,
            )
        )
        repo.commit()
        return False, True

    else:
        # Create a new founder
        founder_id = f"fndr_{source}_{normalized}"
        headline = candidate_profile.get("relevance_rationale") or candidate_profile.get("headline")
        location = raw_payload.get("location")

        # Try to parse raw detail properties
        bio = raw_payload.get("bio")

        founder = Founder(
            id=founder_id,
            name=name,
            normalized_name=normalized,
            headline=headline,
            location=location,
            origin=source,
            bio=bio,
        )
        repo.add(founder)

        # Add first signal
        signal = Signal(
            id=signal_id,
            founder_id=founder_id,
            ts=now,
            source=source,
            text=text,
            url=url,
        )
        repo.add_signal(signal)

        # Initial score snapshot
        points = [SignalPoint(ts=now, source=source)]
        snapshot = compute_founder_score(points, snapshot_ts=now, previous_score=None)
        score_row = ScoreSnapshotRow(
            founder_id=founder_id,
            ts=now,
            score=snapshot.score,
            band=snapshot.band,
            trend=snapshot.trend,
        )
        repo.add_score_snapshot(score_row)

        db.add(
            AuditEvent(
                ts=now,
                stage="ingest",
                actor="system",
                action="created_founder_profile",
                detail=f"Created new founder profile for '{name}' with {source} signal.",
                founder_id=founder_id,
            )
        )
        repo.commit()
        return True, True


class SourcingScanner:
    def __init__(self, db: Session) -> None:
        self.db = db

    def scan_github(self, topics: list[str] | None = None, since_days: int | None = None) -> dict[str, Any]:
        source = "github"
        github_token = os.getenv("GITHUB_TOKEN")
        cached = True
        candidates = []

        if github_token:
            # Attempt live scan
            try:
                # Default search topic if none provided
                search_topics = topics or ["ai-infrastructure", "mlops", "compiler", "deep-learning"]
                headers = {"Authorization": f"token {github_token}", "Accept": "application/vnd.github.v3+json"}
                
                # Search repositories with topics
                topic_query = " OR ".join([f"topic:{t}" for t in search_topics])
                url = f"https://api.github.com/search/repositories?q={topic_query}&sort=stars&order=desc"
                
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    items = response.json().get("items", [])[:3]  # process top 3 to be fast and safe
                    for item in items:
                        owner = item.get("owner", {})
                        repo_name = item.get("name", "")
                        desc = item.get("description", "")
                        repo_topics = item.get("topics", [])
                        username = owner.get("login", "")
                        profile_url = owner.get("html_url", "")

                        candidates.append({
                            "source": "github",
                            "profile_url": profile_url,
                            "username": username,
                            "display_name": username,
                            "fetched_at": datetime.now(timezone.utc).isoformat(),
                            "cached": False,
                            "raw": {
                                "repo_name": repo_name,
                                "description": desc,
                                "topics": repo_topics,
                                "username": username,
                                "display_name": username,
                                "origin": "github",
                            }
                        })
                    cached = False
            except Exception as e:
                logger.error(f"Live GitHub search failed, falling back to cache: {e}")

        if cached or not candidates:
            # Fallback to cache
            candidates = load_scan_cache(source)
            cached = True

        new_founders = 0
        new_signals = 0

        for cand in candidates:
            raw = cand.get("raw", {})
            # Run model-assisted classification via LLM Wrapper
            classification = call_llm("scan_github", raw)
            is_new_founder, is_new_signal = ingest_candidate(self.db, source, cand, classification)
            if is_new_founder:
                new_founders += 1
            if is_new_signal:
                new_signals += 1

        # Track total founders with github origin in memory
        founders_total = self.db.query(Founder).filter(Founder.origin == source).count()
        update_source_status(source, cached, founders_total)

        return {
            "source": source,
            "new_founders": new_founders,
            "new_signals": new_signals,
            "cached": cached,
        }

    def scan_hn(self, query: str | None = None, since_days: int | None = None) -> dict[str, Any]:
        source = "hn"
        cached = True
        candidates = []

        try:
            # Attempt live Algolia API search
            search_query = query or "AI infrastructure"
            url = f"https://hn.algolia.com/api/v1/search?query={search_query}&tags=story"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                hits = response.json().get("hits", [])[:3]  # process top 3
                for hit in hits:
                    author = hit.get("author", "")
                    title = hit.get("title", "")
                    text = hit.get("story_text", "")
                    profile_url = f"https://news.ycombinator.com/user?id={author}"

                    candidates.append({
                        "source": "hn",
                        "profile_url": profile_url,
                        "username": author,
                        "display_name": author,
                        "fetched_at": datetime.now(timezone.utc).isoformat(),
                        "cached": False,
                        "raw": {
                            "title": title,
                            "text": text,
                            "username": author,
                            "display_name": author,
                            "origin": "hn",
                        }
                    })
                cached = False
        except Exception as e:
            logger.error(f"Live HN search failed, falling back to cache: {e}")

        if cached or not candidates:
            # Fallback to cache
            candidates = load_scan_cache(source)
            cached = True

        new_founders = 0
        new_signals = 0

        for cand in candidates:
            raw = cand.get("raw", {})
            classification = call_llm("scan_hn", raw)
            is_new_founder, is_new_signal = ingest_candidate(self.db, source, cand, classification)
            if is_new_founder:
                new_founders += 1
            if is_new_signal:
                new_signals += 1

        founders_total = self.db.query(Founder).filter(Founder.origin == source).count()
        update_source_status(source, cached, founders_total)

        return {
            "source": source,
            "new_founders": new_founders,
            "new_signals": new_signals,
            "cached": cached,
        }

    def scan_yc(self, batches: list[str] | None = None, industries: list[str] | None = None) -> dict[str, Any]:
        source = "yc"
        cached = True
        candidates = []

        try:
            # Attempt live fetch
            url = "https://yc-oss.github.io/api/companies/all.json"
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                all_companies = response.json() or []
                # Filter companies to process top 3 AI ones
                ai_companies = []
                for comp in all_companies:
                    # check if AI or developer tool
                    desc = comp.get("description", "").lower()
                    inds = [i.lower() for k in comp.get("industries", []) for i in (k.split() if isinstance(k, str) else [])]
                    if any(x in desc or x in inds for x in ["ai", "artificial intelligence", "ml", "gpu", "infrastructure"]):
                        ai_companies.append(comp)
                    if len(ai_companies) >= 3:
                        break

                if not ai_companies:
                    ai_companies = all_companies[:3]

                for comp in ai_companies:
                    comp_name = comp.get("name", "")
                    desc = comp.get("description", "")
                    comp_industries = comp.get("industries", [])
                    slug = comp.get("slug", "")
                    profile_url = f"https://www.ycombinator.com/companies/{slug}" if slug else None

                    # Extract founder names
                    founders = comp.get("founders", [])
                    founder_name = founders[0].get("name", "YC Founder") if founders else "YC Founder"

                    candidates.append({
                        "source": "yc",
                        "profile_url": profile_url,
                        "username": comp_name.lower().replace(" ", ""),
                        "display_name": founder_name,
                        "fetched_at": datetime.now(timezone.utc).isoformat(),
                        "cached": False,
                        "raw": {
                            "company_name": comp_name,
                            "description": desc,
                            "industries": comp_industries,
                            "display_name": founder_name,
                            "origin": "yc",
                        }
                    })
                cached = False
        except Exception as e:
            logger.error(f"Live YC fetch failed, falling back to cache: {e}")

        if cached or not candidates:
            candidates = load_scan_cache(source)
            cached = True

        new_founders = 0
        new_signals = 0

        for cand in candidates:
            raw = cand.get("raw", {})
            classification = call_llm("scan_yc", raw)
            is_new_founder, is_new_signal = ingest_candidate(self.db, source, cand, classification)
            if is_new_founder:
                new_founders += 1
            if is_new_signal:
                new_signals += 1

        founders_total = self.db.query(Founder).filter(Founder.origin == source).count()
        update_source_status(source, cached, founders_total)

        return {
            "source": source,
            "new_founders": new_founders,
            "new_signals": new_signals,
            "cached": cached,
        }
