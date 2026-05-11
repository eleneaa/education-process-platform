import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    if settings.telegram_enabled:
        if not settings.BACKEND_PUBLIC_URL:
            logger.warning(
                "TELEGRAM_BOT_TOKEN set but BACKEND_PUBLIC_URL is not configured — "
                "webhook will not be set"
            )
        else:
            from app.integrations.telegram.bot import setup_webhook

            webhook_url = (
                f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}"
                f"{settings.API_V1_STR}/telegram/webhook"
            )
            await setup_webhook(webhook_url)

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    if settings.telegram_enabled and settings.BACKEND_PUBLIC_URL:
        from app.integrations.telegram.bot import teardown_webhook

        await teardown_webhook()


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
