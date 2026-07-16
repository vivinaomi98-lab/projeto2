// Secure server-side route: the Gemini API key never reaches the browser.
export const runtime = "nodejs";

const MODEL = "gemini-2.0-flash";

function buildPrompt({ companyName, website, whatYouSell }) {
  return `You are a B2B sales research assistant. Research the company on the web and
return a sales prospecting brief. Use Google Search to find real, current information
and cite your sources.

Company name: ${companyName}
Website (may be empty): ${website || ""}
What the user sells (may be empty): ${whatYouSell || ""}

Return ONLY valid JSON (no markdown, no code fences) in exactly this shape:
{
  "identified": { "name": "official company name", "website": "primary domain", "oneLiner": "one sentence on what they do" },
  "ambiguityNote": "empty string, OR a note if the name matches multiple companies and you had to pick one",
  "snapshot": { "whatTheyDo": "...", "industry": "...", "location": "HQ / main location", "estimatedSize": "employees or scale, best estimate", "website": "..." },
  "recentSignals": ["fact 1 with rough date", "fact 2", "..."],
  "painPoints": ["likely pain 1", "likely pain 2", "..."],
  "outreachAngles": ["opener 1", "opener 2", "opener 3"],
  "sources": [{ "title": "source title", "url": "https://..." }]
}

Rules:
- If a website is given, anchor your research to that domain.
- If the company name is ambiguous and no website is given, pick the most prominent match and explain your choice in "ambiguityNote".
- If "what the user sells" is provided, tailor painPoints and outreachAngles to it.
- Never invent facts. If you cannot verify something, use "not found" rather than guess.
- Every recentSignal should be backed by a source in the sources list.
- outreachAngles must reference real, specific signals (not generic flattery).`;
}

function extractJson(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (_) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req) {
  try {
    const { companyName, website, whatYouSell } = await req.json();

    if (!companyName || !companyName.trim()) {
      return Response.json({ error: "Please enter a company name." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({
        error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project settings.",
      });
    }

    const body = {
      contents: [{ role: "user", parts: [{ text: buildPrompt({ companyName, website, whatYouSell }) }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3 },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const detail = await r.text();
      return Response.json({
        error: `Research request failed (${r.status}). Check your API key and quota.`,
        detail: detail.slice(0, 300),
      });
    }

    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text).filter(Boolean).join("\n");

    if (!text) {
      return Response.json({ error: "The model returned an empty response. Please try again." });
    }

    const parsed = extractJson(text);
    if (!parsed) {
      return Response.json({ error: "Could not parse the research result. Please try again." });
    }

    // Fallback: if the model didn't list sources, pull them from grounding metadata.
    if (!Array.isArray(parsed.sources) || parsed.sources.length === 0) {
      const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      parsed.sources = chunks
        .map((c) => ({ title: c.web?.title || c.web?.uri, url: c.web?.uri }))
        .filter((s) => s.url);
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "Unexpected server error. Please try again." });
  }
}
