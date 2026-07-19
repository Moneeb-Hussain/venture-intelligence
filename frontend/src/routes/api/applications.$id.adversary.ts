import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendAppToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/applications/$id/adversary")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          // Trigger adversarial phase on live backend
          await fetchFromBackend(`/applications/${params.id}/adversary`, {
            method: "POST",
          });
          // Retrieve fully mapped updated application aggregate
          const bApp = await fetchFromBackend(`/applications/${params.id}`);
          const app = mapBackendAppToFrontend(bApp);
          return Response.json(app);
        } catch (e: any) {
          console.error(`Applications adversary run for ${params.id} failed:`, e);
          return new Response(e.message || "Failed to run Devil's Advocate", { status: 500 });
        }
      },
    },
  },
});
