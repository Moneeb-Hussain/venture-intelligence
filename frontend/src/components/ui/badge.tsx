import * as React from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "outline"
  | "solid"
  | "muted"
  | "dashed"
  | "accent"
  | "success"
  | "danger"
  | "warn";

const variantClasses: Record<Variant, string> = {
  outline: "border border-zinc-300 text-zinc-600 bg-white",
  solid: "bg-zinc-900 text-white border border-zinc-900",
  muted: "bg-zinc-100 text-zinc-500 border border-zinc-100",
  dashed: "border border-dashed border-zinc-400 text-zinc-500 bg-white",
  accent: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  danger: "bg-red-50 text-red-700 border border-red-100",
  warn: "bg-amber-50 text-amber-700 border border-amber-100",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "outline", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-px font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
