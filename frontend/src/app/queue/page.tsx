import {
  getApplicationSnapshots,
  getAudit,
  getDecisionQueue,
  getMetrics,
} from "@/lib/api";
import type { ApplicationAggregate } from "@/lib/types";
import { QueueScreen } from "@/components/screens/queue-screen";

export default async function QueuePage() {
  const [rows, metrics, audit] = await Promise.all([
    getDecisionQueue(),
    getMetrics(),
    getAudit(),
  ]);

  // The human gate shows memo + verified attacks side by side, so resolve each
  // row's application aggregate (latest snapshot) for its adversarial columns.
  const gateEntries = await Promise.all(
    rows.map(async (row) => {
      try {
        const snapshots = await getApplicationSnapshots(row.application_id);
        const latest = snapshots[snapshots.length - 1];
        return [row.application_id, latest ? latest.data : null] as const;
      } catch {
        return [row.application_id, null] as const;
      }
    }),
  );
  const gate: Record<string, ApplicationAggregate | null> =
    Object.fromEntries(gateEntries);

  return <QueueScreen rows={rows} metrics={metrics} audit={audit} gate={gate} />;
}
