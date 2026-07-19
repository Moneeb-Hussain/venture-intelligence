"use client";

import * as React from "react";
import Link from "next/link";
import { activateFounder } from "@/lib/api";
import { formatTs } from "@/lib/format";
import type { FounderDetail, Trend } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OriginBadge } from "@/components/domain/badges";
import { ScoreWithBand, Sparkline } from "@/components/domain/score";
import { SectionLabel } from "@/components/domain/section-label";
import { SignalRow } from "@/components/domain/signal";

// Founder profile, v2: profile / score / applications / outreach stacked on
// the left, the evidence timeline on the right. Every rendered value comes
// from the FounderDetail fixture shape — only aggregates are derived here.
export function FounderScreen({
  founder,
  founderId,
}: {
  founder: FounderDetail;
  founderId: string;
}) {
  const { profile, signals, score_history, applications } = founder;

  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [activateFailed, setActivateFailed] = React.useState(false);

  // Chronological (oldest -> newest) for the sparkline and history list;
  // the last entry is the current Founder Score.
  const history = [...score_history].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );
  const current = history.length > 0 ? history[history.length - 1] : null;

  // Trend derived from the last two snapshots; undefined when there is not
  // enough history to compare (cold-start founders show no arrow).
  let trend: Trend | undefined;
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const last = history[history.length - 1];
    trend = last.score > prev.score ? "up" : last.score < prev.score ? "down" : "flat";
  }

  // Evidence timeline reads newest-first.
  const timeline = [...signals].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );

  async function onActivate() {
    setPending(true);
    setActivateFailed(false);
    try {
      const res = await activateFounder(founderId);
      setDraft(res.outreach_draft);
    } catch {
      setActivateFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
      {/* LEFT: profile, score, applications, outreach */}
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                {profile.name}
              </h1>
              {profile.headline ? (
                <p className="mt-0.5 text-[13px] text-zinc-600">
                  {profile.headline}
                </p>
              ) : null}
            </div>
            <OriginBadge origin={profile.origin} />
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.location ? (
              <p className="text-[13px] text-zinc-500">{profile.location}</p>
            ) : null}
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-zinc-700">
                {profile.bio}
              </p>
            ) : null}
            <p className="font-mono text-[11px] text-zinc-400">
              {profile.founder_id}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionLabel>Founder Score</SectionLabel>
          </CardHeader>
          <CardContent className="space-y-4">
            {current ? (
              <ScoreWithBand
                score={current.score}
                band={current.band}
                trend={trend}
                size="lg"
              />
            ) : (
              <p className="text-[13px] text-zinc-400">No score recorded yet.</p>
            )}
            {history.length > 0 ? (
              <div className="border-t border-zinc-100 pt-3.5">
                <SectionLabel className="mb-2">History</SectionLabel>
                <Sparkline history={history} />
                <ul className="mt-2.5 space-y-1">
                  {history.map((snap) => (
                    <li
                      key={snap.ts}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="font-mono text-[11px] text-zinc-400">
                        {formatTs(snap.ts)}
                      </span>
                      <span className="text-[13px] tabular-nums text-zinc-700">
                        {snap.score} ± {snap.band}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400">No score history.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionLabel>Applications</SectionLabel>
            <span className="text-[11px] tabular-nums text-zinc-400">
              {applications.length}
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {applications.length > 0 ? (
              <ul className="space-y-1">
                {applications.map((appId) => (
                  <li key={appId}>
                    <Link
                      href={`/applications/${appId}`}
                      className="font-mono text-[13px] text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline"
                    >
                      {appId}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-zinc-400">No applications yet.</p>
            )}
            <p className="text-xs text-zinc-400">
              Outbound founders converge here once a deck arrives — same funnel
              as inbound.
            </p>
          </CardContent>
        </Card>

        {draft === null ? (
          <Card>
            <CardHeader>
              <SectionLabel>Outreach</SectionLabel>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={onActivate} disabled={pending}>
                {pending ? "Activating…" : "Activate"}
              </Button>
              <p className="text-xs text-zinc-400">
                Drafts intro copy for this founder — nothing is ever sent.
              </p>
              {activateFailed ? (
                <p className="text-[13px] text-red-700">
                  Activation failed — try again.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Outreach draft</CardTitle>
              <Badge variant="dashed">draft only — never sent</Badge>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {draft}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT: evidence timeline, newest first */}
      <Card className="min-w-0 self-start">
        <CardHeader>
          <SectionLabel>Evidence Timeline</SectionLabel>
          <span className="text-[11px] tabular-nums text-zinc-400">
            {timeline.length} {timeline.length === 1 ? "signal" : "signals"}
          </span>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {timeline.map((signal) => (
                <SignalRow key={signal.signal_id} signal={signal} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-zinc-400">No signals recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
