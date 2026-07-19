import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/decisions/queue")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const bQueue = await fetchFromBackend("/decisions/queue");
          const queueList: any[] = [];
          
          for (const item of bQueue) {
            try {
              // Fetch full details of the application to get founder info and decision brief
              const bApp = await fetchFromBackend(`/applications/${item.application_id}`);
              
              // Resolve founder name
              const bFounder = await fetchFromBackend(`/founders/${bApp.founder_id}`);
              
              const verdict = item.recommendation.invest ? "invest" : "pass";
              const firstDot = (item.recommendation.rationale || "").indexOf(". ");
              const one_liner = firstDot > 0 
                ? item.recommendation.rationale.slice(0, firstDot + 1) 
                : item.recommendation.rationale;
                
              queueList.push({
                id: item.application_id,
                company: item.company,
                founder_name: bFounder.profile.name,
                founder_id: bApp.founder_id,
                submitted_at: bApp.created_at,
                recommendation: {
                  verdict,
                  amount_usd: item.recommendation.amount,
                  one_liner,
                },
                brief: bApp.decision_brief || null,
                decision: bApp.status === "approved" || bApp.status === "rejected" ? bApp.status : null,
              });
            } catch (err) {
              console.error(`Failed to map queue item ${item.application_id}:`, err);
            }
          }
          
          return Response.json({ queue: queueList });
        } catch (e: any) {
          console.error("Decisions queue GET fetch failed:", e);
          return Response.json({ queue: [] });
        }
      },
    },
  },
});
