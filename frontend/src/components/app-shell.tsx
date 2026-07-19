"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isFixtureMode } from "@/lib/api";
import {
  applicationFixturesById,
  dashboardFixture,
  queueFixture,
} from "@/lib/fixtures";

// Workspace sidebar: the nav is the funnel — three entity collections
// narrowing top to bottom, with live counts. The per-deal process
// (claims → screening → diligence → memo) lives inside each application.
const items: {
  num: string;
  label: string;
  subtitle: string;
  href: string;
  count: number | null;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    num: "01",
    label: "Dashboard",
    subtitle: "Sourced founders",
    href: "/",
    count: isFixtureMode ? dashboardFixture.length : null,
    isActive: (p) => p === "/" || p.startsWith("/founders"),
  },
  {
    num: "02",
    label: "Applications",
    subtitle: "Claims → memo",
    href: "/applications",
    count: isFixtureMode ? Object.keys(applicationFixturesById).length : null,
    isActive: (p) => p.startsWith("/applications"),
  },
  {
    num: "03",
    label: "Decision Queue",
    subtitle: "Human gate",
    href: "/queue",
    count: isFixtureMode ? queueFixture.length : null,
    isActive: (p) => p.startsWith("/queue"),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6 md:flex">
        <div className="px-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
            Workspace
          </div>
          <Link href="/" className="mt-1 block">
            <span className="text-lg font-semibold tracking-tight text-zinc-900">
              FirstCheck
            </span>
          </Link>
          <div className="text-[13px] text-zinc-500">Review console</div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Pipeline">
          {items.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors",
                  active ? "bg-indigo-50" : "hover:bg-zinc-50",
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-indigo-600" />
                )}
                <span
                  className={cn(
                    "pt-0.5 font-mono text-[10px]",
                    active ? "text-indigo-600" : "text-zinc-400",
                  )}
                >
                  {item.num}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-baseline justify-between gap-2 text-sm",
                      active
                        ? "font-medium text-indigo-900"
                        : "font-medium text-zinc-700",
                    )}
                  >
                    {item.label}
                    {item.count !== null && (
                      <span
                        className={cn(
                          "tabular-nums text-[11px]",
                          active ? "text-indigo-500" : "text-zinc-400",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em]",
                      active ? "text-indigo-400" : "text-zinc-400",
                    )}
                  >
                    {item.subtitle}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 px-3">
          {isFixtureMode && (
            <span className="inline-block rounded-md border border-dashed border-zinc-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400">
              fixture mode
            </span>
          )}
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-300">
            Evidence first · human decides
          </div>
        </div>
      </aside>

      {/* Slim top bar on small screens */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-4 border-b border-zinc-200 bg-white px-4 md:hidden">
          <Link href="/" className="text-sm font-semibold text-zinc-900">
            FirstCheck
          </Link>
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "text-sm",
                i.isActive(pathname)
                  ? "font-medium text-indigo-700"
                  : "text-zinc-500",
              )}
            >
              {i.label}
            </Link>
          ))}
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
