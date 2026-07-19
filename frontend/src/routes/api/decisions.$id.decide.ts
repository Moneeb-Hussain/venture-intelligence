import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendAppToFrontend } from "@/lib/backend-client";

export const Route = createFileRoute("/api/decisions/$id/decide")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            verdict?: "approved" | "rejected";
            note?: string;
          };
          if (body.verdict !== "approved" && body.verdict !== "rejected") {
            return new Response("verdict must be 'approved' or 'rejected'", { status: 400 });
          }
          
          const action = body.verdict === "approved" ? "approve" : "reject";
          const approver = body.note ? `human (${body.note})` : "human";
          
          // Execute live backend decision mutation
          const backendRes = await fetchFromBackend(`/decisions/${params.id}/decide`, {
            method: "POST",
            body: JSON.stringify({ action, approver }),
          });
          
          // Get the updated application state
          const bApp = await fetchFromBackend(`/applications/${params.id}`);
          const app = mapBackendAppToFrontend(bApp);
          
          // Retrieve latest audit event
          const audits = await fetchFromBackend(`/audit?founder_id=${app.founder_id}`);
          const lastEvent = audits.length > 0 ? {
            at: audits[audits.length - 1].ts,
            stage: audits[audits.length - 1].stage,
            actor: audits[audits.length - 1].actor,
            note: audits[audits.length - 1].detail,
          } : {
            at: new Date().toISOString(),
            stage: "decision",
            actor: approver,
            note: `Human ${backendRes.status} the recommendation.`,
          };
          
          return Response.json({
            id: params.id,
            decision: backendRes.status,
            last_event: lastEvent,
          });
        } catch (e: any) {
          console.error(`Post decision for ${params.id} failed:`, e);
          return new Response(e.message || "Failed to submit decision", { status: 500 });
        }
      },
    },
  },
});
