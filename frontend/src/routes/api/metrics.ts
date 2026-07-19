import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/metrics")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const metrics = await fetchFromBackend("/metrics");
          return Response.json(metrics);
        } catch (e: any) {
          console.error("Metrics GET fetch failed:", e);
          return Response.json({
            signal_to_decision_min: 0,
            funnel: { sourced: 0, screened: 0, diligenced: 0, decided: 0 },
          });
        }
      },
    },
  },
});
