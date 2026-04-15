from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Collab Canvas"
    API_V1_PREFIX: str = "/api"

    DATABASE_URL: str = "postgresql://collab:collab@localhost:5432/collab_canvas"
    REDIS_URL: str = "redis://localhost:6379"

    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24  # 24 hours

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
