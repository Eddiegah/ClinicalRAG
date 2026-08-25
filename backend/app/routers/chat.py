from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.generator import answer_question

router = APIRouter()


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class SourceOut(BaseModel):
    pmid: str
    title: str
    url: str
    journal: str
    year: str
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = answer_question(request.question)
    return ChatResponse(
        answer=result.answer,
        sources=[SourceOut(**vars(s)) for s in result.sources],
    )
