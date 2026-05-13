import logging

import httpx

from app.core.config import settings
from app.models.admission_request import AdmissionRequest
from app.models.enums import AdmissionRequestStatus

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org/bot{token}/sendMessage"

STATUS_MESSAGES = {
    AdmissionRequestStatus.IN_REVIEW: (
        "Ваша заявка на программу «{program}» принята в обработку."
    ),
    AdmissionRequestStatus.APPROVED: (
        "Поздравляем! Ваша заявка на программу «{program}» одобрена. "
        "Ожидайте дальнейших инструкций."
    ),
    AdmissionRequestStatus.REJECTED: (
        "К сожалению, ваша заявка на программу «{program}» отклонена. "
        "Свяжитесь с нами для уточнения деталей."
    ),
}


async def notify_admin_new_request(
    admission: AdmissionRequest,
    chat_id: int,
) -> None:
    """
    Send a message to the admin group chat when a new Telegram admission request
    arrives. Called from within the PTB conversation handler (has Application context).
    Uses httpx directly to avoid importing the Application singleton here
    and creating a circular dependency.
    """
    if not settings.telegram_enabled or not settings.TELEGRAM_ADMIN_CHAT_ID:
        return

    if admission.is_for_child:
        text = (
            "Новая заявка на поступление (Telegram)\n\n"
            f"👶 Имя ребенка: {admission.child_name}\n"
            f"👤 Имя опекуна: {admission.guardian_name}\n"
            f"☎️ Телефон опекуна: {admission.guardian_phone}\n"
            f"📧 Email: {admission.email or '—'}\n"
            f"🎓 Программа: {admission.program_interest or '—'}\n"
            f"💬 Комментарий: {admission.comment or '—'}\n"
            f"ID заявки: {admission.id}"
        )
    else:
        text = (
            "Новая заявка на поступление (Telegram)\n\n"
            f"Имя: {admission.full_name}\n"
            f"Email: {admission.email or '—'}\n"
            f"Телефон: {admission.phone_number}\n"
            f"Программа: {admission.program_interest or '—'}\n"
            f"Комментарий: {admission.comment or '—'}\n"
            f"ID заявки: {admission.id}"
        )

    url = TELEGRAM_API_BASE.format(token=settings.TELEGRAM_BOT_TOKEN)
    payload = {"chat_id": settings.TELEGRAM_ADMIN_CHAT_ID, "text": text}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to notify admin chat: %s", exc)


async def notify_student_status_change(
    telegram_chat_id: int,
    admission: AdmissionRequest,
) -> None:
    """
    Notify the student about their admission request status change.
    Called from the FastAPI PATCH /admission-requests/{id} route handler
    AFTER the update is committed, outside PTB context.
    Uses httpx directly.
    """
    if not settings.telegram_enabled:
        return

    template = STATUS_MESSAGES.get(admission.status)
    if not template:
        return

    text = template.format(program=admission.program_interest or "программу")
    url = TELEGRAM_API_BASE.format(token=settings.TELEGRAM_BOT_TOKEN)
    payload = {"chat_id": telegram_chat_id, "text": text}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
    except Exception as exc:
        logger.warning(
            "Failed to notify student (chat_id=%s): %s", telegram_chat_id, exc
        )
