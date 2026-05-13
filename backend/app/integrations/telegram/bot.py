import logging

from telegram.ext import Application, ApplicationBuilder

from app.core.config import settings
from app.integrations.telegram.handlers.catalog import get_catalog_handlers, link_account_process
from app.integrations.telegram.handlers.admission import get_admission_handler
from telegram.ext import MessageHandler, filters

logger = logging.getLogger(__name__)

_application: Application | None = None


def get_application() -> Application:
    if _application is None:
        raise RuntimeError("Telegram Application not initialized")
    return _application


async def setup_webhook(webhook_url: str) -> None:
    """
    Initialize the PTB Application, register handlers, set the webhook.
    Called during FastAPI lifespan startup.
    webhook_url example: "https://yourdomain.com/api/v1/telegram/webhook"
    """
    global _application

    _application = (
        ApplicationBuilder()
        .token(settings.TELEGRAM_BOT_TOKEN)
        .updater(None)
        .build()
    )

    # Register handlers
    for handler in get_catalog_handlers():
        _application.add_handler(handler)

    # ConversationHandler for admission form MUST come before generic MessageHandler
    _application.add_handler(get_admission_handler())

    # Generic MessageHandler for other purposes (e.g. account linking) comes LAST
    _application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, link_account_process)
    )

    # Add error handler
    async def error_handler(update, context):
        logger.error("Update %s caused error: %s", update, context.error, exc_info=context.error)

    _application.add_error_handler(error_handler)

    await _application.initialize()
    await _application.bot.set_webhook(
        url=webhook_url,
        allowed_updates=["message", "callback_query"],
    )
    logger.info("Telegram webhook set to %s", webhook_url)


async def teardown_webhook() -> None:
    """Delete the webhook and shut the application down cleanly."""
    global _application
    if _application is not None:
        await _application.bot.delete_webhook()
        await _application.shutdown()
        _application = None
        logger.info("Telegram webhook removed")
