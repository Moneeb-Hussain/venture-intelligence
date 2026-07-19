import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "outline" | "ghost" | "approve" | "danger";
type Size = "default" | "sm";

const variantClasses: Record<Variant, string> = {
  // Brand indigo for primary interactive actions.
  default:
    "bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-500 hover:border-indigo-500",
  outline:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-400",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  // Common-sense semantics: green approves, red rejects.
  approve:
    "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500",
  danger:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300",
};

const sizeClasses: Record<Size, string> = {
  default: "h-9 px-4 text-sm",
  sm: "h-7 px-2.5 text-xs",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
