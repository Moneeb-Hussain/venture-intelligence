"use client";

import * as React from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import type { ApplicationSnapshot } from "@/lib/api";
import type {
  Adversarial,
  Axes,
  Claim,
  DecisionBrief,
  Diligence,
  DiligenceClaim,
  Memo,
  Severity,
  Signal,
} from "@/lib/types";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ObjectionLabelBadge,
  SeverityLabel,
  StatusBadge,
  TrustBadge,
  VerdictBadge,
  VerificationBadge,
} from "@/components/domain/badges";
import { TrendIcon } from "@/components/domain/score";
import { EvidenceDialog } from "@/components/domain/evidence-dialog";
import { SectionLabel } from "@/components/domain/section-label";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Quiet placeholder for stages whose nullable object has not arrived yet.
function PendingPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

function EvidenceChips({ ids }: { ids: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {ids.map((id) => (
        <Chip
          key={id}
          variant="mono"
          className="transition-colors group-hover:border-zinc-400 group-hover:text-zinc-800"
        >
          {id}
        </Chip>
      ))}
    </span>
  );
}

/* ----------------------------- Timeline frame ----------------------------- */

interface StageDef {
  id: string;
  num: string;
  label: string;
  done: boolean;
  chip: string;
}

// One stage on the pipeline timeline: numbered node on the left rail + a Card.
function StageSection({
  stage,
  cardClassName,
  children,
}: {
  stage: StageDef;
  cardClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={stage.id} className="relative scroll-mt-28">
      <div
        aria-hidden
        className={cn(
          "absolute -left-14 top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white font-mono text-[11px] font-medium",
          stage.done
            ? "border-indigo-600 text-indigo-600"
            : "border-zinc-300 text-zinc-400",
        )}
      >
        {stage.num}
      </div>
      <Card className={cardClassName}>
        <CardHeader className="items-center">
          <SectionLabel className="text-zinc-500">
            {stage.num} · {stage.label}
          </SectionLabel>
          {stage.done ? (
            <Chip variant="mono">{stage.chip}</Chip>
          ) : (
            <Chip
              variant="mono"
              className="border-dashed bg-white text-zinc-400"
            >
              {stage.chip}
            </Chip>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

/* ------------------------------- 01 · Claims ------------------------------ */

function ClaimsStage({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return <PendingPanel>No claims have been extracted yet.</PendingPanel>;
  }
  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <div
          key={claim.claim_id}
          className="rounded-lg border border-zinc-200 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Badge variant="outline">{claim.type}</Badge>
              <p className="mt-2 text-sm leading-relaxed text-zinc-800">
                {claim.text}
              </p>
              {claim.source_span !== null ? (
                <blockquote className="mt-2 border-l-2 border-indigo-200 pl-3 text-sm leading-relaxed text-zinc-600">
                  “{claim.source_span}”
                </blockquote>
              ) : (
                <div className="mt-2 rounded border border-dashed border-zinc-300 px-3 py-2 text-[13px] text-zinc-400">
                  No verifiable source span — cannot be supported or cited in
                  the recommendation.
                </div>
              )}
            </div>
            <span className="shrink-0 font-mono text-[11px] text-zinc-400">
              {claim.claim_id}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- 02 · Screening ----------------------------- */

function ScreeningStage({ axes }: { axes: Axes | null }) {
  if (axes === null) {
    return <PendingPanel>Screening has not run yet.</PendingPanel>;
  }
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4">
          <SectionLabel>Founder</SectionLabel>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-zinc-900">
              {axes.founder.score}
              <span className="text-sm font-medium text-zinc-400">/10</span>
            </span>
            <TrendIcon trend={axes.founder.trend} className="self-center" />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {axes.founder.rationale}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <SectionLabel>Market</SectionLabel>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">
            {capitalize(axes.market.rating)}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {axes.market.rationale}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <SectionLabel>Idea vs Market</SectionLabel>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">
            {capitalize(axes.idea_vs_market.verdict)}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {axes.idea_vs_market.rationale}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Three independent axes — never averaged.
      </p>
    </div>
  );
}

/* ----------------------------- 03 · Diligence ----------------------------- */

function DiligenceRow({
  diligenceClaim,
  claim,
  evidence,
}: {
  diligenceClaim: DiligenceClaim;
  claim: Claim | undefined;
  evidence: Signal[];
}) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <VerdictBadge verdict={diligenceClaim.verdict} />
        <TrustBadge trust={diligenceClaim.trust} />
        <span className="font-mono text-[11px] text-zinc-400">
          {diligenceClaim.claim_id}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-800">
        {claim ? claim.text : diligenceClaim.claim_id}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
        {diligenceClaim.note}
      </p>
      {diligenceClaim.evidence.length > 0 ? (
        <EvidenceDialog
          title={`Evidence — ${diligenceClaim.claim_id}`}
          evidenceIds={diligenceClaim.evidence}
          evidence={evidence}
          className="group mt-2"
        >
          <EvidenceChips ids={diligenceClaim.evidence} />
        </EvidenceDialog>
      ) : (
        <p className="mt-2 font-mono text-[11px] text-zinc-400">
          no evidence referenced
        </p>
      )}
    </div>
  );
}

function DiligenceStage({
  diligence,
  claims,
  evidence,
}: {
  diligence: Diligence | null;
  claims: Claim[];
  evidence: Signal[];
}) {
  if (diligence === null) {
    return <PendingPanel>Diligence has not run yet.</PendingPanel>;
  }
  const claimById = new Map(claims.map((c) => [c.claim_id, c]));
  return (
    <div className="space-y-5">
      <div className="divide-y divide-zinc-100">
        {diligence.claims.map((dc) => (
          <DiligenceRow
            key={dc.claim_id}
            diligenceClaim={dc}
            claim={claimById.get(dc.claim_id)}
            evidence={evidence}
          />
        ))}
        {diligence.claims.length === 0 && (
          <p className="text-sm text-zinc-400">No claims were checked.</p>
        )}
      </div>
      <div className="border-t border-zinc-100 pt-4">
        <SectionLabel>Gaps</SectionLabel>
        {diligence.gaps.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {diligence.gaps.map((gap) => (
              <li
                key={gap}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <Flag className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                {gap}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">No gaps flagged.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- 04 · Memo -------------------------------- */

const memoSectionLabels: [keyof Memo["sections"], string][] = [
  ["snapshot", "Snapshot"],
  ["hypotheses", "Hypotheses"],
  ["swot", "SWOT"],
  ["problem_product", "Problem & Product"],
  ["traction_kpis", "Traction & KPIs"],
];

function MemoStage({
  memo,
  diligence,
  evidence,
}: {
  memo: Memo | null;
  diligence: Diligence | null;
  evidence: Signal[];
}) {
  if (memo === null) {
    return <PendingPanel>The memo has not been drafted yet.</PendingPanel>;
  }
  const { recommendation } = memo;
  const diligenceById = new Map(
    (diligence?.claims ?? []).map((dc) => [dc.claim_id, dc]),
  );
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {memoSectionLabels.map(([key, label]) => (
          <div key={key}>
            <SectionLabel>{label}</SectionLabel>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">
              {memo.sections[key]}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Recommendation</SectionLabel>
          <span className="font-mono text-[11px] text-zinc-400">
            {memo.memo_id}
          </span>
        </div>
        <div
          className={cn(
            "mt-2 text-lg font-semibold tabular-nums",
            recommendation.invest ? "text-emerald-700" : "text-zinc-700",
          )}
        >
          {recommendation.invest
            ? `Invest — ${formatAmount(recommendation.amount)}`
            : "Do not invest"}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {recommendation.rationale}
        </p>
        <div className="mt-3">
          <SectionLabel>Based on</SectionLabel>
          {recommendation.based_on.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {recommendation.based_on.map((claimId) => {
                const dc = diligenceById.get(claimId);
                return (
                  <EvidenceDialog
                    key={claimId}
                    title={`Evidence — ${claimId}`}
                    evidenceIds={dc?.evidence ?? []}
                    evidence={evidence}
                    className="group"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 transition-colors group-hover:border-indigo-300">
                      <span className="font-mono text-[11px] text-zinc-600">
                        {claimId}
                      </span>
                      {dc ? <TrustBadge trust={dc.trust} /> : null}
                    </span>
                  </EvidenceDialog>
                );
              })}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-zinc-400">No claims cited.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- 05 · Devil's Advocate -------------------------- */

// Plain-language reading of each severity — the raw color word alone is
// cryptic; every severity is paired with what it means for the decision.
const severityMeaning: Record<Severity, string> = {
  red: "Verified attack on a claim the recommendation depends on.",
  yellow: "Worth attention before approving.",
  dim: "Unverified speculation — logged, not blocking.",
};

function StatBlock({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <SectionLabel>{label}</SectionLabel>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          emphasize ? "text-red-700" : "text-zinc-900",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DecisionBriefPanel({
  decisionBrief,
  adversarial,
  claims,
}: {
  decisionBrief: DecisionBrief;
  adversarial: Adversarial;
  claims: Claim[];
}) {
  const claimById = new Map(claims.map((c) => [c.claim_id, c]));
  return (
    <div className="border-t border-zinc-100 pt-4">
      <SectionLabel>Decision Brief</SectionLabel>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatBlock label="Claims checked" value={decisionBrief.stats.claims} />
        <StatBlock label="Contested" value={decisionBrief.stats.contested} />
        <StatBlock
          label="Verified attacks"
          value={decisionBrief.stats.verified_attacks}
          emphasize={decisionBrief.stats.verified_attacks > 0}
        />
      </div>
      <div className="mt-4">
        <SectionLabel>Contested claims</SectionLabel>
        {decisionBrief.contested.length > 0 ? (
          <div className="mt-1 divide-y divide-zinc-100">
            {decisionBrief.contested.map((pair) => {
              const claim = claimById.get(pair.claim_id);
              const objection = adversarial.objections[pair.objection_i];
              return (
                <div
                  key={`${pair.claim_id}-${pair.objection_i}`}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <SeverityLabel severity={pair.severity} />
                    <span className="font-mono text-[11px] text-zinc-400">
                      {pair.claim_id}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-zinc-900">
                    {claim ? claim.text : pair.claim_id}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                    {severityMeaning[pair.severity]}
                  </p>
                  {objection && (
                    <div className="mt-2 flex flex-wrap items-start gap-2">
                      <blockquote className="min-w-0 border-l-2 border-zinc-200 pl-3 text-[13px] leading-relaxed text-zinc-600">
                        “{objection.text}”
                      </blockquote>
                      <VerificationBadge
                        verification={objection.verification}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">No contested pairs.</p>
        )}
      </div>
      <p className="mt-3 font-mono text-[11px] text-zinc-400">
        {decisionBrief.summary}
      </p>
      <p className="mt-1.5 text-[13px] text-zinc-600">
        No winner is declared — the human decides.
      </p>
    </div>
  );
}

function AdversarialStage({
  adversarial,
  decisionBrief,
  claims,
  evidence,
}: {
  adversarial: Adversarial;
  decisionBrief: DecisionBrief | null;
  claims: Claim[];
  evidence: Signal[];
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <SectionLabel>Persona</SectionLabel>
        <Badge variant="outline">{adversarial.persona}</Badge>
      </div>
      <div className="divide-y divide-zinc-100">
        {adversarial.objections.map((objection, i) => (
          <div key={i} className="flex items-start gap-2.5 py-3 first:pt-0">
            <span className="pt-0.5 font-mono text-[11px] text-zinc-400">
              #{i}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-zinc-800">
                {objection.text}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <ObjectionLabelBadge label={objection.label} />
                <VerificationBadge verification={objection.verification} />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-400">
                  targets
                </span>
                {objection.targets.map((claimId) => (
                  <span
                    key={claimId}
                    className="font-mono text-[11px] text-zinc-500"
                  >
                    {claimId}
                  </span>
                ))}
              </div>
              {objection.evidence !== null && (
                <EvidenceDialog
                  title={`Evidence — objection #${i}`}
                  evidenceIds={objection.evidence}
                  evidence={evidence}
                  className="group mt-2"
                >
                  <EvidenceChips ids={objection.evidence} />
                </EvidenceDialog>
              )}
            </div>
          </div>
        ))}
      </div>
      {decisionBrief !== null && (
        <DecisionBriefPanel
          decisionBrief={decisionBrief}
          adversarial={adversarial}
          claims={claims}
        />
      )}
    </div>
  );
}

/* --------------------------------- Screen --------------------------------- */

export function ApplicationScreen({
  snapshots,
}: {
  snapshots: ApplicationSnapshot[];
}) {
  // Render the most advanced state of the application (in fixture mode the
  // snapshots are lifecycle stages; the last one is the complete picture).
  const active = snapshots[snapshots.length - 1] ?? null;

  if (active === null) {
    return <PendingPanel>No application snapshot is available.</PendingPanel>;
  }

  const app = active.data;

  const stages: StageDef[] = [
    {
      id: "stage-claims",
      num: "01",
      label: "Claims",
      done: app.claims.length > 0,
      chip:
        app.claims.length > 0
          ? `${app.claims.length} claim${app.claims.length === 1 ? "" : "s"}`
          : "pending",
    },
    {
      id: "stage-screening",
      num: "02",
      label: "Screening",
      done: app.axes !== null,
      chip: app.axes !== null ? "3 axes" : "pending",
    },
    {
      id: "stage-diligence",
      num: "03",
      label: "Diligence",
      done: app.diligence !== null,
      chip:
        app.diligence !== null
          ? `${app.diligence.claims.length} checked`
          : "pending",
    },
    {
      id: "stage-memo",
      num: "04",
      label: "Memo",
      done: app.memo !== null,
      chip: app.memo !== null ? "complete" : "pending",
    },
    ...(app.adversarial !== null
      ? [
          {
            id: "stage-adversarial",
            num: "05",
            label: "Devil’s Advocate",
            done: true,
            chip: `${app.adversarial.objections.length} objection${
              app.adversarial.objections.length === 1 ? "" : "s"
            }`,
          },
        ]
      : []),
  ];

  const [claimsStage, screeningStage, diligenceStage, memoStage] = stages;
  const adversarialStage = stages[4];

  return (
    <div>
      {/* Sticky header — deal identity on the left, stage anchor nav right. */}
      <div className="sticky top-0 z-10 -mx-6 -mt-8 border-b border-zinc-200 bg-[#F7F7FA]/95 px-6 pb-3 pt-6 backdrop-blur lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                {app.company_name}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-400">
              <span>{app.application_id}</span>
              <Link
                href={`/founders/${app.founder_id}`}
                className="underline underline-offset-2 transition-colors hover:text-indigo-600"
              >
                {app.founder_id}
              </Link>
            </div>
          </div>
          <nav
            aria-label="Pipeline stages"
            className="flex flex-wrap items-center gap-1.5"
          >
            {stages.map((stage) => (
              <a
                key={stage.id}
                href={`#${stage.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span
                  className={cn(
                    stage.done ? "text-indigo-600" : "text-zinc-400",
                  )}
                >
                  {stage.num}
                </span>
                {stage.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Pipeline timeline — one scrollable story, left rail with stage nodes. */}
      <div className="relative mt-6 pl-14">
        <div
          aria-hidden
          className="absolute bottom-6 left-4 top-4 w-px bg-zinc-200"
        />
        <div className="space-y-6">
          <StageSection stage={claimsStage}>
            <ClaimsStage claims={app.claims} />
          </StageSection>

          <StageSection stage={screeningStage}>
            <ScreeningStage axes={app.axes} />
          </StageSection>

          <StageSection stage={diligenceStage}>
            <DiligenceStage
              diligence={app.diligence}
              claims={app.claims}
              evidence={app.evidence}
            />
          </StageSection>

          <StageSection stage={memoStage}>
            <MemoStage
              memo={app.memo}
              diligence={app.diligence}
              evidence={app.evidence}
            />
          </StageSection>

          {app.adversarial !== null && adversarialStage && (
            <StageSection
              stage={adversarialStage}
              cardClassName="border-l-4 border-l-red-500"
            >
              <AdversarialStage
                adversarial={app.adversarial}
                decisionBrief={app.decision_brief}
                claims={app.claims}
                evidence={app.evidence}
              />
            </StageSection>
          )}
        </div>
      </div>
    </div>
  );
}
