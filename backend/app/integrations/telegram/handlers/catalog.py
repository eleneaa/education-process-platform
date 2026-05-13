import logging
import uuid

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from sqlmodel import Session

from app.core.db import engine
from app.crud.crud_program import get_programs, get_program_by_id
from app.crud.crud_user import get_user_by_email, set_user_telegram_chat_id
from app.models.enums import ProgramStatus
from app.models.user import User

logger = logging.getLogger(__name__)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    /start command - show main menu
    """
    logger.info("start_command called")
    keyboard = [
        [InlineKeyboardButton("📚 Каталог программ", callback_data="show_catalog")],
        [InlineKeyboardButton("📝 Подать заявку", callback_data="start_admission")],
        [InlineKeyboardButton("🔗 Привязать аккаунт", callback_data="link_account")],
    ]
    await update.message.reply_text(
        "👋 Добро пожаловать! Выберите действие:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    logger.info("start_command done")


async def show_catalog(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show list of programs"""
    logger.info("show_catalog called with callback_data: %s", update.callback_query.data)
    query = update.callback_query
    await query.answer()

    with Session(engine) as session:
        programs = get_programs(session=session, skip=0, limit=50)
        approved = [p for p in programs if p.status == ProgramStatus.APPROVED]

    if not approved:
        await query.edit_message_text("📭 На данный момент программы отсутствуют.")
        return

    keyboard = [
        [InlineKeyboardButton(p.title or "Программа", callback_data=f"program:{p.id}")]
        for p in approved
    ]
    keyboard.append([InlineKeyboardButton("⬅️ Назад", callback_data="main_menu")])
    await query.edit_message_text(
        "📚 Выберите программу:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def show_program_detail(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show program details"""
    query = update.callback_query
    await query.answer()
    program_id_str = query.data.split(":")[1]

    with Session(engine) as session:
        program = get_program_by_id(session=session, program_id=uuid.UUID(program_id_str))

    if not program:
        await query.edit_message_text("❌ Программа не найдена.")
        return

    text = f"*{program.title or 'Программа'}*\n\n{program.description or 'Описание отсутствует.'}"
    keyboard = [
        [
            InlineKeyboardButton(
                "✅ Подать заявку на эту программу",
                callback_data=f"admission:{program.title}",
            )
        ],
        [InlineKeyboardButton("⬅️ Назад к каталогу", callback_data="show_catalog")],
    ]
    await query.edit_message_text(
        text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def link_account_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start linking account - ask for email"""
    query = update.callback_query
    await query.answer()
    await query.message.reply_text(
        "Введите email вашего аккаунта на платформе для привязки:\n"
        "(или /cancel, чтобы отменить)"
    )
    context.user_data["linking_account"] = True


async def link_account_process(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    """Process email for account linking"""
    if not context.user_data.get("linking_account"):
        return

    email = update.message.text.strip().lower()
    if email.startswith("/"):
        context.user_data["linking_account"] = False
        await update.message.reply_text("Привязка отменена.")
        return

    with Session(engine) as session:
        user = get_user_by_email(session=session, email=email)
        if not user:
            await update.message.reply_text(
                "❌ Пользователь с таким email не найден. Проверьте правильность введённого адреса."
            )
            return

        set_user_telegram_chat_id(
            session=session,
            user=user,
            telegram_chat_id=update.effective_chat.id,
        )

    context.user_data["linking_account"] = False
    await update.message.reply_text(
        "✅ Аккаунт привязан! Вы будете получать уведомления о статусе своих заявок."
    )


async def main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Return to main menu"""
    query = update.callback_query
    await query.answer()

    keyboard = [
        [InlineKeyboardButton("📚 Каталог программ", callback_data="show_catalog")],
        [InlineKeyboardButton("📝 Подать заявку", callback_data="start_admission")],
        [InlineKeyboardButton("🔗 Привязать аккаунт", callback_data="link_account")],
    ]
    await query.edit_message_text(
        "👋 Добро пожаловать! Выберите действие:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


def get_catalog_handlers() -> list:
    """Return list of handlers for catalog functionality"""
    return [
        CommandHandler("start", start_command),
        CallbackQueryHandler(show_catalog, pattern="^show_catalog$"),
        CallbackQueryHandler(show_program_detail, pattern="^program:"),
        CallbackQueryHandler(link_account_start, pattern="^link_account$"),
        CallbackQueryHandler(main_menu, pattern="^main_menu$"),
        # NOTE: MessageHandler for link_account_process must be added AFTER ConversationHandler
        # otherwise it will intercept messages meant for the admission form
    ]
