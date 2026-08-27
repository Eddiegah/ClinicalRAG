"""Prints how many chunks are in the corpus per topic, using each topic's
own query as a proxy (top-k=1000 retrieval, counted by similarity >= 0).
Useful as a standalone health check without re-running the full ingest.

Usage:
    python scripts/corpus_stats.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import TOPICS_FILE  # noqa: E402
from app.rag.vectorstore import get_collection  # noqa: E402


def main() -> None:
    collection = get_collection()
    total = collection.count()
    print(f"Total chunks in corpus: {total}\n")

    topics = yaml.safe_load(TOPICS_FILE.read_text())["topics"]
    for topic in topics:
        query = topic["query"]
        try:
            result = collection.query(query_texts=[query], n_results=min(50, total))
            count = len(result["ids"][0])
        except Exception as exc:
            count = f"error: {exc}"
        print(f"{count:>4}  {query}")


if __name__ == "__main__":
    main()
