import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
WEBAPP_URL = os.environ.get(
    "WEBAPP_URL",
    "https://meisolitattooartist-bit.github.io/dice-game/"
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[
        InlineKeyboardButton(
            "🎲 ساخت / ورود به بازی",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]]

    await update.message.reply_text(
        "🎲 به بازی تاس خوش اومدی!\n\n"
        "از دکمه زیر وارد بازی شو:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)

def main():
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN تنظیم نشده است.")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("game", game))

    print("🎲 Dice bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
