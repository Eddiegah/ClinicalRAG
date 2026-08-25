from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import chromadb
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

from app.config import CHROMA_DIR

COLLECTION_NAME = "clinical_abstracts"


@dataclass
class RetrievedChunk:
    pmid: str
    title: str
    text: str
    journal: str
    year: str
    similarity: float


@lru_cache(maxsize=1)
def get_collection():
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ONNXMiniLM_L6_V2(),
        metadata={"hnsw:space": "cosine"},
    )


def upsert_articles(articles: list[dict]) -> None:
    """articles: [{pmid, title, abstract, journal, year}]"""
    if not articles:
        return
    collection = get_collection()
    collection.upsert(
        ids=[a["pmid"] for a in articles],
        documents=[f"{a['title']}\n\n{a['abstract']}" for a in articles],
        metadatas=[
            {
                "title": a["title"],
                "journal": a["journal"],
                "year": a["year"],
            }
            for a in articles
        ],
    )


def query(question: str, top_k: int) -> list[RetrievedChunk]:
    collection = get_collection()
    if collection.count() == 0:
        return []

    result = collection.query(
        query_texts=[question],
        n_results=min(top_k, collection.count()),
    )

    chunks: list[RetrievedChunk] = []
    ids = result["ids"][0]
    documents = result["documents"][0]
    metadatas = result["metadatas"][0]
    distances = result["distances"][0]

    for pmid, document, metadata, distance in zip(ids, documents, metadatas, distances):
        similarity = 1 - distance  # cosine space: distance = 1 - cosine similarity
        chunks.append(
            RetrievedChunk(
                pmid=pmid,
                title=metadata.get("title", ""),
                text=document,
                journal=metadata.get("journal", ""),
                year=metadata.get("year", ""),
                similarity=round(similarity, 4),
            )
        )
    return chunks
