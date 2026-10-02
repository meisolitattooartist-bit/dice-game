from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)
import random

# =========================
# تنظیمات
# =========================

BOT_TOKEN = "8849198682:AAHw_0mjZMK6RTTVvuNnhkMFhPjF-fylME0"

MAX_PLAYERS = 4

# بازی‌های فعال
games = {}


# =========================
# شروع بازی در گروه
# =========================

async def game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.type not in ("group", "supergroup"):
        await update.message.reply_text(
            "❌ این دستور فقط داخل گروه قابل استفاده است."
        )
        return

    chat_id = update.effective_chat.id
    user = update.effective_user

    if chat_id in games:
        await update.message.reply_text(
            "⚠️ در این گروه یک بازی در حال اجراست."
        )
        return

    games[chat_id] = {
        "creator": user.id,
        "players": [user.id],
        "names": {user.id: user.first_name},
        "started": False,
        "rolls": {},
    }

    keyboard = [
        [InlineKeyboardButton(
            "➕ پیوستن به بازی",
            callback_data=f"join:{chat_id}"
        )],
        [InlineKeyboardButton(
            "▶️ شروع بازی",
            callback_data=f"start:{chat_id}"
        )],
    ]

    await update.message.reply_text(
        "🎲 بازی تاس جدید ساخته شد!\n\n"
        f"👑 سازنده: {user.first_name}\n"
        f"👥 بازیکنان: 1/{MAX_PLAYERS}\n\n"
        "برای شرکت در بازی روی «➕ پیوستن به بازی» بزنید.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


# =========================
# پیوستن به بازی
# =========================

async def join_game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    chat_id = int(query.data.split(":")[1])
    user = query.from_user

    game_data = games.get(chat_id)

    if not game_data:
        await query.answer(
            "❌ این بازی وجود ندارد.",
            show_alert=True
        )
        return

    if game_data["started"]:
        await query.answer(
            "❌ بازی شروع شده است.",
            show_alert=True
        )
        return

    if user.id in game_data["players"]:
        await query.answer(
            "شما قبلاً وارد بازی شده‌اید.",
            show_alert=True
        )
        return

    if len(game_data["players"]) >= MAX_PLAYERS:
        await query.answer(
            "❌ ظرفیت بازی تکمیل است.",
            show_alert=True
        )
        return

    game_data["players"].append(user.id)
    game_data["names"][user.id] = user.first_name

    count = len(game_data["players"])

    await query.message.edit_text(
        "🎲 بازی تاس\n\n"
        f"👥 بازیکنان: {count}/{MAX_PLAYERS}\n\n"
        "بازیکنان:\n"
        + "\n".join(
            f"• {game_data['names'][player_id]}"
            for player_id in game_data["players"]
        ),
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "➕ پیوستن به بازی",
                callback_data=f"join:{chat_id}"
            )],
            [InlineKeyboardButton(
                "▶️ شروع بازی",
                callback_data=f"start:{chat_id}"
            )],
        ])
    )


# =========================
# شروع بازی
# =========================

async def start_game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    chat_id = int(query.data.split(":")[1])
    user = query.from_user

    game_data = games.get(chat_id)

    if not game_data:
        await query.answer(
            "❌ بازی پیدا نشد.",
            show_alert=True
        )
        return

    if user.id != game_data["creator"]:
        await query.answer(
            "❌ فقط سازنده بازی می‌تواند بازی را شروع کند.",
            show_alert=True
        )
        return

    if len(game_data["players"]) < 2:
        await query.answer(
            "❌ حداقل ۲ بازیکن لازم است.",
            show_alert=True
        )
        return

    game_data["started"] = True

    keyboard = [
        [InlineKeyboardButton(
            "🎲 انداختن تاس",
            callback_data=f"roll:{chat_id}"
        )]
    ]

    await query.message.edit_text(
        "🎲 بازی شروع شد!\n\n"
        f"👥 تعداد بازیکنان: {len(game_data['players'])}\n\n"
        "هر بازیکن روی «🎲 انداختن تاس» بزند.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


# =========================
# انداختن تاس
# =========================

async def roll_dice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    chat_id = int(query.data.split(":")[1])
    user = query.from_user

    game_data = games.get(chat_id)

    if not game_data:
        await query.answer(
            "❌ بازی پیدا نشد.",
            show_alert=True
        )
        return

    if not game_data["started"]:
        await query.answer(
            "❌ بازی هنوز شروع نشده.",
            show_alert=True
        )
        return

    if user.id not in game_data["players"]:
        await query.answer(
            "❌ شما بازیکن این بازی نیستید.",
            show_alert=True
        )
        return

    if user.id in game_data["rolls"]:
        await query.answer(
            "🎲 شما قبلاً تاس انداخته‌اید.",
            show_alert=True
        )
        return

    number = random.randint(1, 6)
    game_data["rolls"][user.id] = number

    await query.message.reply_text(
        f"🎲 {user.first_name} تاس انداخت: **{number}**",
        parse_mode="Markdown"
    )

    if len(game_data["rolls"]) == len(game_data["players"]):
        results = game_data["rolls"]

        max_number = max(results.values())

        winners = [
            game_data["names"][player_id]
            for player_id, value in results.items()
            if value == max_number
        ]

        text = "🏁 بازی تمام شد!\n\n"

        for player_id, value in results.items():
            text += f"🎲 {game_data['names'][player_id]}: {value}\n"

        if len(winners) == 1:
            text += f"\n🏆 برنده: {winners[0]}"
        else:
            text += "\n🤝 مساوی شد!"

        await query.message.reply_text(text)

        del games[chat_id]


# =========================
# اجرای ربات
# =========================

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("game", game))

    app.add_handler(
        CallbackQueryHandler(join_game, pattern=r"^join:")
    )

    app.add_handler(
        CallbackQueryHandler(start_game, pattern=r"^start:")
    )

    app.add_handler(
        CallbackQueryHandler(roll_dice, pattern=r"^roll:")
    )

    print("🎲 Dice Bot is running...")

    app.run_polling()


if __name__ == "__main__":
    main()
