import { cn } from "@/lib/cn";

// Mono uppercase micro-label — the system's section marker.
export function SectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}
