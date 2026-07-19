"use client";

import * as React from "react";
import Link from "next/link";
import { getDashboard, getScanStatus, runQuery, scanSource } from "@/lib/api";
import { cn } from "@/lib/cn";
import type {
  DashboardRow,
  QueryFilter,
  QueryResponse,
  ScanSource,
  ScanStatusEntry,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { OriginBadge } from "@/components/domain/badges";
import { ScoreWithBand } from "@/components/domain/score";
import { SectionLabel } from "@/components/domain/section-label";

const SCAN_SOURCES: {
  key: ScanSource;
  label: string;
  desc: string;
  filters: string;
}[] = [
  {
    key: "github",
    label: "GitHub",
    desc: "Search AI repositories, topics, and developer bios",
    filters: "gpu, compiler, mlops",
  },
  {
    key: "hn",
    label: "Hacker News",
    desc: "Search Algolia comments, threads, and show-hns",
    filters: "AI infrastructure, pre-seed",
  },
  {
    key: "yc",
    label: "Y Combinator",
    desc: "Batch crawl YC OSS and active company directory feeds",
    filters: "W24, S24 Artificial Intelligence",
  },
];

// Discovery channel: inbound founders applied with a deck; everyone else was
// found by outbound scanning.
type Channel = "all" | "outbound" | "inbound";

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "all", label: "All" },
  { key: "outbound", label: "Outbound" },
  { key: "inbound", label: "Inbound" },
];

function channelOf(origin: string): Channel {
  return origin === "inbound" ? "inbound" : "outbound";
}

// Renders only the non-null / non-empty fields of the parsed QueryFilter.
function filterChips(filter: QueryFilter): string[] {
  const chips: string[] = [];
  if (filter.technical_founder !== null) {
    chips.push(
      filter.technical_founder ? "Technical founder" : "Non-technical founder",
    );
  }
  for (const s of filter.sectors) chips.push(`Sector: ${s}`);
  for (const g of filter.geos) chips.push(`Geo: ${g}`);
  if (filter.shipped_within_days !== null) {
    chips.push(`Shipped ≤ ${filter.shipped_within_days} days`);
  }
  if (filter.prior_vc !== null) {
    chips.push(filter.prior_vc ? "Prior VC" : "No prior VC");
  }
  return chips;
}

// Single-series strip plot: every founder's score as one dot on a 0–100
// baseline. Percentage x-coordinates keep it responsive without distortion.
function ScoreStrip({ rows }: { rows: DashboardRow[] }) {
  return (
    <div className="mt-2">
      <svg
        className="h-7 w-full overflow-visible"
        role="img"
        aria-label="Founder Score distribution on a 0 to 100 scale"
      >
        <line
          x1="0"
          y1="14"
          x2="100%"
          y2="14"
          stroke="#E4E4E7"
          strokeWidth="1"
        />
        {rows.map((r) => (
          <circle
            key={r.founder_id}
            cx={`${r.founder_score}%`}
            cy="14"
            r="4.5"
            fill="#4F46E5"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          >
            <title>{`${r.name} — ${r.founder_score} ± ${r.band}`}</title>
          </circle>
        ))}
      </svg>
      <div
        className="flex justify-between font-mono text-[9px] tabular-nums text-zinc-400"
        aria-hidden="true"
      >
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function HeroPanel({ rows }: { rows: DashboardRow[] }) {
  const inbound = rows.filter((r) => channelOf(r.origin) === "inbound").length;
  const openApps = rows.filter((r) => r.has_open_app).length;
  const avgScore =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, r) => sum + r.founder_score, 0) / rows.length,
        )
      : null;

  return (
    <Card className="bg-gradient-to-br from-indigo-50/60 to-white">
      <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <SectionLabel>Dashboard · Evidence ledger</SectionLabel>
          <h1 className="font-display text-3xl leading-tight text-zinc-900 md:text-4xl">
            Founders, signals, and the proof trail
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Ranked by Founder Score with visible uncertainty. Every row traces
            back to its origin — no averaged composites, no hidden weights.
          </p>
        </div>

        <div className="w-full shrink-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-card lg:w-80">
          <SectionLabel>Snapshot</SectionLabel>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            <Stat label="Founders" value={rows.length} />
            <Stat label="Open apps" value={openApps} />
            <Stat label="Inbound" value={inbound} />
            <Stat label="Outbound" value={rows.length - inbound} />
          </dl>
          {avgScore !== null && (
            <div className="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-3">
              <SectionLabel>Avg score</SectionLabel>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">
                {avgScore}
              </span>
            </div>
          )}
          {rows.length > 0 && (
            <div className="mt-4">
              <SectionLabel>Score distribution</SectionLabel>
              <ScoreStrip rows={rows} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FounderRow({
  row,
  whyMatched,
}: {
  row: DashboardRow;
  whyMatched?: string[];
}) {
  return (
    <Link
      href={`/founders/${row.founder_id}`}
      className="block px-5 py-4 transition-colors hover:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              {row.name}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {row.founder_id}
            </span>
            <OriginBadge origin={row.origin} />
            {row.has_open_app && <Badge variant="accent">open app</Badge>}
          </div>
          {row.top_signals.length > 0 && (
            <div className="space-y-1">
              <SectionLabel>Top signals</SectionLabel>
              <ul className="space-y-0.5">
                {row.top_signals.map((s) => (
                  <li
                    key={s}
                    className="flex gap-1.5 text-[13px] leading-snug text-zinc-600"
                  >
                    <span aria-hidden="true" className="text-zinc-300">
                      ·
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {whyMatched && whyMatched.length > 0 && (
            <div className="space-y-1">
              <SectionLabel>Why matched</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {whyMatched.map((w) => (
                  <Chip key={w} variant="accent">
                    {w}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 space-y-1.5">
          <SectionLabel>Founder score</SectionLabel>
          <ScoreWithBand
            score={row.founder_score}
            band={row.band}
            trend={row.trend}
          />
        </div>
      </div>
    </Link>
  );
}

function ScanPanel({
  onScanned,
}: {
  onScanned: (rows: DashboardRow[]) => void;
}) {
  const [status, setStatus] = React.useState<ScanStatusEntry[] | null>(null);
  const [loading, setLoading] = React.useState<Partial<Record<ScanSource, boolean>>>(
    {},
  );
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancel = false;
    getScanStatus()
      .then((data) => {
        if (!cancel) setStatus(data);
      })
      .catch((err) => console.error("Failed to load scan status", err));
    return () => {
      cancel = true;
    };
  }, []);

  async function trigger(source: ScanSource) {
    setLoading((prev) => ({ ...prev, [source]: true }));
    setMessage(null);
    try {
      const result = await scanSource(source);
      setMessage(
        `Scanned ${source.toUpperCase()}: found ${result.new_founders} new founders and ${result.new_signals} new signals. ${
          result.cached ? "(Using offline cache)" : "(Queried live source)"
        }`,
      );
      const [nextRows, nextStatus] = await Promise.all([
        getDashboard(),
        getScanStatus(),
      ]);
      onScanned(nextRows);
      setStatus(nextStatus);
    } catch (err) {
      setMessage(`Failed to scan ${source}: ${String(err)}`);
    } finally {
      setLoading((prev) => ({ ...prev, [source]: false }));
    }
  }

  return (
    <Card>
      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Sourcing scanners</SectionLabel>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            P0 engine
          </span>
        </div>
        <p className="text-sm text-zinc-600">
          Crawl active technical directories and developer forums. Incoming
          signals are normalized and merged on founder identity.
        </p>
        {message && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-[13px] text-indigo-800">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="shrink-0 font-mono text-sm leading-none text-indigo-600"
              aria-label="Dismiss scan message"
            >
              ×
            </button>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {SCAN_SOURCES.map((src) => {
            const entry = status?.find((s) => s.source === src.key);
            const isLoading = Boolean(loading[src.key]);
            return (
              <div
                key={src.key}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {src.label}
                    </span>
                    <Badge variant={entry?.cached ? "outline" : "accent"}>
                      {entry?.cached ? "cache" : "live"}
                    </Badge>
                  </div>
                  <p className="text-[13px] leading-relaxed text-zinc-600">
                    {src.desc}
                  </p>
                  <div className="font-mono text-[10px] text-zinc-400">
                    <div>
                      Filters:{" "}
                      <span className="italic text-zinc-500">{src.filters}</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-2">
                      <span>
                        Founders:{" "}
                        <strong className="text-zinc-600">
                          {entry?.founders_total ?? 0}
                        </strong>
                      </span>
                      <span>
                        Last:{" "}
                        <strong className="text-zinc-600">
                          {entry?.last_run
                            ? new Date(entry.last_run).toLocaleTimeString()
                            : "Never"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={isLoading}
                  onClick={() => trigger(src.key)}
                >
                  {isLoading ? "Scanning…" : "Crawl & enrich"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function DashboardScreen({ rows: initialRows }: { rows: DashboardRow[] }) {
  const [rows, setRows] = React.useState(initialRows);
  const [q, setQ] = React.useState("");
  const [activeQuery, setActiveQuery] = React.useState<QueryResponse | null>(
    null,
  );
  const [pending, setPending] = React.useState(false);
  const [channel, setChannel] = React.useState<Channel>("all");

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      setActiveQuery(await runQuery(trimmed));
    } finally {
      setPending(false);
    }
  }

  function clearQuery() {
    setActiveQuery(null);
    setQ("");
  }

  const whyMatched = React.useMemo(() => {
    const m = new Map<string, string[]>();
    if (activeQuery) {
      for (const r of activeQuery.results) m.set(r.founder_id, r.why_matched);
    }
    return m;
  }, [activeQuery]);

  const visible = React.useMemo(() => {
    let out = activeQuery
      ? rows.filter((r) => whyMatched.has(r.founder_id))
      : rows;
    if (channel !== "all") {
      out = out.filter((r) => channelOf(r.origin) === channel);
    }
    return [...out].sort((a, b) => b.founder_score - a.founder_score);
  }, [rows, activeQuery, whyMatched, channel]);

  const chips = activeQuery ? filterChips(activeQuery.filter) : [];

  return (
    <div className="space-y-5">
      <HeroPanel rows={rows} />

      <ScanPanel onScanned={setRows} />

      <Card>
        <div className="space-y-3 px-5 py-4">
          <SectionLabel>Query</SectionLabel>
          <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="technical founder, AI infra, shipped last 30 days, no prior VC"
              aria-label="Founder query"
              className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Running…" : "Run"}
            </Button>
          </form>
          {activeQuery && (
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
              <SectionLabel>Parsed filter</SectionLabel>
              {chips.map((c) => (
                <Chip key={c} variant="outline">
                  {c}
                </Chip>
              ))}
              <span className="text-xs tabular-nums text-zinc-400">
                {activeQuery.results.length}{" "}
                {activeQuery.results.length === 1 ? "match" : "matches"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuery}
                className="ml-auto"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-card">
          {CHANNELS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setChannel(c.key)}
              aria-pressed={channel === c.key}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                channel === c.key
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="text-[13px] tabular-nums text-zinc-500">
          {visible.length} of {rows.length} shown
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="px-1 text-sm text-zinc-500">
          No founders match the current filters.
        </p>
      ) : (
        <Card className="divide-y divide-zinc-100 overflow-hidden">
          {visible.map((row) => (
            <FounderRow
              key={row.founder_id}
              row={row}
              whyMatched={whyMatched.get(row.founder_id)}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
