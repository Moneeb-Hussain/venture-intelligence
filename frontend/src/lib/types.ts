// Contract types transcribed from steps.md §3. Shapes are law — never mutate.

export type Origin = "github" | "hn" | "inbound" | "synthetic";
export type Trend = "up" | "flat" | "down";
export type AppStatus = "open" | "approved" | "rejected";

export interface Signal {
  signal_id: string;
  ts: string;
  source: string;
  text: string;
  url: string | null;
}

export type ClaimType = "traction" | "team" | "market" | "product";

export interface Claim {
  claim_id: string;
  type: ClaimType;
  text: string;
  source_span: string | null;
}

export interface QueryFilter {
  technical_founder: boolean | null;
  sectors: string[];
  geos: string[];
  shipped_within_days: number | null;
  prior_vc: boolean | null;
}

export interface Thesis {
  sectors: string[];
  stage: string;
  geo: string[];
  check_size: number;
  risk_appetite: "low" | "medium" | "high";
}

export interface Profile {
  founder_id: string;
  name: string;
  headline: string | null;
  location: string | null;
  origin: Origin;
  bio: string | null;
}

export interface Axes {
  founder: { score: number; trend: Trend; rationale: string };
  market: { rating: "bullish" | "neutral" | "bear"; rationale: string };
  idea_vs_market: {
    verdict: "survives" | "pivot" | "fails";
    rationale: string;
  };
}

export type Verdict = "supported" | "contradicted" | "unverifiable";
export type TrustLevel = "high" | "med" | "low";

export interface DiligenceClaim {
  claim_id: string;
  verdict: Verdict;
  trust: TrustLevel;
  evidence: string[];
  note: string;
}

export interface Diligence {
  claims: DiligenceClaim[];
  gaps: string[];
}

export interface Recommendation {
  invest: boolean;
  amount: number;
  rationale: string;
  based_on: string[];
}

export interface MemoSections {
  snapshot: string;
  hypotheses: string;
  swot: string;
  problem_product: string;
  traction_kpis: string;
}

export interface Memo {
  memo_id: string;
  sections: MemoSections;
  recommendation: Recommendation;
}

export type ObjectionLabel = "evidence-backed" | "speculation";
export type ObjectionVerification = "verified" | "unverified" | "n/a";

export interface Objection {
  text: string;
  targets: string[];
  evidence: string[] | null;
  label: ObjectionLabel;
  verification: ObjectionVerification;
}

export interface Adversarial {
  persona: string;
  objections: Objection[];
}

export type Severity = "red" | "yellow" | "dim";

export interface ContestedPair {
  claim_id: string;
  objection_i: number;
  severity: Severity;
}

export interface DecisionBrief {
  summary: string;
  contested: ContestedPair[];
  stats: { claims: number; contested: number; verified_attacks: number };
}

export interface DashboardRow {
  founder_id: string;
  name: string;
  origin: Origin;
  founder_score: number;
  band: number;
  trend: Trend;
  top_signals: string[];
  has_open_app: boolean;
}

export interface QueryResult {
  founder_id: string;
  why_matched: string[];
}

export interface QueryResponse {
  filter: QueryFilter;
  results: QueryResult[];
}

export interface ScoreSnapshot {
  ts: string;
  score: number;
  band: number;
}

export interface FounderDetail {
  profile: Profile;
  signals: Signal[];
  score_history: ScoreSnapshot[];
  applications: string[];
}

export interface ApplicationAggregate {
  application_id: string;
  founder_id: string;
  company_name: string;
  status: AppStatus;
  claims: Claim[];
  axes: Axes | null;
  diligence: Diligence | null;
  memo: Memo | null;
  adversarial: Adversarial | null;
  decision_brief: DecisionBrief | null;
  evidence: Signal[];
}

export interface QueueRow {
  application_id: string;
  company: string;
  recommendation: Recommendation;
  memo_id: string;
}

export interface AuditEntry {
  ts: string;
  stage: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Metrics {
  signal_to_decision_min: number | null;
  funnel: {
    sourced: number;
    screened: number;
    diligenced: number;
    decided: number;
  };
}

export interface ActivateResponse {
  outreach_draft: string;
}

export interface OkResponse {
  ok: true;
}

export interface ThesisResponse {
  thesis: Thesis;
}

export interface ScanRunResponse {
  new_founders: number;
  new_signals: number;
  cached: boolean;
}

export type ScanSource = "github" | "hn" | "yc";

export interface PerSourceScanResponse {
  source: string;
  new_founders: number;
  new_signals: number;
  cached: boolean;
}

export interface ScanStatusEntry {
  source: string;
  last_run: string | null;
  founders_total: number;
  cached: boolean;
}

export interface CreateApplicationResponse {
  application_id: string;
  founder_id: string;
  claims: Claim[];
}

export interface ScreenResponse {
  axes: Axes;
}

export interface AdversaryResponse {
  adversarial: Adversarial;
  decision_brief: DecisionBrief;
}

export interface DecideResponse {
  status: "approved" | "rejected";
  audit_id: string;
}
