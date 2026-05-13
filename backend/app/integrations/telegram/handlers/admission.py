import logging
import re

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)
from sqlmodel import Session

from app.core.db import engine
from app.crud.crud_admission_request import create_admission_request
from app.models.admission_request import AdmissionRequestCreate
from app.models.enums import AdmissionRequestSource

logger = logging.getLogger(__name__)

# Conversation states
ASK_FOR_CHILD, ASK_NAME, ASK_EMAIL, ASK_PHONE, ASK_CHILD_NAME, ASK_PROGRAM, ASK_COMMENT, CONFIRM = range(8)

# context.user_data keys
_FOR_CHILD = "admission_for_child"
_NAME = "admission_name"
_EMAIL = "admission_email"
_PHONE = "admission_phone"
_CHILD_NAME = "admission_child_name"
_PROGRAM = "admission_program"
_COMMENT = "admission_comment"


def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_phone(phone: str) -> bool:
    phone_digits = re.sub(r'\D', '', phone)
    return 5 <= len(phone_digits) <= 20


async def start_admission(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point: triggered by callback_data='start_admission' or 'admission:<program>'"""
    logger.info("start_admission called")
    query = update.callback_query
    if query:
        logger.info("got callback query")
        await query.answer()
        if query.data.startswith("admission:"):
            context.user_data[_PROGRAM] = query.data[len("admission:") :]
        await query.message.reply_text("Заявка для кого?",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("👤 Для себя", callback_data="for_self")],
                [InlineKeyboardButton("👶 Для ребенка", callback_data="for_child")],
            ])
        )
    else:
        logger.info("got message, not callback")
        await update.message.reply_text("Заявка для кого?",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("👤 Для себя", callback_data="for_self")],
                [InlineKeyboardButton("👶 Для ребенка", callback_data="for_child")],
            ])
        )
    return ASK_FOR_CHILD


async def handle_for_child(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "for_self":
        context.user_data[_FOR_CHILD] = False
        await query.edit_message_text("📋 Введите ваше полное имя:")
    else:  # for_child
        context.user_data[_FOR_CHILD] = True
        await query.edit_message_text("📋 Введите ваше полное имя (опекуна):")

    return ASK_NAME


async def received_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_NAME] = update.message.text.strip()
    await update.message.reply_text(
        "📧 Введите ваш email (или /skip, чтобы пропустить):"
    )
    return ASK_EMAIL


async def received_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    email = update.message.text.strip()

    if email and not is_valid_email(email):
        await update.message.reply_text(
            "❌ Email некорректен. Пожалуйста, введите правильный email (например: user@example.com):"
        )
        return ASK_EMAIL

    context.user_data[_EMAIL] = email if email else None
    await update.message.reply_text("☎️ Введите номер телефона:")
    return ASK_PHONE


async def skip_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_EMAIL] = None
    await update.message.reply_text("☎️ Введите номер телефона:")
    return ASK_PHONE


async def received_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    phone = update.message.text.strip()

    if not is_valid_phone(phone):
        await update.message.reply_text(
            "❌ Номер телефона некорректен. Пожалуйста, введите номер (5-20 цифр, можно с +, -, пробелами):"
        )
        return ASK_PHONE

    context.user_data[_PHONE] = phone

    if context.user_data.get(_FOR_CHILD):
        await update.message.reply_text("👶 Как зовут ребенка?")
        return ASK_CHILD_NAME
    else:
        if context.user_data.get(_PROGRAM):
            await update.message.reply_text(
                "💬 Есть ли у вас комментарий? (или /skip, чтобы пропустить)"
            )
            return ASK_COMMENT
        else:
            await update.message.reply_text(
                "🎓 Укажите программу, которая вас интересует:"
            )
            return ASK_PROGRAM


async def received_child_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_CHILD_NAME] = update.message.text.strip()
    if context.user_data.get(_PROGRAM):
        await update.message.reply_text(
            "💬 Есть ли у вас комментарий? (или /skip, чтобы пропустить)"
        )
        return ASK_COMMENT
    else:
        await update.message.reply_text(
            "🎓 Укажите программу, которая вас интересует:"
        )
        return ASK_PROGRAM


async def received_program(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_PROGRAM] = update.message.text.strip()
    await update.message.reply_text(
        "💬 Есть ли у вас комментарий? (или /skip, чтобы пропустить)"
    )
    return ASK_COMMENT


async def received_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_COMMENT] = update.message.text.strip()
    return await show_confirmation(update, context)


async def skip_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data[_COMMENT] = None
    return await show_confirmation(update, context)


async def show_confirmation(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    data = context.user_data
    if data.get(_FOR_CHILD):
        text = (
            "✅ Проверьте данные заявки:\n\n"
            f"👤 Ваше имя (опекун): {data.get(_NAME)}\n"
            f"👶 Имя ребенка: {data.get(_CHILD_NAME)}\n"
            f"📧 Email: {data.get(_EMAIL) or '—'}\n"
            f"☎️ Телефон: {data.get(_PHONE)}\n"
            f"🎓 Программа: {data.get(_PROGRAM) or '—'}\n"
            f"💬 Комментарий: {data.get(_COMMENT) or '—'}\n\n"
            "✅ Подтвердить отправку?"
        )
    else:
        text = (
            "✅ Проверьте данные заявки:\n\n"
            f"📝 Имя: {data.get(_NAME)}\n"
            f"📧 Email: {data.get(_EMAIL) or '—'}\n"
            f"☎️ Телефон: {data.get(_PHONE)}\n"
            f"🎓 Программа: {data.get(_PROGRAM) or '—'}\n"
            f"💬 Комментарий: {data.get(_COMMENT) or '—'}\n\n"
            "✅ Подтвердить отправку?"
        )
    keyboard = [
        [
            InlineKeyboardButton("✅ Да, отправить", callback_data="confirm_yes"),
            InlineKeyboardButton("❌ Отмена", callback_data="confirm_no"),
        ]
    ]
    if update.message:
        await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        query = update.callback_query
        await query.answer()
        await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard))
    return CONFIRM


async def confirmed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    data = context.user_data

    admission_create = AdmissionRequestCreate(
        full_name=data[_NAME],
        email=data.get(_EMAIL),
        phone_number=data[_PHONE],
        program_interest=data.get(_PROGRAM),
        comment=data.get(_COMMENT),
        source=AdmissionRequestSource.TELEGRAM,
        is_for_child=data.get(_FOR_CHILD, False),
        child_name=data.get(_CHILD_NAME),
        guardian_name=data[_NAME] if data.get(_FOR_CHILD) else None,
        guardian_phone=data[_PHONE] if data.get(_FOR_CHILD) else None,
    )

    with Session(engine) as session:
        admission = create_admission_request(
            session=session,
            admission_request_create=admission_create,
        )

    await query.edit_message_text(
        "✅ Ваша заявка принята! Мы свяжемся с вами в ближайшее время."
    )

    context.user_data.clear()
    return ConversationHandler.END


async def cancelled(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    if query:
        await query.answer()
        await query.edit_message_text("❌ Заявка отменена.")
    else:
        await update.message.reply_text("❌ Заявка отменена.")
    context.user_data.clear()
    return ConversationHandler.END


def get_admission_handler() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[
            CallbackQueryHandler(start_admission, pattern="^start_admission$"),
            CallbackQueryHandler(start_admission, pattern="^admission:"),
        ],
        states={
            ASK_FOR_CHILD: [
                CallbackQueryHandler(handle_for_child, pattern="^for_(self|child)$"),
            ],
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, received_name)],
            ASK_EMAIL: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, received_email),
                CommandHandler("skip", skip_email),
            ],
            ASK_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, received_phone)],
            ASK_CHILD_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, received_child_name)],
            ASK_PROGRAM: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, received_program)
            ],
            ASK_COMMENT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, received_comment),
                CommandHandler("skip", skip_comment),
            ],
            CONFIRM: [
                CallbackQueryHandler(confirmed, pattern="^confirm_yes$"),
                CallbackQueryHandler(cancelled, pattern="^confirm_no$"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancelled)],
        name="admission_conversation",
        persistent=False,
    )
