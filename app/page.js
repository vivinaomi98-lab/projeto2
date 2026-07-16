"use client";

import { useState } from "react";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [whatYouSell, setWhatYouSell] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function runResearch(e) {
    e.preventDefault();
    if (!companyName.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, website, whatYouSell }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (_) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyBrief() {
    if (!result) return;
    const s = result.snapshot || {};
    const lines = [
      `LEAD RESEARCH BRIEF — ${result.identified?.name || companyName}`,
      result.identified?.website ? `Website: ${result.identified.website}` : "",
      result.identified?.oneLiner ? `${result.identified.oneLiner}` : "",
      "",
      "COMPANY SNAPSHOT",
      `- What they do: ${s.whatTheyDo || "-"}`,
      `- Industry: ${s.industry || "-"}`,
      `- Location: ${s.location || "-"}`,
      `- Estimated size: ${s.estimatedSize || "-"}`,
      "",
      "RECENT SIGNALS",
      ...(result.recentSignals || []).map((x) => `- ${x}`),
      "",
      "LIKELY PAIN POINTS",
      ...(result.painPoints || []).map((x) => `- ${x}`),
      "",
      "OUTREACH ANGLES",
      ...(result.outreachAngles || []).map((x, i) => `${i + 1}. ${x}`),
      "",
      "SOURCES",
      ...(result.sources || []).map((x) => `- ${x.title}: ${x.url}`),
    ];
    navigator.clipboard.writeText(lines.filter((l) => l !== undefined).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="kicker">AI Agent · Real Web Search</div>
        <h1>Lead Research Agent</h1>
        <p className="sub">Turn a company name into a sales-ready research brief in seconds.</p>
      </header>

      <form className="card input-card" onSubmit={runResearch}>
        <label className="field">
          <span className="label">Company name</span>
          <input
            type="text"
            placeholder="e.g. Notion"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </label>

        <div className="row">
          <label className="field">
            <span className="label">Company website <em>(optional)</em></span>
            <input
              type="text"
              placeholder="e.g. notion.so"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <span className="help">Helps when several companies share a name.</span>
          </label>

          <label className="field">
            <span className="label">What you sell <em>(optional)</em></span>
            <input
              type="text"
              placeholder="e.g. VA & automation services"
              value={whatYouSell}
              onChange={(e) => setWhatYouSell(e.target.value)}
            />
            <span className="help">Tailors the pain points and outreach angles.</span>
          </label>
        </div>

        <button className="btn" type="submit" disabled={loading || !companyName.trim()}>
          {loading ? "Researching…" : "Research"}
        </button>
      </form>

      {loading && (
        <div className="card status">
          <div className="spinner" />
          <div>
            <strong>Researching the web…</strong>
            <p>Reading real sources and building your brief. This takes a few seconds.</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="card error">
          <strong>Something went wrong.</strong>
          <p>{error}</p>
        </div>
      )}

      {result && !loading && (
        <section className="results">
          <div className="card identified">
            <div className="idhead">
              <div>
                <div className="idname">{result.identified?.name || companyName}</div>
                {result.identified?.website && (
                  <a className="idweb" href={ensureHttp(result.identified.website)} target="_blank" rel="noreferrer">
                    {result.identified.website}
                  </a>
                )}
              </div>
              <button className="copy" onClick={copyBrief}>{copied ? "Copied ✓" : "Copy brief"}</button>
            </div>
            {result.identified?.oneLiner && <p className="idline">{result.identified.oneLiner}</p>}
            {result.ambiguityNote && result.ambiguityNote.trim() && (
              <div className="ambiguity">⚠️ {result.ambiguityNote}</div>
            )}
          </div>

          <div className="card">
            <h3>Company snapshot</h3>
            <div className="snapgrid">
              <SnapItem k="What they do" v={result.snapshot?.whatTheyDo} />
              <SnapItem k="Industry" v={result.snapshot?.industry} />
              <SnapItem k="Location" v={result.snapshot?.location} />
              <SnapItem k="Estimated size" v={result.snapshot?.estimatedSize} />
            </div>
          </div>

          <ListCard title="Recent signals" items={result.recentSignals} />
          <ListCard title="Likely pain points" items={result.painPoints} />
          <ListCard title="Outreach angles" items={result.outreachAngles} ordered />

          {Array.isArray(result.sources) && result.sources.length > 0 && (
            <div className="card sources">
              <h3>Sources</h3>
              <ul>
                {result.sources.map((s, i) => (
                  <li key={i}>
                    <a href={ensureHttp(s.url)} target="_blank" rel="noreferrer">
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <footer className="foot">Sample project built to demonstrate my process and skills.</footer>
    </main>
  );
}

function SnapItem({ k, v }) {
  return (
    <div className="snapitem">
      <span className="snapk">{k}</span>
      <span className="snapv">{v || "—"}</span>
    </div>
  );
}

function ListCard({ title, items, ordered }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="card">
      <h3>{title}</h3>
      {ordered ? (
        <ol>{items.map((x, i) => <li key={i}>{x}</li>)}</ol>
      ) : (
        <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
      )}
    </div>
  );
}

function ensureHttp(url) {
  if (!url) return "#";
  return url.startsWith("http") ? url : `https://${url}`;
}
