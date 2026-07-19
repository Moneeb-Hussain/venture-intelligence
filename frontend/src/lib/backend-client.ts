export function mapBackendFounderToFrontend(b: any) {
  return {
    id: b.founder_id,
    name: b.name,
    handle: b.handle || `@${b.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    origin: b.origin,
    score: b.founder_score,
    band: b.band,
    trend: b.trend,
    top_signals: b.top_signals || [],
    has_open_app: b.has_open_app ?? false,
    tags: b.tags || [],
  };
}

export function mapBackendAppToFrontend(a: any) {
  // Map claims
  const claims = (a.claims || []).map((c: any) => {
    let sourceSpan = null;
    if (c.source_span) {
      sourceSpan = {
        location: "slide " + (c.slide_number || 6), // backend slide number if available
        quote: c.source_span,
      };
    }
    
    // Find matching DiligenceClaim if available to populate trust/verdict
    let trust = "med";
    let verdict = "unverifiable";
    let note = "";
    let linkedSignalId = null;
    
    if (a.diligence && a.diligence.claims) {
      const dc = a.diligence.claims.find((item: any) => item.claim_id === c.claim_id);
      if (dc) {
        verdict = dc.verdict;
        trust = dc.verdict === "contradicted" ? "contradicted" : dc.trust;
        note = dc.note;
        if (dc.evidence && dc.evidence.length > 0) {
          linkedSignalId = dc.evidence[0];
        }
      }
    }
    
    return {
      id: c.claim_id,
      type: c.type || "traction",
      text: c.text,
      source_span: sourceSpan,
      trust,
      verdict,
      linked_signal_id: linkedSignalId,
    };
  });

  // Map axes to screen tab AxisCards
  let screen = null;
  if (a.axes) {
    const f = a.axes.founder;
    const m = a.axes.market;
    const i = a.axes.idea_vs_market;
    
    screen = [
      {
        key: "founder",
        label: "Founder",
        verdict: f.score >= 8 ? "pass" : f.score >= 5 ? "neutral" : "concern",
        trend: f.trend,
        headline: f.rationale.split(/[.!?]/)[0] + ".",
        rationale: f.rationale,
        factors: ["Score: " + f.score, "Cadence: " + f.trend],
      },
      {
        key: "market",
        label: "Market",
        verdict: m.rating === "bullish" ? "pass" : m.rating === "neutral" ? "neutral" : "concern",
        trend: m.rating === "bullish" ? "up" : m.rating === "neutral" ? "flat" : "down",
        headline: m.rationale.split(/[.!?]/)[0] + ".",
        rationale: m.rationale,
        factors: ["Rating: " + m.rating],
      },
      {
        key: "idea_vs_market",
        label: "Idea vs Market",
        verdict: i.verdict === "survives" ? "pass" : i.verdict === "pivot" ? "neutral" : "concern",
        trend: i.verdict === "survives" ? "up" : i.verdict === "pivot" ? "flat" : "down",
        headline: i.rationale.split(/[.!?]/)[0] + ".",
        rationale: i.rationale,
        factors: ["Verdict: " + i.verdict],
      },
    ];
  }

  // Map evidence to diligence.signals
  const mappedEvidenceSignals = (a.evidence || []).map((ev: any) => {
    const sId = ev.signal_id;
    const supports: string[] = [];
    const contradicts: string[] = [];
    
    if (a.diligence && a.diligence.claims) {
      for (const dc of a.diligence.claims) {
        if (dc.evidence && dc.evidence.includes(sId)) {
          if (dc.verdict === "supported") {
            supports.push(dc.claim_id);
          } else if (dc.verdict === "contradicted") {
            contradicts.push(dc.claim_id);
          }
        }
      }
    }
    
    return {
      id: sId,
      source: ev.source,
      quote: ev.text,
      supports,
      contradicts,
    };
  });

  const diligence = a.diligence ? {
    signals: mappedEvidenceSignals,
  } : null;

  // Map investment memo
  let memo = null;
  if (a.memo) {
    const s = a.memo.sections;
    const r = a.memo.recommendation;
    
    // Parse hypotheses list from hypotheses string
    const hypotheses = (s.hypotheses || "").split("\n")
      .map((line: string) => line.replace(/^(-\s*|\d+\.\s*)/, "").trim())
      .filter(Boolean);
      
    // Parse SWOT
    const swot = parseSwot(s.swot);
    
    memo = {
      snapshot: s.snapshot,
      problem_product: s.problem_product,
      traction_kpis: s.traction_kpis,
      hypotheses: hypotheses.length ? hypotheses : ["Untested product-market fit"],
      swot: swot,
      recommendation: {
        verdict: r.invest ? "invest" : "pass",
        amount_usd: r.amount,
        rationale: r.rationale,
        based_on: r.based_on || [],
      },
    };
  }

  // Map progress stages
  const stage = {
    claims: claims.length > 0 ? "complete" : "not_run",
    screen: a.axes ? "complete" : "not_run",
    diligence: a.diligence ? "complete" : "not_run",
    memo: a.memo ? "complete" : "not_run",
    adversary: a.adversarial ? "complete" : "not_run",
  };
  
  let progress = 1;
  if (stage.claims === "complete") progress = 1;
  if (stage.screen === "complete") progress = 2;
  if (stage.diligence === "complete") progress = 3;
  if (stage.memo === "complete") progress = 4;
  if (stage.adversary === "complete") progress = 5;

  let decisionBrief = null;
  if (a.decision_brief) {
    const brief = a.decision_brief;
    const contestedList = brief.contested || [];
    
    let redCount = 0;
    let yellowCount = 0;
    let dimCount = 0;
    
    const contestedPairs = contestedList.map((item: any, idx: number) => {
      if (item.severity === "red") redCount++;
      else if (item.severity === "yellow") yellowCount++;
      else if (item.severity === "dim") dimCount++;
      
      const objectionId = `O-${item.objection_i + 1}`;
      return {
        id: `pair-${idx + 1}`,
        severity: item.severity,
        claim_id: item.claim_id,
        objection_id: objectionId,
        label: `Objection ${objectionId} contests Claim ${item.claim_id}`,
      };
    });
    
    decisionBrief = {
      red: redCount,
      yellow: yellowCount,
      dim: dimCount,
      contested_pairs: contestedPairs,
      summary: brief.summary,
    };
  }

  return {
    id: a.application_id,
    founder_id: a.founder_id,
    company_name: a.company_name,
    company: a.company_name,
    created_at: a.created_at || new Date().toISOString(),
    submitted_at: a.created_at || new Date().toISOString(),
    status: a.status || "open",
    deck_text: a.deck_text || "",
    deck_pages: a.deck_pages || 12,
    progress,
    stage,
    claims,
    screen,
    diligence,
    memo,
    adversarial: a.adversarial || null,
    decision_brief: decisionBrief,
    adversary: a.adversarial ? {
      bull_case: a.memo?.recommendation?.rationale || `The bull case rests on ${a.company_name || 'the company'}'s strong thesis alignment and high technical capability.`,
      bear_case: a.axes?.idea_vs_market?.rationale || `The bear case centers on early-stage go-to-market friction and team scaling risk.`,
      kill_criteria: [
        "Failure to acquire 3 pilot customers within 90 days of core feature release.",
        "Inability to source and recruit a seasoned co-founder or head of GTM within 120 days.",
      ],
      objections: (a.adversarial.objections || []).map((o: any, idx: number) => {
        let severity: "red" | "yellow" | "dim" = "dim";
        if (a.decision_brief && a.decision_brief.contested) {
          const matched = a.decision_brief.contested.find((item: any) => item.objection_i === idx);
          if (matched) {
            severity = matched.severity;
          }
        }
        return {
          id: `O-${idx + 1}`,
          persona: a.adversarial.persona || "Devil's Advocate",
          objection: o.text,
          label: o.label === "evidence-backed" || o.label === "evidence_backed" ? "evidence-backed" : "speculation",
          status: o.verification || "unverified",
          severity: severity,
          claim_id: o.targets && o.targets.length > 0 ? o.targets[0] : undefined,
        };
      }),
      decision_brief: decisionBrief,
    } : null,
  };
}

function parseSwot(swotStr: string) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];
  
  const s = swotStr || "";
  const sentences = s.split(/(?=[A-Z][a-z]+:)/g);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.startsWith("Strength")) {
      strengths.push(trimmed.replace(/^Strengths?:\s*/i, "").trim());
    } else if (trimmed.startsWith("Weakness")) {
      weaknesses.push(trimmed.replace(/^Weakness(?:es)?:\s*/i, "").trim());
    } else if (trimmed.startsWith("Opportunity") || trimmed.startsWith("Opportunities")) {
      opportunities.push(trimmed.replace(/^(?:Opportunity|Opportunities):\s*/i, "").trim());
    } else if (trimmed.startsWith("Threat")) {
      threats.push(trimmed.replace(/^Threats?:\s*/i, "").trim());
    } else if (trimmed) {
      strengths.push(trimmed);
    }
  }
  
  return {
    strengths: strengths.length ? strengths : ["Technical founder with deep domain expertise"],
    weaknesses: weaknesses.length ? weaknesses : ["Solo founder risk — no commercial counterpart"],
    opportunities: opportunities.length ? opportunities : ["Observability market growing rapidly"],
    threats: threats.length ? threats : ["Competitors expanding into determinism"]
  };
}

export async function fetchFromBackend(path: string, options?: RequestInit) {
  const baseUrl = process.env.FIRSTCHECK_BACKEND_URL || "https://venture-intelligence-backend-53330586668.us-east5.run.app";
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  console.log(`[Backend Client] Fetching ${url}...`);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.clone().text().catch(() => "Unknown error");
    console.error(`[Backend Client] Error from ${url}: ${response.status} ${text}`);
    throw new Error(`Backend error: ${response.status} ${text}`);
  }
  return response.json();
}
