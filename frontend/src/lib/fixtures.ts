// Canonical fixture imports. /data/fixtures is the single source of rendered
// values in fixture mode — never retype contract examples here.
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
  PerSourceScanResponse,
  ScanRunResponse,
  ScanStatusEntry,
  ScreenResponse,
  ThesisResponse,
} from "./types";

import dashboardJson from "../../../data/fixtures/get_dashboard.json";
import queryJson from "../../../data/fixtures/post_query.json";
import founderJson from "../../../data/fixtures/get_founder.json";
import founder2Json from "../../../data/fixtures/get_founder_fndr_syn_002.json";
import founder3Json from "../../../data/fixtures/get_founder_fndr_syn_003.json";
import founder4Json from "../../../data/fixtures/get_founder_fndr_syn_004.json";
import app2Json from "../../../data/fixtures/get_application_app_syn_002.json";
import activateJson from "../../../data/fixtures/post_founder_activate.json";
import appClaimsOnlyJson from "../../../data/fixtures/get_application_claims_only.json";
import appMemoReadyJson from "../../../data/fixtures/get_application_memo_ready.json";
import appFullJson from "../../../data/fixtures/get_application_full.json";
import queueJson from "../../../data/fixtures/get_decisions_queue.json";
import auditJson from "../../../data/fixtures/get_audit.json";
import metricsJson from "../../../data/fixtures/get_metrics.json";
import decideJson from "../../../data/fixtures/post_decision_decide.json";
import getThesisJson from "../../../data/fixtures/get_thesis.json";
import postThesisJson from "../../../data/fixtures/post_thesis.json";
import scanRunJson from "../../../data/fixtures/post_scan_run.json";
import scanStatusJson from "../../../data/fixtures/get_scan_status.json";
import scanGithubJson from "../../../data/fixtures/post_scan_github.json";
import scanHnJson from "../../../data/fixtures/post_scan_hn.json";
import scanYcJson from "../../../data/fixtures/post_scan_yc.json";
import appCreateJson from "../../../data/fixtures/post_application_create.json";
import appScreenJson from "../../../data/fixtures/post_application_screen.json";
import appDiligenceJson from "../../../data/fixtures/post_application_diligence.json";
import appMemoJson from "../../../data/fixtures/post_application_memo.json";
import appAdversaryJson from "../../../data/fixtures/post_application_adversary.json";

export const dashboardFixture = dashboardJson as unknown as DashboardRow[];
export const queryFixture = queryJson as unknown as QueryResponse;
export const founderFixture = founderJson as unknown as FounderDetail;
export const founder2Fixture = founder2Json as unknown as FounderDetail;
export const founder3Fixture = founder3Json as unknown as FounderDetail;
export const founder4Fixture = founder4Json as unknown as FounderDetail;
export const app2Fixture = app2Json as unknown as ApplicationAggregate;
export const activateFixture = activateJson as unknown as ActivateResponse;
export const appClaimsOnlyFixture =
  appClaimsOnlyJson as unknown as ApplicationAggregate;
export const appMemoReadyFixture =
  appMemoReadyJson as unknown as ApplicationAggregate;
export const appFullFixture = appFullJson as unknown as ApplicationAggregate;
export const queueFixture = queueJson as unknown as QueueRow[];
export const auditFixture = auditJson as unknown as AuditEntry[];
export const metricsFixture = metricsJson as unknown as Metrics;
export const decideFixture = decideJson as unknown as DecideResponse;
export const getThesisFixture = getThesisJson as unknown as ThesisResponse;
export const postThesisFixture = postThesisJson as unknown as OkResponse;
export const scanRunFixture = scanRunJson as unknown as ScanRunResponse;
export const scanStatusFixture = scanStatusJson as unknown as ScanStatusEntry[];
export const scanGithubFixture =
  scanGithubJson as unknown as PerSourceScanResponse;
export const scanHnFixture = scanHnJson as unknown as PerSourceScanResponse;
export const scanYcFixture = scanYcJson as unknown as PerSourceScanResponse;
export const appCreateFixture =
  appCreateJson as unknown as CreateApplicationResponse;
export const appScreenFixture = appScreenJson as unknown as ScreenResponse;
export const appDiligenceFixture = appDiligenceJson as unknown as Diligence;
export const appMemoFixture = appMemoJson as unknown as Memo;
export const appAdversaryFixture =
  appAdversaryJson as unknown as AdversaryResponse;

// Entity maps for fixture-mode lookups by id.
export const founderFixturesById: Record<string, FounderDetail> = {
  fndr_syn_001: founderFixture,
  fndr_syn_002: founder2Fixture,
  fndr_syn_003: founder3Fixture,
  fndr_syn_004: founder4Fixture,
};

export const applicationFixturesById: Record<string, ApplicationAggregate> = {
  app_syn_001: appFullFixture,
  app_syn_002: app2Fixture,
};
