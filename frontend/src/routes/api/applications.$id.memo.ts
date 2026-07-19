import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendAppToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/applications/$id/memo")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          await fetchFromBackend(`/applications/${params.id}/memo`, {
            method: "POST",
          });
          const bApp = await fetchFromBackend(`/applications/${params.id}`);
          const app = mapBackendAppToFrontend(bApp);
          return Response.json(app);
        } catch (e: any) {
          console.error(`Applications memo run for ${params.id} failed:`, e);
          return new Response(e.message || "Failed to run memo", { status: 500 });
        }
      },
    },
  },
});
