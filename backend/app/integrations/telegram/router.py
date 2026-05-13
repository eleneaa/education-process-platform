import logging

from fastapi import APIRouter, Request, Response, HTTPException
from telegram import Update

from app.core.config import settings
from app.integrations.telegram.bot import get_application

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request) -> Response:
    """
    Receive updates from Telegram. This endpoint must be reachable
    over HTTPS from Telegram servers.
    """
    if not settings.telegram_enabled:
        raise HTTPException(status_code=404, detail="Not found")

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    application = get_application()
    update = Update.de_json(data=data, bot=application.bot)
    await application.process_update(update)

    return Response(status_code=200)
