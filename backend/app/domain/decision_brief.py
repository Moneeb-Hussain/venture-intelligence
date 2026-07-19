from __future__ import annotations

from typing import Any
from app.schemas.application import DecisionBrief, ContestedItem, DecisionBriefStats


def build_decision_brief(
    diligence: dict[str, Any],
    memo: dict[str, Any],
    adversarial: dict[str, Any],
    claims: list[dict[str, Any]]
) -> DecisionBrief:
    """Builds the Decision Brief deterministically according to steps.md section 4 formulas."""
    # 1. Identify valid claim_ids
    valid_claim_ids = {str(c.get("claim_id")) for c in claims if c.get("claim_id")}

    # 2. Identify based_on claims
    based_on_claims = set(memo.get("recommendation", {}).get("based_on", []))

    contested_items: list[ContestedItem] = []
    red_count = 0
    yellow_count = 0
    dim_count = 0

    objections = adversarial.get("objections", [])
    verified_attacks_count = 0

    for idx, objection in enumerate(objections):
        verification = objection.get("verification")
        label = objection.get("label")

        is_verified = (verification == "verified")
        is_unverified = (verification == "unverified")

        if is_verified:
            verified_attacks_count += 1

        targets = objection.get("targets", []) or []
        # Deduplicate targets and filter only valid ones
        seen_targets = set()
        dedup_valid_targets = []
        for t in targets:
            t_str = str(t)
            if t_str in valid_claim_ids and t_str not in seen_targets:
                seen_targets.add(t_str)
                dedup_valid_targets.append(t_str)

        for claim_id in dedup_valid_targets:
            is_based_on = (claim_id in based_on_claims)

            # Assign severity:
            # - verified attack on a based_on claim -> red
            # - verified attack on a peripheral claim -> yellow
            # - unverified attack on a based_on claim -> yellow
            # - speculation or any other remaining case -> dim
            if is_verified and is_based_on:
                severity = "red"
                red_count += 1
            elif (is_verified and not is_based_on) or (is_unverified and is_based_on):
                severity = "yellow"
                yellow_count += 1
            else:
                severity = "dim"
                dim_count += 1

            contested_items.append(
                ContestedItem(
                    claim_id=claim_id,
                    objection_i=idx,
                    severity=severity
                )
            )

    stats = DecisionBriefStats(
        claims=len(diligence.get("claims", []) or []),
        contested=len(contested_items),
        verified_attacks=verified_attacks_count
    )

    summary = f"Decision Brief: {red_count} red, {yellow_count} yellow, {dim_count} dim contested pairs; human review required."

    return DecisionBrief(
        summary=summary,
        contested=contested_items,
        stats=stats
    )
