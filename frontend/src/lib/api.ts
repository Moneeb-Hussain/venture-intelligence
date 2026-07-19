// Thin data layer. Fixture-wired today; set NEXT_PUBLIC_API_BASE to point at
// the real backend and every call switches to fetch with the same shapes.
import * as fx from "./fixtures";
import type {
  ActivateResponse,
  AdversaryResponse,
  ApplicationAggregate,
  AuditEntry,
  CreateApplicationResponse,
  DashboardRow,
  DecideResponse,
  Diligence,
  FounderDetail,
  Memo,
  Metrics,
  OkResponse,
  QueryResponse,
  QueueRow,
  ScanRunResponse,
  ScreenResponse,
  Thesis,
  ThesisResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const isFixtureMode = !API_BASE;

async function getJson<T>(path: string, fixture: T): Promise<T> {
  if (!API_BASE) return fixture;
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return res.json();
}

async function postJson<T>(
  path: string,
  body: unknown,
  fixture: T,
): Promise<T> {
  if (!API_BASE) return fixture;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed with ${res.status}`);
  return res.json();
}

export function getThesis(): Promise<ThesisResponse> {
  return getJson("/api/thesis", fx.getThesisFixture);
}

export function saveThesis(thesis: Thesis): Promise<OkResponse> {
  return postJson("/api/thesis", { thesis }, fx.postThesisFixture);
}

export function runScan(): Promise<ScanRunResponse> {
  return postJson("/api/scan/run", {}, fx.scanRunFixture);
}

export function getDashboard(): Promise<DashboardRow[]> {
  return getJson("/api/dashboard", fx.dashboardFixture);
}

export function runQuery(q: string): Promise<QueryResponse> {
  return postJson("/api/query", { q }, fx.queryFixture);
}

export function getFounder(id: string): Promise<FounderDetail> {
  return getJson(
    `/api/founders/${id}`,
    fx.founderFixturesById[id] ?? fx.founderFixture,
  );
}

export function activateFounder(id: string): Promise<ActivateResponse> {
  return postJson(`/api/founders/${id}/activate`, {}, fx.activateFixture);
}

export interface ApplicationSnapshot {
  key: string;
  label: string;
  data: ApplicationAggregate;
}

// One current aggregate per application. (The claims-only / memo-ready
// lifecycle fixtures remain available for tests but are no longer surfaced.)
export async function getApplicationSnapshots(
  id: string,
): Promise<ApplicationSnapshot[]> {
  if (!API_BASE) {
    const data = fx.applicationFixturesById[id] ?? fx.appFullFixture;
    return [{ key: "current", label: "Current", data }];
  }
  const data = await getJson<ApplicationAggregate>(
    `/api/applications/${id}`,
    fx.appFullFixture,
  );
  return [{ key: "live", label: "Live", data }];
}

export interface ApplicationIndexRow {
  app: ApplicationAggregate;
  founder_name: string;
  founder_origin: string;
}

// Index for the Applications page: every application with its founder's name
// and discovery channel. Fixture mode composes from the entity maps; live mode
// walks dashboard -> founders -> aggregates (no extra endpoint needed).
export async function getApplicationsIndex(): Promise<ApplicationIndexRow[]> {
  if (!API_BASE) {
    return Object.values(fx.applicationFixturesById).map((app) => {
      const founder = fx.founderFixturesById[app.founder_id];
      return {
        app,
        founder_name: founder?.profile.name ?? app.founder_id,
        founder_origin: founder?.profile.origin ?? "synthetic",
      };
    });
  }
  const dash = await getDashboard();
  const rows: ApplicationIndexRow[] = [];
  for (const entry of dash) {
    try {
      const founder = await getFounder(entry.founder_id);
      for (const appId of founder.applications) {
        const app = await getJson<ApplicationAggregate>(
          `/api/applications/${appId}`,
          fx.appFullFixture,
        );
        rows.push({
          app,
          founder_name: founder.profile.name,
          founder_origin: founder.profile.origin,
        });
      }
    } catch {
      // Skip founders whose detail fetch fails; the index stays best-effort.
    }
  }
  return rows;
}

export function createApplication(
  company_name: string,
  deck_text: string,
): Promise<CreateApplicationResponse> {
  return postJson(
    "/api/applications",
    { company_name, deck_text },
    fx.appCreateFixture,
  );
}

export function screenApplication(id: string): Promise<ScreenResponse> {
  return postJson(`/api/applications/${id}/screen`, {}, fx.appScreenFixture);
}

export function runDiligence(id: string): Promise<Diligence> {
  return postJson(
    `/api/applications/${id}/diligence`,
    {},
    fx.appDiligenceFixture,
  );
}

export function draftMemo(id: string): Promise<Memo> {
  return postJson(`/api/applications/${id}/memo`, {}, fx.appMemoFixture);
}

export function runAdversary(id: string): Promise<AdversaryResponse> {
  return postJson(
    `/api/applications/${id}/adversary`,
    {},
    fx.appAdversaryFixture,
  );
}

export function getDecisionQueue(): Promise<QueueRow[]> {
  return getJson("/api/decisions/queue", fx.queueFixture);
}

export function getAudit(founderId?: string): Promise<AuditEntry[]> {
  const qs = founderId ? `?founder_id=${encodeURIComponent(founderId)}` : "";
  return getJson(`/api/audit${qs}`, fx.auditFixture);
}

export function getMetrics(): Promise<Metrics> {
  return getJson("/api/metrics", fx.metricsFixture);
}

export function decideApplication(
  id: string,
  action: "approve" | "reject",
  approver: string,
): Promise<DecideResponse> {
  return postJson(
    `/api/decisions/${id}/decide`,
    { action, approver },
    action === "approve"
      ? fx.decideFixture
      : { status: "rejected", audit_id: fx.decideFixture.audit_id },
  );
}
