from __future__ import annotations

from dataclasses import dataclass

from google import genai
from google.genai import types

from app.config import settings
from app.rag.prompts import REFUSAL_MESSAGE, SYSTEM_PROMPT, build_user_message
from app.rag.vectorstore import RetrievedChunk, query as query_vectorstore

REQUEST_TIMEOUT_MS = 20_000
RETRY_ATTEMPTS = 2


# Keyed by API key rather than a single lru_cache slot so tests can swap
# settings.gemini_api_key at runtime without a stale client sticking around.
_clients: dict[str, genai.Client] = {}


def _get_client() -> genai.Client | None:
    api_key = settings.gemini_api_key
    if not api_key:
        return None
    if api_key not in _clients:
        _clients[api_key] = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=REQUEST_TIMEOUT_MS,
                retry_options=types.HttpRetryOptions(attempts=RETRY_ATTEMPTS),
            ),
        )
    return _clients[api_key]


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

    client = _get_client()
    if client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not set on the backend. Add it to backend/.env and restart."
        )

    response = client.models.generate_content(
        model=settings.clinicalrag_model,
        contents=build_user_message(question, [c.text for c in relevant]),
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    answer_text = response.text or REFUSAL_MESSAGE

    # The similarity gate only checks retrieval relevance, not whether the
    # retrieved passages actually answer the question - e.g. abstracts about
    # diabetes *management* can score high similarity against a question
    # about diabetes *causes* without containing that answer. Gemini itself
    # is instructed to refuse in that case; when it does, drop the sources
    # too, so the UI doesn't show "5 sources" next to "I don't know."
    if answer_text.strip().startswith(REFUSAL_MESSAGE.split("\n\n")[0]):
        return ChatResult(answer=REFUSAL_MESSAGE, sources=[])

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
