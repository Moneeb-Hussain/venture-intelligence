from __future__ import annotations

from fastapi.testclient import TestClient


def test_query_matches_seeded_founder(client: TestClient) -> None:
    resp = client.post(
        "/api/query",
        json={"q": "technical founder, AI infra, shipped last 30 days, no prior VC"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["filter"]["technical_founder"] is True
    assert data["filter"]["prior_vc"] is False
    assert any(r["founder_id"] == "fndr_syn_001" for r in data["results"])
    match = next(r for r in data["results"] if r["founder_id"] == "fndr_syn_001")
    assert match["why_matched"]


def test_activate_returns_draft_not_sent(client: TestClient) -> None:
    resp = client.post("/api/founders/fndr_syn_001/activate")
    assert resp.status_code == 200, resp.text
    draft = resp.json()["outreach_draft"]
    assert "will not be sent" in draft.lower() or "not be sent" in draft.lower()
    assert "Maya" in draft


def test_scan_run_is_cached(client: TestClient) -> None:
    first = client.post("/api/scan/run").json()
    assert first["cached"] is True
    second = client.post("/api/scan/run").json()
    assert second["cached"] is True
    # Already seeded by lifespan → subsequent scan adds nothing.
    assert second["new_founders"] == 0
    assert second["new_signals"] == 0


def test_custom_scans_and_triangulation(client: TestClient, monkeypatch) -> None:
    # Force requests.get to fail to guarantee local cache-fallback is used deterministically
    import requests
    def mock_get(*args, **kwargs):
        raise requests.exceptions.ConnectionError("Forced offline for test determinism")
    monkeypatch.setattr(requests, "get", mock_get)

    # 1. Run Github Scan
    resp = client.post("/api/scan/github", json={"topics": ["gpu"], "since_days": 15})
    assert resp.status_code == 200
    github_data = resp.json()
    assert github_data["source"] == "github"
    assert github_data["cached"] is True
    assert github_data["new_founders"] > 0
    assert github_data["new_signals"] > 0

    # 2. Run HN Scan - should trigger triangulation for "Aris Vance" (same normalized name)
    resp = client.post("/api/scan/hn", json={"query": "AI infra", "since_days": 10})
    assert resp.status_code == 200
    hn_data = resp.json()
    assert hn_data["source"] == "hn"
    assert hn_data["cached"] is True
    # "Aris Vance" should match existing and be enriched (0 new founders, 1 new signal)
    assert hn_data["new_founders"] == 0
    assert hn_data["new_signals"] > 0

    # 3. Run YC Scan - should also trigger triangulation
    resp = client.post("/api/scan/yc", json={"batches": ["W26"], "industries": ["AI"]})
    assert resp.status_code == 200
    yc_data = resp.json()
    assert yc_data["source"] == "yc"
    assert yc_data["cached"] is True
    assert yc_data["new_founders"] == 0
    assert yc_data["new_signals"] > 0

    # 4. Get Status
    resp = client.get("/api/scan/status")
    assert resp.status_code == 200
    status_data = resp.json()
    assert len(status_data) == 3
    sources = {s["source"] for s in status_data}
    assert sources == {"github", "hn", "yc"}
    for item in status_data:
        assert item["last_run"] is not None
        assert item["founders_total"] >= 0
        assert item["cached"] is True

