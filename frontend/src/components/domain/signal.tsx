import { formatTs } from "@/lib/format";
import type { Signal } from "@/lib/types";
import { SourceBadge } from "./badges";

// One evidence signal: mono timestamp, provenance chip, text, optional URL.
export function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-zinc-400">
          {formatTs(signal.ts)}
        </span>
        <SourceBadge source={signal.source} />
        <span className="font-mono text-[11px] text-zinc-400">
          {signal.signal_id}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-zinc-700">{signal.text}</p>
      {signal.url ? (
        <a
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-block font-mono text-[11px] text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
        >
          {signal.url}
        </a>
      ) : null}
    </div>
  );
}
