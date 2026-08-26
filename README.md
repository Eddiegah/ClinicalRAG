# ClinicalRAG

**A clinical Q&A assistant that would rather say "I don't know" than make something up.**

Every answer is grounded in a local corpus of real PubMed abstracts and cited inline. If the
corpus doesn't cover the question, the backend refuses — deterministically, before the LLM
is even called — instead of quietly hallucinating a plausible-sounding answer.

[![CI](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml/badge.svg)](https://github.com/Eddiegah/ClinicalRAG/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue?logo=python&logoColor=white)](backend/requirements.txt)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](frontend/package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](backend/app/main.py)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude-D97757)](https://www.anthropic.com/claude)
[![PubMed](https://img.shields.io/badge/Corpus-PubMed-blue)](https://pubmed.ncbi.nlm.nih.gov/)

> Educational demo, not medical advice. Every answer ends with a reminder to consult a real
> healthcare professional.

---

## The problem this solves

Ask a general-purpose chatbot a medical question and it answers from whatever it memorized
during training — confidently, fluently, and with no way for you to check its work. Ask it
about something obscure or fictional, and it will often still produce a fluent, wrong answer
rather than admit it doesn't know.

ClinicalRAG takes the opposite approach: it can **only** answer from a corpus of real PubMed
abstracts it actually retrieved for your question, it **must** cite which source backs every
claim, and if retrieval doesn't turn up anything relevant enough, it says so instead of
guessing.

## See it refuse

This is a real, captured response from the running app — no PubMed abstract about "zorblatt
fever" exists, because it's not a real disease:

```
> What is the treatment for zorblatt fever?

I don't have enough information in my corpus to answer that.

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.
```

Ask about something the corpus actually covers, and it answers with numbered citations back
to real PubMed abstracts instead. The retrieved sources below are real (pulled live from the
running corpus); the prose is an illustrative example of the format — the exact wording
depends on the live Claude call, which needs an `ANTHROPIC_API_KEY`:

```
> What are first-line treatments for type 2 diabetes?

Metformin remains the preferred initial pharmacologic agent for most patients with type 2
diabetes due to its efficacy, low hypoglycemia risk, and established cardiovascular safety
profile [1]. Lifestyle interventions — diet and physical activity — are recommended
alongside pharmacotherapy from diagnosis [2].

This is general information from research abstracts, not medical advice — consult a
healthcare professional for diagnosis or treatment.

  [1] Management of type 2 diabetes: now and the future. — 62% match
  [2] Combining clinical judgment with guidelines for the management of type 2 diabetes — 58% match
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
        G -->|Yes| I[Claude answers ONLY<br/>from retrieved sources,<br/>cites every claim as (n)]
        I --> J[Next.js chat UI:<br/>answer + expandable sources]
        H --> J
    end
```

The refusal path is enforced in code, not just prompted for: if nothing clears the similarity
threshold, `answer_question()` returns the fixed refusal message and **never calls Claude at
all** — see [`app/rag/generator.py`](backend/app/rag/generator.py). That threshold was tuned
empirically, not guessed: fabricated-but-medical-sounding queries (e.g. "zorblatt fever")
score ~0.42–0.49 against real fever abstracts on lexical overlap alone, while genuine
in-corpus questions score 0.58+ — the threshold sits at 0.5 to cleanly separate the two.

## Features

- 🔒 **Grounded, not guessed** — answers come only from retrieved passages, never the model's
  own training data
- 📎 **Real citations** — every source links to its actual PubMed page
- 🙅 **Honest refusal** — a tuned similarity gate blocks low-confidence answers before the LLM
  is ever called, so "I don't know" is a code path, not a prompt suggestion
- 🧠 **Local embeddings** — ONNX MiniLM-L6-v2 runs on-device via ChromaDB, no embedding API
  cost
- 🧪 **Tested** — pytest on the backend (retrieval thresholds, citation formatting, CORS-safe
  error handling), Vitest on the frontend, both run in CI on every push
- 🩹 **CORS-safe error handling** — a documented FastAPI/Starlette gotcha (unhandled
  exceptions bypass `CORSMiddleware` by default) is explicitly fixed and regression-tested,
  see [`app/main.py`](backend/app/main.py)

## Stack

| Layer      | Tech                                                            |
| ---------- | ---------------------------------------------------------------- |
| Backend    | FastAPI, ChromaDB (persisted, local), `anthropic` SDK (Claude)  |
| Embeddings | ONNX MiniLM-L6-v2 (bundled with Chroma — free, runs locally)    |
| Corpus     | PubMed abstracts via NCBI E-utilities (no API key required)     |
| Frontend   | Next.js 16, TypeScript, Tailwind                                |
| Testing    | pytest + pytest-asyncio, Vitest + Testing Library               |
| CI/CD      | GitHub Actions, Render (backend), Vercel-ready (frontend)        |

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env      # then add your ANTHROPIC_API_KEY
```

Build the corpus — pulls ~375 real PubMed abstracts across 20 common clinical topics defined
in [`data/topics.yaml`](backend/data/topics.yaml), takes a few minutes:

```bash
python scripts/ingest.py
```

Run the API and the tests:

```bash
uvicorn app.main:app --reload
pytest
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
npm test
```

Open http://localhost:3000 and ask it something.

## Extending the corpus

Add a topic to [`backend/data/topics.yaml`](backend/data/topics.yaml) — just a PubMed search
query and how many abstracts to pull — and re-run `scripts/ingest.py`. It upserts by PMID, so
re-running is always safe.

## Deploying

[`render.yaml`](render.yaml) at the repo root deploys the backend to
[Render](https://render.com)'s free tier. Set `ANTHROPIC_API_KEY` and `FRONTEND_ORIGINS` in
the Render dashboard after the first deploy. Deploy the frontend separately (e.g. Vercel),
pointing `NEXT_PUBLIC_API_URL` at the Render backend URL.

## Roadmap / explicitly out of scope for v1

- Auth / multi-user support
- Streaming token-by-token responses
- Corpus sources beyond PubMed (e.g. clinical guideline PDFs) — the architecture already
  separates ingestion from retrieval, so a second source is a new ingest script, not a
  rewrite

## License

[MIT](LICENSE) © Edmund Eric Gah
