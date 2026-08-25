"""Builds the local corpus: PubMed search -> chunk -> embed -> Chroma.

Usage:
    python scripts/ingest.py

Reads topics from data/topics.yaml, one PubMed search per topic. Safe to
re-run — upserts by PMID, so re-running just refreshes existing entries.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import httpx
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import TOPICS_FILE  # noqa: E402
from app.rag.vectorstore import upsert_articles  # noqa: E402
from scripts.pubmed import fetch_abstracts, search_pmids  # noqa: E402

# NCBI asks for no more than ~3 requests/sec without an API key.
REQUEST_DELAY_SECONDS = 0.4


def main() -> None:
    topics = yaml.safe_load(TOPICS_FILE.read_text())["topics"]
    total = 0

    with httpx.Client(timeout=30) as client:
        for topic in topics:
            query, limit = topic["query"], topic["limit"]
            pmids = search_pmids(query, limit, client)
            time.sleep(REQUEST_DELAY_SECONDS)

            articles = fetch_abstracts(pmids, client)
            time.sleep(REQUEST_DELAY_SECONDS)

            upsert_articles(articles)
            total += len(articles)
            print(f"[{query!r}] indexed {len(articles)}/{len(pmids)} abstracts")

    print(f"\nDone. {total} abstracts indexed across {len(topics)} topics.")


if __name__ == "__main__":
    main()
