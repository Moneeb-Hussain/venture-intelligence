import { createFileRoute } from '@tanstack/react-router'
import { fetchFromBackend, mapBackendFounderToFrontend } from "@/lib/backend-client";

export type ParsedQuery = {
  technical_founder: boolean | null;
  sectors: string[] | null;
  geos: string[] | null;
  shipped_within_days: number | null;
  prior_vc: boolean | null;
};

const SECTOR_TERMS: Array<[string, string]> = [
  ["ai infra", "AI infra"],
  ["ai", "AI"],
  ["saas", "SaaS"],
  ["deep tech", "deep tech"],
  ["fintech", "fintech"],
  ["biotech", "biotech"],
  ["dev tools", "dev tools"],
  ["open source", "open source"],
  ["llm", "LLM"],
  ["infra", "infra"],
];

const GEO_TERMS: Array<[string, string]> = [
  ["sf", "SF"],
  ["san francisco", "SF"],
  ["nyc", "NYC"],
  ["new york", "NYC"],
  ["london", "London"],
  ["berlin", "Berlin"],
  ["remote", "remote"],
  ["us", "US"],
  ["eu", "EU"],
];

export function parseQuery(q: string): ParsedQuery {
  const s = q.toLowerCase();
  const technical_founder =
    /\btechnical\b/.test(s) || /\bengineer/.test(s) ? true : null;

  const sectors = SECTOR_TERMS.filter(([k]) => s.includes(k)).map(([, v]) => v);
  const geos = GEO_TERMS.filter(([k]) => s.includes(k)).map(([, v]) => v);

  let shipped_within_days: number | null = null;
  const m =
    s.match(/shipped[^0-9]*(\d+)\s*d/) ||
    s.match(/last\s*(\d+)\s*(?:d|day)/) ||
    s.match(/(\d+)\s*days?/);
  if (m) shipped_within_days = parseInt(m[1], 10);
  else if (/\blast month\b/.test(s)) shipped_within_days = 30;
  else if (/\blast week\b/.test(s)) shipped_within_days = 7;

  let prior_vc: boolean | null = null;
  if (/no prior vc|no vc|no funding|unfunded|bootstrap/.test(s)) prior_vc = false;
  else if (/prior vc|funded|raised/.test(s)) prior_vc = true;

  return {
    technical_founder,
    sectors: sectors.length ? Array.from(new Set(sectors)) : null,
    geos: geos.length ? Array.from(new Set(geos)) : null,
    shipped_within_days,
    prior_vc,
  };
}

export const Route = createFileRoute("/api/query")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            q?: string;
          };
          const q = (body.q ?? "").trim();
          
          // Call live backend query
          const backendRes = await fetchFromBackend("/api/query", {
            method: "POST",
            body: JSON.stringify({ q }),
          });
          
          // Fetch full dashboard to resolve profiles
          const bFounders = await fetchFromBackend("/api/dashboard");
          const founders = bFounders.map(mapBackendFounderToFrontend);
          const foundersMap = new Map(founders.map((f: any) => [f.id, f]));
          
          const results = (backendRes.results || []).map((r: any) => {
            const founder = foundersMap.get(r.founder_id) || {
              id: r.founder_id,
              name: r.founder_id.replace(/^fndr_/, ""),
              handle: `@${r.founder_id}`,
              origin: "synthetic",
              score: 75,
              band: 5,
              trend: "flat",
              top_signals: r.why_matched || [],
              has_open_app: false,
              tags: [],
            };
            return {
              founder,
              why_matched: r.why_matched || [],
            };
          });
          
          const parsed = parseQuery(q);
          return Response.json({ q, parsed, results });
        } catch (e: any) {
          console.error("Query backend fetch failed:", e);
          return new Response(e.message || "Query fetch failed", { status: 500 });
        }
      },
    },
  },
});
