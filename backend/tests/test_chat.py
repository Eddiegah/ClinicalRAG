from unittest.mock import MagicMock, patch

from app.config import settings
from app.rag.generator import answer_question
from app.rag.prompts import REFUSAL_MESSAGE


@patch("app.rag.generator.query_vectorstore")
def test_refuses_when_no_chunk_passes_similarity_threshold(
    mock_query, low_similarity_chunk
):
    mock_query.return_value = [low_similarity_chunk]

    result = answer_question("What is the treatment for a disease not in the corpus?")

    assert result.answer == REFUSAL_MESSAGE
    assert result.sources == []


@patch("app.rag.generator._get_client")
@patch("app.rag.generator.query_vectorstore")
def test_answers_with_sources_when_relevant_chunk_found(
    mock_query, mock_get_client, high_similarity_chunk
):
    mock_query.return_value = [high_similarity_chunk]

    mock_response = MagicMock()
    mock_text_block = MagicMock(type="text", text="Metformin is first-line therapy [1].")
    mock_response.content = [mock_text_block]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response
    mock_get_client.return_value = mock_client

    original_key = settings.anthropic_api_key
    settings.anthropic_api_key = "test-key"
    try:
        result = answer_question("What is first-line therapy for type 2 diabetes?")
    finally:
        settings.anthropic_api_key = original_key

    assert "[1]" in result.answer
    assert len(result.sources) == 1
    assert result.sources[0].pmid == "12345678"
    assert result.sources[0].url == "https://pubmed.ncbi.nlm.nih.gov/12345678/"
