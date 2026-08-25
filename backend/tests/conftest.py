import pytest

from app.rag.vectorstore import RetrievedChunk


@pytest.fixture
def high_similarity_chunk() -> RetrievedChunk:
    return RetrievedChunk(
        pmid="12345678",
        title="Metformin as first-line therapy in type 2 diabetes",
        text="Metformin as first-line therapy in type 2 diabetes\n\nMetformin remains "
        "the preferred initial pharmacologic agent for most patients with type 2 "
        "diabetes due to its efficacy, low hypoglycemia risk, and cardiovascular "
        "safety profile.",
        journal="Diabetes Care",
        year="2023",
        similarity=0.82,
    )


@pytest.fixture
def low_similarity_chunk(high_similarity_chunk: RetrievedChunk) -> RetrievedChunk:
    return RetrievedChunk(
        pmid="87654321",
        title="Unrelated topic",
        text="Unrelated topic\n\nSomething not relevant to the question.",
        journal="Journal X",
        year="2020",
        similarity=0.10,
    )
