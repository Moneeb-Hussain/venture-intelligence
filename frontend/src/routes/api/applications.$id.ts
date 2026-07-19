import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendAppToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/applications/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const bApp = await fetchFromBackend(`/applications/${params.id}`);
          const app = mapBackendAppToFrontend(bApp);
          return Response.json(app);
        } catch (e: any) {
          console.error(`Applications details fetch for ${params.id} failed:`, e);
          return new Response(e.message || "Application not found", { status: 404 });
        }
      },
    },
  },
});
