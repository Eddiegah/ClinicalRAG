import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.routers.chat import router as chat_router

logger = logging.getLogger("clinicalrag")


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Turns unhandled exceptions into a JSON 500 response.

    FastAPI's built-in `@app.exception_handler(Exception)` is wired into
    Starlette's ServerErrorMiddleware, which wraps CORSMiddleware from the
    outside — so a response built that way never passes through
    CORSMiddleware and never gets CORS headers. The browser then reports a
    misleading "blocked by CORS policy" error instead of the real one. This
    middleware is added *inside* CORSMiddleware instead, so its responses do
    get the headers.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unhandled error while processing %s", request.url.path)
            return JSONResponse(status_code=500, content={"detail": str(exc)})


app = FastAPI(title="ClinicalRAG API")

# Order matters: Starlette wraps middleware in reverse of add order, so
# CORSMiddleware (added second) ends up outermost and can add headers to
# whatever ErrorHandlingMiddleware (added first, so it's innermost) returns.
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
