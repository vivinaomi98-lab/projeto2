# AI Lead Research Agent

A small web app: type a company name and an AI agent researches the web in real time
(Google Gemini with Google Search grounding) and returns a **sales-ready research brief
with cited sources**. The Gemini API key stays server-side — it never reaches the browser.

Built with Next.js (App Router). Deploys free on Vercel.

---

## What it does

- Confirms the exact company it found (with an ambiguity note when a name is shared).
- Company snapshot, recent buying signals, likely pain points, 3 personalized outreach angles.
- Clickable **sources** for every claim — the anti-hallucination proof.

---

## 1. Get a free Gemini API key

1. Go to https://aistudio.google.com → **Get API key** → **Create API key**.
2. Copy it. (Free tier, no credit card.)

## 2. Run locally (optional)

```bash
npm install
cp .env.example .env.local        # then paste your key into .env.local
npm run dev                        # open http://localhost:3000
```

## 3. Deploy to Vercel (the live link)

**Option A — via GitHub (recommended)**
1. Create a new GitHub repo and push this folder to it.
2. On https://vercel.com → **Add New → Project** → import the repo.
3. Before deploying, open **Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your key from step 1
4. Click **Deploy**. You get a live URL like `lead-research-agent.vercel.app`.

**Option B — via Vercel CLI**
```bash
npm i -g vercel
vercel                 # follow prompts to link/create the project
vercel env add GEMINI_API_KEY      # paste the key when asked (Production + Preview)
vercel --prod          # deploy to production
```

> Important: never commit your key. `.env.local` is gitignored. On Vercel the key lives
> only in Environment Variables, and it is only used inside the server route
> (`app/api/research/route.js`) — the browser never sees it.

---

## How it works

```
Browser (form)
   │  POST /api/research  { companyName, website, whatYouSell }
   ▼
Next.js server route  ← GEMINI_API_KEY (server-only env var)
   │  calls Gemini (gemini-2.0-flash) with tools: google_search
   ▼
Gemini researches the web → returns JSON brief + sources
   ▼
Browser renders the brief
```

## Tech

- **Next.js 14** (App Router) — frontend + secure API route
- **Google Gemini** (`gemini-2.0-flash`) with **Google Search grounding**
- **Vercel** — hosting

*Sample project built to demonstrate my process and skills.*
