"use client";

import * as React from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { decideApplication, getAudit } from "@/lib/api";
import { formatAmount, formatMinutes, formatTs } from "@/lib/format";
import type {
  ApplicationAggregate,
  AuditEntry,
  Metrics,
  QueueRow,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/domain/badges";
import { SectionLabel } from "@/components/domain/section-label";

type DecisionState =
  | { phase: "pending"; action: "approve" | "reject" }
  | { phase: "decided"; status: "approved" | "rejected" };

interface QueueScreenProps {
  rows: QueueRow[];
  metrics: Metrics;
  audit: AuditEntry[];
  gate: Record<string, ApplicationAggregate | null>;
}

export function QueueScreen({ rows, metrics, audit, gate }: QueueScreenProps) {
  const [decisions, setDecisions] = React.useState<
    Record<string, DecisionState>
  >({});
  const [auditEntries, setAuditEntries] = React.useState(audit);
  const [auditOpen, setAuditOpen] = React.useState(false);

  const signalToDecision =
    metrics.signal_to_decision_min == null
      ? "—"
      : formatMinutes(metrics.signal_to_decision_min);

  async function decide(row: QueueRow, action: "approve" | "reject") {
    setDecisions((d) => ({
      ...d,
      [row.application_id]: { phase: "pending", action },
    }));
    try {
      // The response confirms transport; the displayed state follows the
      // human's own action rather than a synthesized fixture body.
      await decideApplication(row.application_id, action, "Yuning");
      setDecisions((d) => ({
        ...d,
        [row.application_id]: {
          phase: "decided",
          status: action === "approve" ? "approved" : "rejected",
        },
      }));
      try {
        setAuditEntries(await getAudit());
      } catch {
        // Keep the page-load audit if the refetch fails.
      }
      if (action === "approve") setAuditOpen(true);
    } catch {
      // Roll back to undecided so the human can retry.
      setDecisions((d) => {
        const next = { ...d };
        delete next[row.application_id];
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Decision Queue
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Recommendations awaiting the human gate. Approval writes the check.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">
          <Timer className="h-3.5 w-3.5 text-indigo-500" />
          signal → decision:{" "}
          <span className="font-semibold tabular-nums text-indigo-900">
            {signalToDecision}
          </span>
        </span>
      </div>

      {/* Queue */}
      <Card>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400">
            The queue is empty. Nothing is awaiting a decision.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <QueueRowItem
                key={row.application_id}
                row={row}
                aggregate={gate[row.application_id] ?? null}
                state={decisions[row.application_id]}
                onDecide={decide}
                onViewAudit={() => setAuditOpen(true)}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Audit drawer */}
      <Sheet open={auditOpen} onOpenChange={setAuditOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Audit trail</SheetTitle>
          <ol className="ml-1 mt-6 border-l border-zinc-200">
            {auditEntries.length === 0 && (
              <li className="relative pb-6 pl-5">
                <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full border border-zinc-300 bg-white" />
                <p className="text-[13px] text-zinc-400">
                  No audit entries recorded.
                </p>
              </li>
            )}
            {auditEntries.map((entry, i) => (
              <li key={`${entry.ts}-${i}`} className="relative pb-6 pl-5">
                <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full border border-zinc-300 bg-white" />
                <div className="font-mono text-[11px] text-zinc-400">
                  {formatTs(entry.ts)}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{entry.stage}</Badge>
                  <span className="text-[13px] text-zinc-600">
                    <span className="font-medium text-zinc-900">
                      {entry.actor}
                    </span>{" "}
                    · {entry.action}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
                  {entry.detail}
                </p>
              </li>
            ))}
            <li className="relative pl-5">
              <span className="absolute -left-[3.5px] top-1 h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <p className="text-sm font-semibold text-zinc-900">
                first signal → decision:{" "}
                <span className="tabular-nums">{signalToDecision}</span>
              </p>
            </li>
          </ol>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Verified attacks shown side by side with the memo at the gate.
function VerifiedAttacks({
  aggregate,
}: {
  aggregate: ApplicationAggregate | null;
}) {
  const adversarial = aggregate?.adversarial ?? null;
  if (adversarial === null) {
    return (
      <p className="mt-1.5 text-[13px] text-zinc-400">
        No adversarial pass yet.
      </p>
    );
  }
  const verified = adversarial.objections.filter(
    (o) => o.verification === "verified",
  );
  return (
    <div>
      {verified.length > 0 ? (
        <ul className="mt-1.5 space-y-2.5">
          {verified.map((objection, i) => (
            <li
              key={i}
              className="border-l-2 border-red-300 pl-2.5 text-sm leading-relaxed text-zinc-700"
            >
              {objection.text}
              <span className="mt-1 flex flex-wrap gap-1.5">
                {objection.targets.map((claimId) => (
                  <Chip key={claimId} variant="mono">
                    {claimId}
                  </Chip>
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[13px] text-zinc-400">No verified attacks.</p>
      )}
      {aggregate?.decision_brief ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-500">
          {aggregate.decision_brief.summary}
        </p>
      ) : null}
    </div>
  );
}

function QueueRowItem({
  row,
  aggregate,
  state,
  onDecide,
  onViewAudit,
}: {
  row: QueueRow;
  aggregate: ApplicationAggregate | null;
  state: DecisionState | undefined;
  onDecide: (row: QueueRow, action: "approve" | "reject") => void;
  onViewAudit: () => void;
}) {
  const rec = row.recommendation;
  const pending = state?.phase === "pending" ? state.action : null;

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/applications/${row.application_id}`}
              className="text-sm font-semibold text-zinc-900 underline-offset-2 hover:underline"
            >
              {row.company}
            </Link>
            <Link
              href={`/applications/${row.application_id}`}
              className="font-mono text-[11px] text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-900"
            >
              {row.memo_id}
            </Link>
            {state?.phase === "decided" && (
              <StatusBadge status={state.status} />
            )}
          </div>
          <div
            className={
              rec.invest
                ? "mt-1.5 text-sm font-medium tabular-nums text-emerald-700"
                : "mt-1.5 text-sm text-zinc-500"
            }
          >
            {rec.invest ? `Invest ${formatAmount(rec.amount)}` : "Do not invest"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {state?.phase === "decided" ? (
            <Button variant="ghost" size="sm" onClick={onViewAudit}>
              View audit
            </Button>
          ) : (
            <>
              <Button
                variant="approve"
                size="sm"
                disabled={pending !== null}
                onClick={() => onDecide(row, "approve")}
              >
                {pending === "approve"
                  ? "Approving…"
                  : `Approve ${formatAmount(rec.amount)}`}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={pending !== null}
                onClick={() => onDecide(row, "reject")}
              >
                {pending === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Human gate: memo and verified attacks side by side. */}
      <div className="mt-3 grid gap-x-8 gap-y-4 border-t border-zinc-100 pt-3 sm:grid-cols-2">
        <div>
          <SectionLabel>Memo</SectionLabel>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
            {rec.rationale}
          </p>
          {rec.based_on.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-400">
                based on
              </span>
              {rec.based_on.map((claimId) => (
                <Chip key={claimId} variant="mono">
                  {claimId}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-zinc-400">
              No supporting claims cited.
            </p>
          )}
        </div>
        <div>
          <SectionLabel>Verified attacks</SectionLabel>
          <VerifiedAttacks aggregate={aggregate} />
        </div>
      </div>
    </li>
  );
}
