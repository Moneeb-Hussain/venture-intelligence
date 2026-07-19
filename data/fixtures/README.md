# Canonical API Fixtures

Each JSON file is a direct response body for the endpoint named by the file.
The frontend can import these files without an additional wrapper. All people,
companies, signals, and evidence in this directory are synthetic.

The aggregate application fixtures are lifecycle snapshots, not simultaneous
responses:

1. `get_application_claims_only.json` — extraction complete; later stages null
2. `get_application_memo_ready.json` — Version A; memo ready, adversary null
3. `get_application_full.json` — adversary complete and human gate approved

`post_application_memo.json` intentionally contains only memo fields.
`post_application_adversary.json` contains the adversarial result and the
deterministic Decision Brief.

`post_thesis.json` is the successful write response. `get_thesis.json` is the
stored single-fund thesis returned to the client.

The founder fixture has six de-duplicated signals, one normalized source, and
one signal in the snapshot's last 30 days. The frozen formulas therefore yield
Founder Score 59 and band 22.

Multi-entity cast (added for demo volume; all scores follow the frozen
formulas with source_diversity = 1 because every hand-written signal uses
source "synthetic"):

- `get_dashboard.json` — four founders: Maya Chen (inbound, 6 signals, 1 in
  last 30d → 59 ± 22), Diego Alvarez (outbound github, 7 signals, 4 in last
  30d → 73 ± 21), Priya Raman (outbound github, 5 signals, 2 in last 30d →
  61 ± 24), Sana Iqbal (outbound hn cold-start, 2 signals, 1 in last 30d →
  51 ± 30, single snapshot → trend flat).
- `get_founder_fndr_syn_00{2,3,4}.json` — per-founder responses for
  `GET /api/founders/{id}`; `get_founder.json` stays the canonical example
  (fndr_syn_001).
- `get_application_app_syn_002.json` — second aggregate (TraceStack,
  fndr_syn_002): claims + axes + diligence complete (all supported), memo and
  adversary still null, status open. `get_application_full.json` stays the
  canonical app_syn_001 example.
- Origin means the discovery channel (inbound deck vs outbound github/hn
  scan); data provenance stays synthetic via signal `source` and the
  "(Synthetic)" name suffix.
