from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
CHROMA_DIR = DATA_DIR / "chroma"
TOPICS_FILE = DATA_DIR / "topics.yaml"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="", extra="ignore")

    anthropic_api_key: str = ""
    clinicalrag_model: str = "claude-haiku-4-5"
    frontend_origins: str = "http://localhost:3000"
    clinicalrag_top_k: int = 5
    clinicalrag_min_similarity: float = 0.5

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


settings = Settings()
