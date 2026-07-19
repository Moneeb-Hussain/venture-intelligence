"use client";

import Link from "next/link";
import type { ApplicationIndexRow } from "@/lib/api";
import type { ApplicationAggregate } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { OriginBadge, StatusBadge } from "@/components/domain/badges";
import { SectionLabel } from "@/components/domain/section-label";

// Per-deal pipeline position, derived from which stage objects are non-null.
type StageState = "done" | "pending" | "approved" | "rejected";

function stageStates(
  app: ApplicationAggregate,
): { label: string; state: StageState }[] {
  return [
    { label: "Claims", state: app.claims.length > 0 ? "done" : "pending" },
    { label: "Screening", state: app.axes !== null ? "done" : "pending" },
    { label: "Diligence", state: app.diligence !== null ? "done" : "pending" },
    { label: "Memo", state: app.memo !== null ? "done" : "pending" },
    {
      label: "Decision",
      state:
        app.status === "open"
          ? "pending"
          : app.status === "approved"
            ? "approved"
            : "rejected",
    },
  ];
}

const segmentClasses: Record<StageState, string> = {
  done: "bg-indigo-600",
  pending: "bg-zinc-200",
  approved: "bg-emerald-600",
  rejected: "bg-red-400",
};

// Mini pipeline: a horizontal segmented bar, one segment per stage.
function StageProgress({ app }: { app: ApplicationAggregate }) {
  const stages = stageStates(app);
  return (
    <div className="w-full max-w-sm">
      <SectionLabel>Stage progress</SectionLabel>
      <div className="mt-1.5 flex gap-1" aria-label="Pipeline progress">
        {stages.map((stage) => (
          <div key={stage.label} className="flex-1">
            <div
              className={cn("h-1 rounded-full", segmentClasses[stage.state])}
            />
            <div
              className={cn(
                "mt-1 font-mono text-[9px] uppercase tracking-[0.08em]",
                stage.state === "pending" ? "text-zinc-400" : "text-zinc-700",
              )}
            >
              {stage.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function contradictionCount(app: ApplicationAggregate): number {
  return (
    app.diligence?.claims.filter((c) => c.verdict === "contradicted").length ??
    0
  );
}

export function ApplicationsIndexScreen({
  rows,
}: {
  rows: ApplicationIndexRow[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
          Applications
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Inbound decks and activated outbound founders converge here. Each
          deal moves claims → screening → diligence → memo → decision.
        </p>
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400">
            No applications yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map(({ app, founder_name, founder_origin }) => {
              const contradicted = contradictionCount(app);
              return (
                <li
                  key={app.application_id}
                  className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/applications/${app.application_id}`}
                        className="text-sm font-semibold text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {app.company_name}
                      </Link>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/founders/${app.founder_id}`}
                        className="text-[13px] text-zinc-600 underline-offset-2 hover:underline"
                      >
                        {founder_name}
                      </Link>
                      <OriginBadge origin={founder_origin} />
                    </div>
                    <div className="mt-1.5 text-[13px]">
                      {contradicted > 0 ? (
                        <span className="font-medium tabular-nums text-red-600">
                          {contradicted} contradicted{" "}
                          {contradicted === 1 ? "claim" : "claims"}
                        </span>
                      ) : app.diligence !== null ? (
                        <span className="text-emerald-700">
                          All checked claims supported
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          Diligence not run yet
                        </span>
                      )}
                    </div>
                  </div>
                  <StageProgress app={app} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
