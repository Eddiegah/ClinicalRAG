from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.config import settings

client = TestClient(app, raise_server_exceptions=False)


@patch("app.rag.generator.query_vectorstore")
def test_missing_api_key_returns_json_error_with_cors_headers(mock_query, high_similarity_chunk):
    mock_query.return_value = [high_similarity_chunk]
    original_key = settings.gemini_api_key
    settings.gemini_api_key = ""
    try:
        response = client.post(
            "/chat",
            json={"question": "What is first-line therapy for type 2 diabetes?"},
            headers={"Origin": "http://localhost:3000"},
        )
    finally:
        settings.gemini_api_key = original_key

    assert response.status_code == 500
    assert "GEMINI_API_KEY" in response.json()["detail"]
    # The whole point of this test: an unhandled/handled 500 must still carry
    # CORS headers, or the browser reports a misleading CORS error instead.
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
