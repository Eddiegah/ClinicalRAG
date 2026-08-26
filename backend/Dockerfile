FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Chroma's default embedding function lazily downloads its ~80MB ONNX model
# on first use. Force that download now so it's baked into the image layer
# instead of happening on a live request — otherwise every cold start on a
# free-tier host that spins down between requests re-downloads it, making
# the first request after idle time painfully slow (or timing out).
RUN python -c "from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2; ONNXMiniLM_L6_V2()(['warm up'])"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
