# ClinicalRAG

A retrieval-augmented generation (RAG) assistant that answers clinical questions using **only**
a local corpus of PubMed abstracts — every claim is cited back to a real source, and the
assistant explicitly refuses to answer when the corpus doesn't cover the topic instead of
guessing.

> Educational demo only. Not medical advice.

## How it works

```
PubMed (NCBI E-utilities) -> ingest script -> chunked abstracts
                                                     |
                                        local embeddings (ONNX MiniLM-L6-v2)
                                                     |
                                          ChromaDB (persisted vector store)
                                                     |
question -> FastAPI /chat -> retrieve top-k -> Claude answers ONLY from
                              retrieved sources, cites every claim as [n]
                              -> Next.js chat UI shows answer + sources
```

If nothing in the corpus is similar enough to the question, the backend skips the LLM call
entirely and returns a fixed "I don't have enough information in my corpus to answer that"
response — grounding is enforced by the retrieval step, not just prompt instructions.

## Stack

- **Backend**: FastAPI, ChromaDB (local, persisted), `anthropic` SDK (Claude), NCBI E-utilities
- **Frontend**: Next.js + TypeScript, Tailwind
- **Embeddings**: ONNX MiniLM-L6-v2 (bundled with Chroma — runs locally, no API cost)

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env      # then add your ANTHROPIC_API_KEY
```

Build the corpus (pulls ~400 PubMed abstracts across 20 common clinical topics defined in
`data/topics.yaml`, takes a few minutes):

```bash
python scripts/ingest.py
```

Run the API:

```bash
uvicorn app.main:app --reload
```

Run tests:

```bash
pytest
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Extending the corpus

Add a topic to `backend/data/topics.yaml` (a PubMed search query + how many abstracts to
pull) and re-run `scripts/ingest.py` — it upserts by PMID, so re-running is safe.

## Deploying

`render.yaml` at the repo root deploys the backend to [Render](https://render.com)'s free
tier. Set `ANTHROPIC_API_KEY` and `FRONTEND_ORIGINS` in the Render dashboard after the first
deploy. Deploy the frontend separately (e.g. Vercel) pointing `NEXT_PUBLIC_API_URL` at the
Render backend URL.
