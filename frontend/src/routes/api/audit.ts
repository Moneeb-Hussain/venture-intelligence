import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/audit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const appId = url.searchParams.get("application_id") ?? undefined;
          
          if (appId) {
            // Resolve founder_id from application
            const app = await fetchFromBackend(`/applications/${appId}`);
            const audits = await fetchFromBackend(`/audit?founder_id=${app.founder_id}`);
            const mapped = audits.map((e: any) => ({
              at: e.ts,
              stage: e.stage,
              actor: e.actor,
              note: e.detail,
              application_id: appId,
              company: app.company_name,
            }));
            return Response.json({ audit: mapped });
          } else {
            // Global audit log
            const bFounders = await fetchFromBackend("/api/dashboard");
            const allAudits: any[] = [];
            
            for (const bf of bFounders) {
              try {
                const bDetails = await fetchFromBackend(`/founders/${bf.founder_id}`);
                const audits = await fetchFromBackend(`/audit?founder_id=${bf.founder_id}`);
                
                // Let's resolve company name from their application if available
                let company = "Venture";
                if (bDetails.applications && bDetails.applications.length > 0) {
                  try {
                    const app = await fetchFromBackend(`/applications/${bDetails.applications[0]}`);
                    company = app.company_name;
                  } catch (err) {
                    console.error("Failed to load app for audit company resolving:", err);
                  }
                }
                
                audits.forEach((e: any) => {
                  allAudits.push({
                    at: e.ts,
                    stage: e.stage,
                    actor: e.actor,
                    note: e.detail,
                    application_id: bDetails.applications?.[0] || "",
                    company,
                  });
                });
              } catch (founderErr) {
                console.error(`Failed to load audits for founder ${bf.founder_id}:`, founderErr);
              }
            }
            
            // Sort by timestamp descending
            allAudits.sort((x, y) => y.at.localeCompare(x.at));
            return Response.json({ audit: allAudits });
          }
        } catch (e: any) {
          console.error("Audit GET fetch failed:", e);
          return Response.json({ audit: [] });
        }
      },
    },
  },
});
