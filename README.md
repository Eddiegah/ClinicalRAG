# ClinicalRAG

**A clinical Q&A assistant that would rather say "I don't know" than make something up —
and costs $0 to run.**

Every answer is grounded in real PubMed abstracts and cited inline. When the corpus doesn't
cover a question, the backend refuses — deterministically, in code, before the LLM is even
called — instead of quietly hallucinating a plausible-sounding answer.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-clinicalrag.vercel.app-6E56CF?logo=vercel&logoColor=white)](https://clinicalrag.vercel.app)
[![CI](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml/badge.svg)](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue?logo=python&logoColor=white)](backend/requirements.txt)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](frontend/package.json)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://aistudio.google.com/apikey)
[![Cost to run](https://img.shields.io/badge/cost%20to%20run-%240-brightgreen)](#quick-start-run-it-yourself)
[![Corpus](https://img.shields.io/badge/Corpus-1%2C165%20PubMed%20abstracts-blue)](backend/data/topics.yaml)

### **[→ Try it live: clinicalrag.vercel.app](https://clinicalrag.vercel.app)**

Ask it something it should know, then ask it something it shouldn't, and watch it treat those
two cases completely differently instead of confidently bluffing through both. First request
may take ~20–30s if the free backend has spun down from inactivity — everything after that is
instant.

> Educational demo, not medical advice. Every answer ends with a reminder to consult a real
> healthcare professional.

---

## What this is

Ask a general-purpose chatbot a medical question and it answers from whatever it memorized
during training — confidently, fluently, and with no way for you to check its work. Ask it
about something obscure or fictional, and it will often still produce a fluent, wrong answer
rather than admit it doesn't know.

ClinicalRAG takes the opposite stance: it can **only** answer from PubMed abstracts it
actually retrieved for your question, it **must** cite which source backs every claim, and if
retrieval doesn't turn up anything relevant enough, it says so instead of guessing. And unlike
most RAG tutorials, this isn't a "clone it and pray" repo — it's a real, load-bearing
deployment: free LLM calls (Gemini), free local embeddings (ONNX, no API at all), a free
1,165-abstract corpus, a free vector store (ChromaDB), running on Render + Vercel's free
tiers, with CI on every push.

## See it in action

Both of these are real, captured responses from the live deployment linked above — nothing
staged.

**It refuses instead of guessing.** No PubMed abstract about "zorblatt fever" exists, because
it's not a real disease:

```
> What is the treatment for zorblatt fever?

I don't have enough information in my corpus to answer that.

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.
```

**It answers with real citations when the corpus actually covers the question** — including
the kind of "why does this happen" question that's easy to get wrong with a thin corpus (this
exact question used to fail before the corpus was broadened to cover causes/pathophysiology,
not just treatment guidelines — see [What broke, and what fixed it](#what-broke-and-what-fixed-it)):

```
> What are the main causes of type 2 diabetes?

Type 2 diabetes mellitus is a heterogeneous group of metabolic diseases that result from
defects in insulin secretion, insulin action, or both [1]. In children, the disease is viewed
as a continuum of insulin resistance compounded by multiple metabolic defects, including
beta-cell dysfunction and inadequate insulin secretion, alpha-cell dysfunction,
hyperglucagonemia, increased hepatic glucose production, lipotoxicity, inflammation,
deficiencies in incretin production and action, and increased renal glucose reabsorption [4].
The condition is driven by a confluence of genetic and environmental factors [4], with insulin
resistance playing a pivotal role linked to risk factors such as obesity, family history, and
puberty [2].

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.

  [1] Type 2 diabetes mellitus. — 65% match
  [2] Type 2 diabetes in children: clinical aspects and risk factors. — 64% match
  [4] Pathophysiology of Type 2 Diabetes in Children and Adolescents. — 59% match
```

On the live site, citation numbers render as clickable badges inline, sources expand into
cards with a similarity bar, and multi-point answers render as real bullet lists — not raw
markdown asterisks.

## How it works

```mermaid
flowchart LR
    subgraph Ingest["Offline: build the corpus"]
        A[PubMed via<br/>NCBI E-utilities] -->|scripts/ingest.py| B[Chunked<br/>abstracts]
        B --> C[Local ONNX<br/>MiniLM-L6-v2 embeddings]
        C --> D[(ChromaDB<br/>persisted vector store)]
    end

    subgraph Query["Online: answer a question"]
        Q[User question] --> F[FastAPI /chat]
        F --> D
        D -->|top-k retrieval| G{Best match ≥<br/>similarity threshold?}
        G -->|No| H[Refuse — no LLM call]
        G -->|Yes| I[Gemini answers ONLY<br/>from retrieved sources,<br/>cites every claim as (n)]
        I --> J[Next.js chat UI:<br/>answer + expandable sources]
        H --> J
    end
```

The refusal path is enforced in code, not just prompted for: if nothing clears the similarity
threshold, `answer_question()` returns the fixed refusal message and **never calls the LLM at
all** — see [`app/rag/generator.py`](backend/app/rag/generator.py). Even when retrieval *does*
clear the bar, Gemini is instructed to refuse if the passages don't actually answer the
question (topically similar isn't the same as responsive — see below), and when it does, the
API drops the attached sources too, so the UI never shows "5 sources" next to "I don't know."

## What broke, and what fixed it

Built, then actually hardened — not just happy-path demoed:

- **Coverage gap** — early on, `"what causes type 2 diabetes"` was refused even though the
  corpus had plenty of diabetes content, because every diabetes topic was phrased around
  *management*, and a management-guideline abstract doesn't really answer a *causes* question
  despite scoring high on similarity. Fixed by broadening `topics.yaml` from 20 to 74 queries,
  explicitly covering causes/risk-factors and symptoms/diagnosis angles per condition, not
  just treatment — corpus grew from 374 to 1,165 abstracts.
- **Contradictory UI** — when Gemini itself judged the retrieved passages insufficient (rather
  than the code-level similarity gate), the API still attached those sources to the response,
  so the UI showed "5 sources" right next to "I don't have enough information." Fixed by
  dropping sources whenever the answer text *is* the refusal message, regardless of which
  layer produced it.
- **CORS-masked errors** — a FastAPI/Starlette gotcha: exceptions handled by the framework's
  built-in `@app.exception_handler(Exception)` are wired into `ServerErrorMiddleware`, which
  wraps `CORSMiddleware` from the *outside* — so a 500 built that way never gets CORS headers,
  and the browser reports a confusing "blocked by CORS policy" instead of the real error. Fixed
  with a custom middleware positioned *inside* `CORSMiddleware` instead — regression-tested in
  [`tests/test_error_handling.py`](backend/tests/test_error_handling.py).
- **Silent infinite hang** — `fetch()` has no built-in timeout. A request that lands during a
  backend restart (e.g. a Render redeploy killing the old container mid-request) would just
  hang forever with the typing indicator spinning and no way to recover but a page refresh.
  Fixed with a 45s `AbortController` timeout and a clear, actionable error message.
- **Cold-start download** — Chroma's embedding model lazily downloads ~80MB on first use. On a
  free tier that spins down between requests, every wake-up would re-trigger that download,
  making the first real request agonizingly slow. Fixed by baking the model (and the corpus)
  into the Docker image at build time — verified with a fresh container: first request under
  1 second, no download.

## Features

- 🌐 **Actually deployed** — a real backend (Render) + frontend (Vercel) behind the "Try it
  live" link above, not just a "clone and run locally" repo
- 🔒 **Grounded, not guessed** — answers come only from retrieved passages, never the model's
  own training data
- 🙅 **Honest refusal, twice-enforced** — a tuned similarity gate blocks low-confidence
  retrieval before the LLM is called, *and* the LLM itself is instructed to refuse if what it
  retrieved doesn't actually answer the question
- 📎 **Real citations** — every source links to its actual PubMed page, rendered inline as
  clickable badges, with an expandable source card per citation (title, journal, year,
  similarity score)
- ✨ **Polished chat UI** — smooth message/typing animations, markdown-aware answer rendering
  (bullet lists, bold), one-click example questions
- 💸 **Actually free** — Gemini's free tier for generation, local ONNX embeddings, a free
  1,165-abstract corpus, and free hosting — $0 to run this end to end
- 🧪 **Tested** — pytest on the backend, Vitest on the frontend, both run in CI on every push
- ⚡ **One-command setup** — `setup.sh` / `setup.ps1` create the venv, install everything, and
  seed your `.env` in one shot

## Stack

| Layer      | Tech                                                              |
| ---------- | ------------------------------------------------------------------ |
| Backend    | FastAPI, ChromaDB (persisted, local), `google-genai` SDK (Gemini) |
| Embeddings | ONNX MiniLM-L6-v2 (bundled with Chroma — free, runs locally)      |
| Corpus     | 1,165 PubMed abstracts via NCBI E-utilities (no API key required) |
| Frontend   | Next.js 16, TypeScript, Tailwind, Motion (animations)             |
| Testing    | pytest + pytest-asyncio, Vitest + Testing Library                 |
| Hosting    | Render (backend, Docker), Vercel (frontend)                       |
| CI/CD      | GitHub Actions                                                    |

## Quick start (run it yourself)

### 1. Get a free API key

**[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** — sign in with any
Google account, click "Create API key." No credit card, no trial period, genuinely free tier.

### 2. Backend

The setup script creates the venv, installs everything, and seeds `.env` for you:

```bash
cd backend
./setup.sh          # macOS/Linux/Git Bash
# or on native PowerShell:
# .\setup.ps1
```

Then open `backend/.env` and paste in your key:

```
GEMINI_API_KEY=your-key-here
```

The corpus (~1,165 PubMed abstracts across 74 topics — causes, symptoms, and treatment for
each of ~35 common conditions) is already committed at `backend/data/chroma/`, so you can run
immediately. To rebuild or extend it, see [Extending the corpus](#extending-the-corpus) below.

Run the API and the tests:

```bash
uvicorn app.main:app --reload
pytest
```

<details>
<summary>Manual setup (if you'd rather not run the script)</summary>

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env      # then add your GEMINI_API_KEY
```

</details>

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
npm test
```

Open http://localhost:3000 and ask it something.

## Extending the corpus

Add a topic to [`backend/data/topics.yaml`](backend/data/topics.yaml) — just a PubMed search
query and how many abstracts to pull — and re-run:

```bash
python scripts/ingest.py
```

It upserts by PMID, so re-running is always safe. `backend/data/chroma/` is committed to the
repo (not gitignored) so a fresh clone or deploy has a working corpus immediately, instead of
depending on PubMed's API being reachable at build time.

## Deploying your own

This exact setup is what's running behind the live demo link:

- **Backend → [Render](https://render.com)**: [one-click deploy from `render.yaml`](https://render.com/deploy?repo=https://github.com/Eddiegah/ClinicalRAG).
  Set `GEMINI_API_KEY` in the Render dashboard when prompted. The Docker image bakes in both
  the corpus and the embedding model at build time (see [`backend/Dockerfile`](backend/Dockerfile)),
  so cold starts are fast, not download-triggering.
- **Frontend → [Vercel](https://vercel.com)**: import the repo, set the root directory to
  `frontend`, and set `NEXT_PUBLIC_API_URL` to your Render backend's URL.
- Once both are live, set `FRONTEND_ORIGINS` on Render to your Vercel URL so CORS allows the
  frontend to call it.

## Roadmap / explicitly out of scope for v1

- Auth / multi-user support
- Streaming token-by-token responses
- Corpus sources beyond PubMed (e.g. clinical guideline PDFs) — the architecture already
  separates ingestion from retrieval, so a second source is a new ingest script, not a
  rewrite

## License

[MIT](LICENSE) © Edmund Eric Gah
