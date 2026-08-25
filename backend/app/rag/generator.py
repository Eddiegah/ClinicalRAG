from __future__ import annotations

from dataclasses import dataclass

from anthropic import Anthropic

from app.config import settings
from app.rag.prompts import REFUSAL_MESSAGE, SYSTEM_PROMPT, build_user_message
from app.rag.vectorstore import RetrievedChunk, query as query_vectorstore

_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=settings.anthropic_api_key)
    return _client


@dataclass
class SourceRef:
    pmid: str
    title: str
    url: str
    journal: str
    year: str
    similarity: float


@dataclass
class ChatResult:
    answer: str
    sources: list[SourceRef]


def answer_question(question: str) -> ChatResult:
    retrieved = query_vectorstore(question, top_k=settings.clinicalrag_top_k)
    relevant = [c for c in retrieved if c.similarity >= settings.clinicalrag_min_similarity]

    if not relevant:
        return ChatResult(answer=REFUSAL_MESSAGE, sources=[])

    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set on the backend. Add it to backend/.env and restart."
        )

    response = _get_client().messages.create(
        model=settings.clinicalrag_model,
        max_tokens=700,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": build_user_message(question, [c.text for c in relevant]),
            }
        ],
    )
    answer_text = "".join(block.text for block in response.content if block.type == "text")

    return ChatResult(answer=answer_text, sources=[_to_source_ref(c) for c in relevant])


def _to_source_ref(chunk: RetrievedChunk) -> SourceRef:
    return SourceRef(
        pmid=chunk.pmid,
        title=chunk.title,
        url=f"https://pubmed.ncbi.nlm.nih.gov/{chunk.pmid}/",
        journal=chunk.journal,
        year=chunk.year,
        similarity=chunk.similarity,
    )
