import { createFileRoute } from "@tanstack/react-router";
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/scan/github")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const result = await fetchFromBackend("/api/scan/github", {
            method: "POST",
            body: JSON.stringify(body),
          });
          return Response.json(result);
        } catch (e: any) {
          console.error("Scan GitHub failed:", e);
          return new Response(e.message || "Scan GitHub failed", { status: 500 });
        }
      },
    },
  },
});
