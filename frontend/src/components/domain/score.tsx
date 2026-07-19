import { cn } from "@/lib/cn";
import { scoreRange } from "@/lib/format";
import type { ScoreSnapshot, Trend } from "@/lib/types";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

// Trend uses common-sense color plus direction (never color alone).
export function TrendIcon({
  trend,
  className,
}: {
  trend: Trend;
  className?: string;
}) {
  if (trend === "up")
    return (
      <ArrowUpRight
        className={cn("h-3.5 w-3.5 text-emerald-600", className)}
        aria-label="trend up"
      />
    );
  if (trend === "down")
    return (
      <ArrowDownRight
        className={cn("h-3.5 w-3.5 text-red-600", className)}
        aria-label="trend down"
      />
    );
  return (
    <ArrowRight
      className={cn("h-3.5 w-3.5 text-zinc-400", className)}
      aria-label="trend flat"
    />
  );
}

// "59 ± 22" plus a 0–100 uncertainty band with a diamond marker at the score.
export function ScoreWithBand({
  score,
  band,
  trend,
  size = "default",
}: {
  score: number;
  band: number;
  trend?: Trend;
  size?: "default" | "lg";
}) {
  const { lo, hi } = scoreRange(score, band);
  return (
    <div className={cn("min-w-0", size === "lg" ? "w-52" : "w-36")}>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold tabular-nums text-zinc-900",
            size === "lg" ? "text-3xl" : "text-lg",
          )}
        >
          {score}
        </span>
        <span
          className={cn(
            "tabular-nums text-zinc-400",
            size === "lg" ? "text-base" : "text-sm",
          )}
        >
          ± {band}
        </span>
        {trend ? <TrendIcon trend={trend} className="self-center" /> : null}
      </div>
      <div
        className="relative mt-1.5 h-1 w-full rounded-full bg-zinc-100"
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 rounded-full bg-indigo-200"
          style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 1)}%` }}
        />
        <div
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-indigo-600"
          style={{ left: `calc(${score}% - 4px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums text-zinc-300">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

// Minimal score-history sparkline; handles a single point as a dot.
export function Sparkline({
  history,
  className,
}: {
  history: ScoreSnapshot[];
  className?: string;
}) {
  const w = 160;
  const h = 40;
  const pad = 5;
  if (history.length === 0) {
    return (
      <div className={cn("text-xs text-zinc-400", className)}>No history</div>
    );
  }
  const scores = history.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = Math.max(max - min, 1);
  const x = (i: number) =>
    history.length === 1
      ? w / 2
      : pad + (i * (w - 2 * pad)) / (history.length - 1);
  const y = (s: number) => h - pad - ((s - min) * (h - 2 * pad)) / span;
  const points = history.map((p, i) => `${x(i)},${y(p.score)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-10 w-40", className)}
      role="img"
      aria-label="Founder Score history"
    >
      {history.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {history.map((p, i) => (
        <circle
          key={p.ts}
          cx={x(i)}
          cy={y(p.score)}
          r="3"
          fill="#4F46E5"
          stroke="#fff"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
