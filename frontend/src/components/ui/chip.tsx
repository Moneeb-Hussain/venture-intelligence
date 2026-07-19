import * as React from "react";
import { cn } from "@/lib/cn";

// Small normal-case data chip — the one chip system shared by every screen.
// (Badge is the uppercased mono label primitive; Chip keeps fixture text
// verbatim.)
type Variant = "neutral" | "outline" | "mono" | "accent";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  outline: "border border-zinc-300 bg-white text-zinc-600",
  mono: "border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-500",
  accent: "bg-indigo-50 text-indigo-700",
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Chip({ className, variant = "neutral", ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
