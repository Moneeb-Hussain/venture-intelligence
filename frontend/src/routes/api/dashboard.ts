import { createFileRoute } from "@tanstack/react-router";
import { fetchFromBackend, mapBackendFounderToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/dashboard")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const bFounders = await fetchFromBackend("/api/dashboard");
          const founders = bFounders.map(mapBackendFounderToFrontend);
          return Response.json({ founders });
        } catch (e: any) {
          console.error("Dashboard backend fetch failed:", e);
          return new Response(e.message || "Backend fetch failed", { status: 500 });
        }
      },
    },
  },
});
