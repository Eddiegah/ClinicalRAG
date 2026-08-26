# ClinicalRAG

**A clinical Q&A assistant that would rather say "I don't know" than make something up —
and costs $0 to run.**

Every answer is grounded in a local corpus of real PubMed abstracts and cited inline. If the
corpus doesn't cover the question, the backend refuses — deterministically, before the LLM
is even called — instead of quietly hallucinating a plausible-sounding answer.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-clinicalrag.vercel.app-6E56CF?logo=vercel&logoColor=white)](https://clinicalrag.vercel.app)
[![CI](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml/badge.svg)](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue?logo=python&logoColor=white)](backend/requirements.txt)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](frontend/package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](backend/app/main.py)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://aistudio.google.com/apikey)
[![Cost to run](https://img.shields.io/badge/cost%20to%20run-%240-brightgreen)](#quick-start)
[![PubMed](https://img.shields.io/badge/Corpus-PubMed-blue)](https://pubmed.ncbi.nlm.nih.gov/)

### **[→ Try it live: clinicalrag.vercel.app](https://clinicalrag.vercel.app)**

Ask it something it should know ("first-line treatments for type 2 diabetes") and something
it shouldn't ("treatment for zorblatt fever") to see both sides of the refusal gate. First
request may take ~20–30s if the free backend has spun down from inactivity — everything
after that is instant.

> Educational demo, not medical advice. Every answer ends with a reminder to consult a real
> healthcare professional.

---

## What this is

Ask a general-purpose chatbot a medical question and it answers from whatever it memorized
during training — confidently, fluently, and with no way for you to check its work. Ask it
about something obscure or fictional, and it will often still produce a fluent, wrong answer
rather than admit it doesn't know.

ClinicalRAG takes the opposite approach: it can **only** answer from a corpus of real PubMed
abstracts it actually retrieved for your question, it **must** cite which source backs every
claim, and if retrieval doesn't turn up anything relevant enough, it says so instead of
guessing. And unlike most RAG tutorials, it runs entirely on free tiers — free LLM calls
(Gemini), free embeddings (local ONNX, no API at all), free corpus (public PubMed), free
vector store (ChromaDB), and it's deployed on Render's + Vercel's free tiers too.

## See it in action

Both of these are real, captured responses from the live deployment linked above.

Ask about something outside the corpus — no PubMed abstract about "zorblatt fever" exists,
because it's not a real disease:

```
> What is the treatment for zorblatt fever?

I don't have enough information in my corpus to answer that.

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.
```

Ask about something the corpus covers, and it answers with numbered citations back to real
PubMed abstracts:

```
> What are first-line treatments for type 2 diabetes?

Based on the provided sources, when prevention of type 2 diabetes fails, it is essential to
commence glucose-lowering agents to reduce disease burden, prevent complications, and improve
quality of life [1]. Effective management also relies on lifestyle modifications as part of a
unifying framework, which include diet, exercise, blood glucose and glycated hemoglobin
monitoring, and pharmacologic intervention when required [2]. Additionally, for regions like
South Asia, aggressive management from diagnosis includes basic treatments such as metformin,
low-cost statins, blood pressure-lowering drugs, and smoking cessation interventions [4].

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.

  [1] Management of type 2 diabetes: now and the future. — 62% match
  [2] Combining clinical judgment with guidelines for management of type 2 diabetes — 58% match
  [4] Clinical management of type 2 diabetes in south Asia. — 56% match
```

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
all** — see [`app/rag/generator.py`](backend/app/rag/generator.py). That threshold was tuned
empirically, not guessed: fabricated-but-medical-sounding queries (e.g. "zorblatt fever")
score ~0.42–0.49 against real fever abstracts on lexical overlap alone, while genuine
in-corpus questions score 0.58+ — the threshold sits at 0.5 to cleanly separate the two.

## Features

- 🌐 **Actually deployed** — a real backend (Render) + frontend (Vercel) behind the "Try it
  live" link above, not just a "clone and run locally" repo
- 🔒 **Grounded, not guessed** — answers come only from retrieved passages, never the model's
  own training data
- 💸 **Actually free** — Gemini's free tier for generation, local ONNX embeddings (no API at
  all), a free public corpus, and free hosting — $0 to run this end to end
- 📎 **Real citations** — every source links to its actual PubMed page
- 🙅 **Honest refusal** — a tuned similarity gate blocks low-confidence answers before the LLM
  is ever called, so "I don't know" is a code path, not a prompt suggestion
- 🧪 **Tested** — pytest on the backend (retrieval thresholds, citation formatting, CORS-safe
  error handling), Vitest on the frontend, both run in CI on every push
- 🩹 **CORS-safe error handling** — a documented FastAPI/Starlette gotcha (unhandled
  exceptions bypass `CORSMiddleware` by default) is explicitly fixed and regression-tested,
  see [`app/main.py`](backend/app/main.py)
- 📦 **Deploy-ready image** — the corpus and the embedding model are both baked into the
  Docker image at build time, not lazily fetched on the first live request, so cold starts on
  free-tier hosting are fast instead of triggering a live download
- ⚡ **One-command setup** — `setup.sh` / `setup.ps1` create the venv, install everything, and
  seed your `.env` in one shot

## Stack

| Layer      | Tech                                                              |
| ---------- | ------------------------------------------------------------------ |
| Backend    | FastAPI, ChromaDB (persisted, local), `google-genai` SDK (Gemini) |
| Embeddings | ONNX MiniLM-L6-v2 (bundled with Chroma — free, runs locally)      |
| Corpus     | PubMed abstracts via NCBI E-utilities (no API key required)       |
| Frontend   | Next.js 16, TypeScript, Tailwind                                  |
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

The corpus (~375 PubMed abstracts across 20 common clinical topics) is already committed at
`backend/data/chroma/`, so you can run immediately. To rebuild or extend it, see
[Extending the corpus](#extending-the-corpus) below.

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
