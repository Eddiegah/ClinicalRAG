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


@pytest.fixture
def borderline_similarity_chunk(high_similarity_chunk: RetrievedChunk) -> RetrievedChunk:
    # Real-world case: a made-up condition phrased with genuine medical
    # vocabulary ("zorblatt fever") scores ~0.42-0.49 against real fever
    # abstracts purely on lexical overlap — high enough to have tripped the
    # old 0.35 threshold, but well below where real in-corpus questions
    # land (0.58+). Regression guard for that threshold choice.
    return RetrievedChunk(
        pmid="11223344",
        title="Symptomatic fever management in children: A systematic review",
        text="Symptomatic fever management in children: A systematic review\n\n"
        "This review covers antipyretic use and supportive care for pediatric fever.",
        journal="Pediatrics",
        year="2022",
        similarity=0.46,
    )
