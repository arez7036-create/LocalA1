from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://localai:password@localhost:5432/localai"
    REDIS_URL: str = "redis://localhost:6379/0"
    OLLAMA_HOST: str = "http://localhost:11434"
    SECRET_KEY: str = "change-me-in-production"
    FIRST_SUPERUSER: str = "admin@localai.local"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"
    RATE_LIMIT_PER_MINUTE: int = 50
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()