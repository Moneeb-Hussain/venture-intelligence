import { createFileRoute } from "@tanstack/react-router";
import { fetchFromBackend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/scan/status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const status = await fetchFromBackend("/api/scan/status");
          return Response.json(status);
        } catch (e: any) {
          console.error("Scan status fetch failed:", e);
          return new Response(e.message || "Backend fetch failed", { status: 500 });
        }
      },
    },
  },
});
