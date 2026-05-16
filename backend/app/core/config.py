from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Akıllı Belediye API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://belediye:belediye_pass_2024@localhost:5432/akilli_belediye"

    # JWT
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Google Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "models/gemini-flash-latest"
    GEMINI_VISION_MODEL: str = "models/gemini-flash-latest"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-2"

    # MinIO / S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "complaints"
    MINIO_SECURE: bool = False
    SIGNED_URL_EXPIRE_HOURS: int = 24

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@akilli-belediye.gov.tr"

    # Web Push
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "admin@akilli-belediye.gov.tr"

    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    # e-Devlet OAuth (Mock for now)
    EDEVLET_CLIENT_ID: str = "akilli_belediye_client"
    EDEVLET_CLIENT_SECRET: str = "mock_secret"
    EDEVLET_AUTH_URL: str = "https://giris.turkiye.gov.tr/oauth2/authorize"
    EDEVLET_TOKEN_URL: str = "https://giris.turkiye.gov.tr/oauth2/token"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
