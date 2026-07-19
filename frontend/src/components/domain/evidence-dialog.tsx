"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Signal } from "@/lib/types";
import { SignalRow } from "./signal";
import { cn } from "@/lib/cn";

// Click-through from referenced evidence IDs to the resolved signals in the
// aggregate `evidence` array (already resolved — no second request needed).
export function EvidenceDialog({
  title,
  evidenceIds,
  evidence,
  children,
  className,
}: {
  title: string;
  evidenceIds: string[];
  evidence: Signal[];
  children: React.ReactNode;
  className?: string;
}) {
  const resolved = evidenceIds.map((id) => ({
    id,
    signal: evidence.find((s) => s.signal_id === id) ?? null,
  }));
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
            className,
          )}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <div className="mt-2 divide-y divide-zinc-100">
          {resolved.map(({ id, signal }) =>
            signal ? (
              <SignalRow key={id} signal={signal} />
            ) : (
              <div key={id} className="py-2.5 font-mono text-xs text-zinc-400">
                unresolved evidence: {id}
              </div>
            ),
          )}
          {resolved.length === 0 && (
            <p className="py-2.5 text-sm text-zinc-400">
              No evidence referenced.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
