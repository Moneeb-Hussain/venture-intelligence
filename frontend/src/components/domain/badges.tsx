import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type {
  AppStatus,
  ObjectionLabel,
  ObjectionVerification,
  Origin,
  Severity,
  TrustLevel,
  Verdict,
} from "@/lib/types";

// Origin = discovery channel: inbound (founder applied) vs outbound (found by
// scanning github/hn). Synthetic provenance is always visibly tagged with a
// dashed treatment so hand-written data can never pass as scraped.
export function OriginBadge({ origin }: { origin: Origin | string }) {
  if (origin === "synthetic") {
    return <Badge variant="dashed">synthetic</Badge>;
  }
  if (origin === "inbound") {
    return <Badge variant="accent">inbound</Badge>;
  }
  return <Badge variant="outline">outbound · {origin}</Badge>;
}

// Signal provenance chip: synthetic is dashed; real sources render plain.
export function SourceBadge({ source }: { source: string }) {
  if (source === "synthetic") {
    return <Badge variant="dashed">synthetic</Badge>;
  }
  return <Badge variant="outline">{source}</Badge>;
}

const trustClasses: Record<TrustLevel, string> = {
  high: "bg-zinc-900 text-white border border-zinc-900",
  med: "bg-zinc-200 text-zinc-700 border border-zinc-200",
  low: "bg-zinc-100 text-zinc-500 border border-zinc-100",
};

export function TrustBadge({ trust }: { trust: TrustLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-px font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        trustClasses[trust],
      )}
    >
      {trust} trust
    </span>
  );
}

// Common-sense semantics: supported = green, contradicted = red (solid — the
// strongest signal in the system), unverifiable = gray.
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (verdict === "contradicted") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
        contradicted
      </span>
    );
  }
  if (verdict === "supported") {
    return <Badge variant="success">supported</Badge>;
  }
  return <Badge variant="muted">unverifiable</Badge>;
}

export function StatusBadge({ status }: { status: AppStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
        approved
      </span>
    );
  }
  if (status === "rejected") {
    return <Badge variant="danger">rejected</Badge>;
  }
  return <Badge variant="accent">open</Badge>;
}

export function VerificationBadge({
  verification,
}: {
  verification: ObjectionVerification;
}) {
  if (verification === "verified") {
    return <Badge variant="success">verified</Badge>;
  }
  if (verification === "unverified") {
    return <Badge variant="warn">unverified</Badge>;
  }
  return <Badge variant="muted">n/a</Badge>;
}

export function ObjectionLabelBadge({ label }: { label: ObjectionLabel }) {
  return label === "evidence-backed" ? (
    <Badge variant="outline">evidence-backed</Badge>
  ) : (
    <Badge variant="muted">speculation</Badge>
  );
}

// Severity dot + word. Plain-language meaning lives in the legend rendered
// beside the Decision Brief (see application screen).
const severityDot: Record<Severity, string> = {
  red: "bg-red-600",
  yellow: "bg-amber-500",
  dim: "bg-zinc-300",
};

const severityText: Record<Severity, string> = {
  red: "text-red-700 font-semibold",
  yellow: "text-amber-700 font-medium",
  dim: "text-zinc-400 font-medium",
};

export function SeverityLabel({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        severityText[severity],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", severityDot[severity])}
      />
      {severity}
    </span>
  );
}
