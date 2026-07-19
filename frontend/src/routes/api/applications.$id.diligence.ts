import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendAppToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/applications/$id/diligence")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          await fetchFromBackend(`/applications/${params.id}/diligence`, {
            method: "POST",
          });
          const bApp = await fetchFromBackend(`/applications/${params.id}`);
          const app = mapBackendAppToFrontend(bApp);
          return Response.json(app);
        } catch (e: any) {
          console.error(`Applications diligence run for ${params.id} failed:`, e);
          return new Response(e.message || "Failed to run diligence", { status: 500 });
        }
      },
    },
  },
});
