import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/founders/$id/activate")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          const backendRes = await fetchFromBackend(`/founders/${params.id}/activate`, {
            method: "POST",
          });
          return Response.json({
            founder_id: params.id,
            outreach_draft: backendRes.outreach_draft,
            status: "draft",
            drafted_at: new Date().toISOString(),
          });
        } catch (e: any) {
          console.error(`Activate founder POST for ${params.id} failed:`, e);
          return new Response(e.message || "Failed to generate activate outreach draft", { status: 500 });
        }
      },
    },
  },
});
