import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.api.v1 import auth, complaints, polls, conversations, announcements, admin, discover, dynamic_forms
from app.db.session import engine
from app.db.base import Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.backends.inmemory import InMemoryBackend
from redis import asyncio as aioredis

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup ve shutdown event'leri."""
    logger.info("🚀 Akıllı Belediye API başlatılıyor...")

    # Redis Cache Init
    try:
        redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True, socket_timeout=1.0)
        await redis.ping()
        FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
        logger.info("✅ Redis önbelleği (cache) aktif!")
    except Exception as e:
        logger.warning(f"⚠️ Redis bağlantısı başarısız ({e}), bellek içi (In-Memory) önbelleğe geçiliyor...")
        FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

    # Tablolar oluştur (production'da Alembic kullanılır)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Veritabanı tabloları kontrol edildi")

    yield  # App çalışıyor

    logger.info("👋 API kapatılıyor...")
    await engine.dispose()


# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Vatandaş-Belediye Etkileşim Platformu API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS (Must be outermost to handle preflight correctly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(polls.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(discover.router, prefix="/api")
app.include_router(dynamic_forms.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Akıllı Belediye API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }
