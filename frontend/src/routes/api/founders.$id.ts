import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendFounderToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/founders/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const id = params.id;
          
          // 1. Fetch details from backend
          const backendRes = await fetchFromBackend(`/founders/${id}`);
          
          // 2. Fetch full dashboard to get founder's current score / band / trend info
          let founder;
          try {
            const bFounders = await fetchFromBackend("/api/dashboard");
            const founders = bFounders.map(mapBackendFounderToFrontend);
            founder = founders.find((f: any) => f.id === id);
          } catch (e) {
            console.warn("Failed to fetch dashboard list during founder details mapping:", e);
          }
          
          // Fallback if not found in dashboard list (create from profile info)
          if (!founder) {
            const bProfile = backendRes.profile;
            const history = backendRes.score_history || [];
            founder = {
              id: id,
              name: bProfile.name,
              handle: `@${bProfile.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              origin: bProfile.origin,
              score: history.length > 0 ? history[history.length - 1].score : 75,
              band: history.length > 0 ? history[history.length - 1].band : 5,
              trend: "flat",
              top_signals: [],
              has_open_app: (backendRes.applications || []).length > 0,
              tags: [],
            };
          }
          
          // 3. Map signals
          const mappedSignals = (backendRes.signals || []).map((s: any) => {
            const sourceLower = (s.source || "").toLowerCase();
            let kind = "post";
            if (sourceLower.includes("commit")) kind = "commit";
            else if (sourceLower.includes("post") || sourceLower.includes("hn")) kind = "post";
            else if (sourceLower.includes("mention")) kind = "mention";
            else if (sourceLower.includes("deck")) kind = "deck";
            else if (sourceLower.includes("release")) kind = "release";
            
            let source = "synthetic";
            if (sourceLower.includes("github")) source = "github";
            else if (sourceLower.includes("hn") || sourceLower.includes("hacker news")) source = "hn";
            else if (sourceLower.includes("inbound")) source = "inbound";
            
            return {
              id: s.signal_id,
              kind,
              source,
              at: s.ts,
              text: s.text,
              url: s.url || undefined,
            };
          });
          
          // 4. Map applications
          const mappedApps = [];
          for (const appId of backendRes.applications || []) {
            try {
              const appData = await fetchFromBackend(`/applications/${appId}`);
              
              let status = "screening";
              const sLower = (appData.status || "").toLowerCase();
              if (sLower === "screening" || sLower === "open") status = "screening";
              else if (sLower === "diligence") status = "diligence";
              else if (sLower === "memo") status = "memo";
              else if (sLower === "decision") status = "decision";
              else if (sLower === "declined" || sLower === "rejected") status = "declined";
              
              mappedApps.push({
                id: appData.id,
                company: appData.company_name,
                status,
                submitted_at: appData.created_at,
              });
            } catch (err) {
              console.error(`Failed to load app detail for ${appId}:`, err);
            }
          }
          
          // 5. Construct profile
          const profile = {
            id: id,
            headline: backendRes.profile.headline || "",
            location: backendRes.profile.location || "",
            bio: backendRes.profile.bio || "",
            score_history: (backendRes.score_history || []).map((h: any) => ({
              at: h.ts,
              score: h.score,
            })),
            signals: mappedSignals,
            applications: mappedApps,
            outreach_draft: "", // returned by activate endpoint
          };
          
          return Response.json({ founder, profile });
        } catch (e: any) {
          console.error(`Founders detail GET for ${params.id} failed:`, e);
          return new Response(e.message || "Founder detail fetch failed", { status: 404 });
        }
      },
    },
  },
});
