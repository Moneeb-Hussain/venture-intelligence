import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend } from "@/lib/backend-client";

function getAppProgress(a: any): number {
  let progress = 1; // stage 1 complete (claims extracted)
  if (a.screen) progress = 2;
  if (a.diligence_memo) progress = 4; // since diligence + memo are created together
  if (a.adversarial) progress = 5;
  return progress;
}

export const Route = createFileRoute("/api/applications")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const bFounders = await fetchFromBackend("/api/dashboard");
          const appsList: any[] = [];
          
          for (const bf of bFounders) {
            try {
              const bDetails = await fetchFromBackend(`/founders/${bf.founder_id}`);
              for (const appId of bDetails.applications || []) {
                try {
                  const bApp = await fetchFromBackend(`/applications/${appId}`);
                  appsList.push({
                    id: bApp.id,
                    company: bApp.company_name,
                    founder_name: bDetails.profile.name,
                    founder_id: bDetails.profile.founder_id,
                    submitted_at: bApp.created_at,
                    progress: getAppProgress(bApp),
                  });
                } catch (appErr) {
                  console.error(`Failed to load app ${appId} in list:`, appErr);
                }
              }
            } catch (founderErr) {
              console.error(`Failed to load details for founder ${bf.founder_id}:`, founderErr);
            }
          }
          
          return Response.json({ applications: appsList });
        } catch (e: any) {
          console.error("Applications list GET fetch failed:", e);
          return new Response(e.message || "Applications fetch failed", { status: 500 });
        }
      },
    },
  },
});
