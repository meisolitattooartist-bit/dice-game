#!/data/data/com.termux/files/usr/bin/bash
set -e

mkdir -p webapp

# ---------------- BOT ----------------
cat > bot.py <<'PY'
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")

# اگر BOT_TOKEN در محیط نبود، از نسخه فعلی bot.py قدیمی استفاده نکنیم؛
# توکن را بعداً از محیط وارد می‌کنیم.
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://example.com")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(
            "🎲 ورود به بازی",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ]

    await update.message.reply_text(
        "🎲 به بازی تاس خوش اومدی!\n\n"
        "تعداد بازیکن‌ها رو انتخاب کن و بازی رو شروع کن.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(
            "🎲 ساخت بازی",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ]

    await update.message.reply_text(
        "🎲 بازی جدید بساز:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def main():
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN تنظیم نشده. قبل از اجرای ربات، BOT_TOKEN را در محیط قرار بده."
        )

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("game", game))

    print("🎲 Dice Game Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
PY

# ---------------- HTML ----------------
cat > webapp/index.html <<'HTML'
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">

    <title>🎲 بازی تاس</title>

    <script src="https://telegram.org/js/telegram-web-app.js"></script>

    <link rel="stylesheet" href="style.css">
</head>

<body>

<div class="app">

    <div class="header">
        <div class="title">🎲 بازی تاس</div>
        <div class="subtitle">سه بار تاس بنداز و امتیازت رو جمع کن</div>
    </div>

    <section id="setup" class="screen">

        <div class="card">
            <h2>👥 تعداد بازیکنان</h2>

            <div class="player-options">

                <button class="player-btn" data-count="2">
                    <span>۲</span>
                    <small>بازیکن</small>
                </button>

                <button class="player-btn" data-count="4">
                    <span>۴</span>
                    <small>بازیکن</small>
                </button>

                <button class="player-btn" data-count="6">
                    <span>۶</span>
                    <small>بازیکن</small>
                </button>

                <button class="player-btn" data-count="10">
                    <span>۱۰</span>
                    <small>بازیکن</small>
                </button>

            </div>

            <button id="startBtn" class="main-btn">
                🚀 شروع بازی
            </button>
        </div>

    </section>


    <section id="game" class="screen hidden">

        <div class="round-info">
            دور <strong id="roundNumber">۱</strong> از ۳
        </div>

        <div id="diceArea" class="dice-area">

            <div id="dice" class="dice">
                <div class="dot d1"></div>
                <div class="dot d2"></div>
                <div class="dot d3"></div>
                <div class="dot d4"></div>
                <div class="dot d5"></div>
                <div class="dot d6"></div>
                <div class="dot d7"></div>
                <div class="dot d8"></div>
                <div class="dot d9"></div>
            </div>

            <div id="diceNumber" class="dice-number">🎲</div>

        </div>

        <div id="turnText" class="turn-text">
            نوبت شماست
        </div>

        <button id="rollBtn" class="main-btn roll-btn">
            🎲 انداختن تاس
        </button>

        <div id="players" class="players"></div>

    </section>


    <section id="result" class="screen hidden">

        <div class="card result-card">

            <div class="trophy">🏆</div>

            <h1>نتیجه نهایی</h1>

            <div id="winner"></div>

            <div id="finalScores" class="final-scores"></div>

            <button id="newGameBtn" class="main-btn">
                🔄 بازی دوباره
            </button>

        </div>

    </section>

</div>

<script src="game.js"></script>

</body>
</html>
HTML


# ---------------- CSS ----------------
cat > webapp/style.css <<'CSS'
* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: sans-serif;
    background:
        radial-gradient(circle at top, #343434, #111 65%);
    color: white;
}

.app {
    width: 100%;
    max-width: 600px;
    margin: auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 25px;
}

.title {
    font-size: 32px;
    font-weight: 900;
}

.subtitle {
    margin-top: 8px;
    opacity: .7;
    font-size: 14px;
}

.card {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 24px;
    padding: 25px;
    box-shadow: 0 15px 50px rgba(0,0,0,.35);
}

.card h2 {
    text-align: center;
    margin-top: 0;
}

.player-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 20px 0;
}

.player-btn {
    min-height: 90px;
    border: 2px solid rgba(255,255,255,.15);
    border-radius: 18px;
    background: rgba(255,255,255,.07);
    color: white;
    cursor: pointer;
}

.player-btn span {
    display: block;
    font-size: 32px;
    font-weight: 900;
}

.player-btn small {
    opacity: .7;
}

.player-btn.selected {
    border-color: #fff;
    background: rgba(255,255,255,.18);
    transform: scale(1.03);
}

.main-btn {
    width: 100%;
    min-height: 55px;
    border: 0;
    border-radius: 18px;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
    background: white;
    color: #111;
}

.main-btn:active {
    transform: scale(.97);
}

.hidden {
    display: none !important;
}

.round-info {
    text-align: center;
    margin: 15px 0 25px;
    font-size: 18px;
}

.dice-area {
    position: relative;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dice {
    width: 120px;
    height: 120px;
    position: relative;
    border-radius: 25px;
    background: white;
    box-shadow:
        0 15px 35px rgba(0,0,0,.5),
        inset 0 0 15px rgba(0,0,0,.15);
    transform: rotate(0deg);
}

.dice.rolling {
    animation: rollDice .7s infinite linear;
}

@keyframes rollDice {
    0% {
        transform: rotate(0deg) scale(1);
    }

    25% {
        transform: rotate(90deg) scale(1.08);
    }

    50% {
        transform: rotate(180deg) scale(.95);
    }

    75% {
        transform: rotate(270deg) scale(1.08);
    }

    100% {
        transform: rotate(360deg) scale(1);
    }
}

.dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #111;
    position: absolute;
    display: none;
}

.d1 { top: 18px; left: 18px; }
.d2 { top: 18px; left: 51px; }
.d3 { top: 18px; right: 18px; }
.d4 { top: 51px; left: 18px; }
.d5 { top: 51px; left: 51px; }
.d6 { top: 51px; right: 18px; }
.d7 { bottom: 18px; left: 18px; }
.d8 { bottom: 18px; left: 51px; }
.d9 { bottom: 18px; right: 18px; }

.dice-number {
    position: absolute;
    font-size: 15px;
    color: #111;
    opacity: .7;
    display: none;
}

.turn-text {
    text-align: center;
    margin: 15px 0;
    font-size: 17px;
    font-weight: bold;
}

.roll-btn {
    margin-bottom: 20px;
}

.roll-btn:disabled {
    opacity: .45;
}

.players {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.player-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 15px;
    border-radius: 15px;
    background: rgba(255,255,255,.08);
}

.player-name {
    font-weight: bold;
}

.player-score {
    font-size: 20px;
    font-weight: 900;
}

.rolls {
    font-size: 12px;
    opacity: .65;
    margin-top: 3px;
}

.trophy {
    font-size: 75px;
    text-align: center;
}

.result-card {
    text-align: center;
}

#winner {
    font-size: 25px;
    font-weight: 900;
    margin: 20px 0;
}

.final-scores {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 25px;
}

.final-score {
    padding: 14px;
    background: rgba(255,255,255,.08);
    border-radius: 15px;
    display: flex;
    justify-content: space-between;
    font-weight: bold;
}
CSS


# ---------------- JAVASCRIPT ----------------
cat > webapp/game.js <<'JS'
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const result = document.getElementById("result");

const startBtn = document.getElementById("startBtn");
const rollBtn = document.getElementById("rollBtn");
const newGameBtn = document.getElementById("newGameBtn");

const dice = document.getElementById("dice");
const roundNumber = document.getElementById("roundNumber");
const turnText = document.getElementById("turnText");
const playersBox = document.getElementById("players");

const winnerBox = document.getElementById("winner");
const finalScores = document.getElementById("finalScores");

let selectedPlayers = 2;
let players = [];
let currentPlayer = 0;
let currentRound = 1;
let rolling = false;

const playerButtons = document.querySelectorAll(".player-btn");

playerButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        playerButtons.forEach(x => x.classList.remove("selected"));

        btn.classList.add("selected");

        selectedPlayers = Number(btn.dataset.count);
    });

});

playerButtons[0].classList.add("selected");


function createPlayers() {

    players = [];

    for (let i = 0; i < selectedPlayers; i++) {

        players.push({
            id: i,
            name: i === 0 ? "شما" : `بازیکن ${i + 1}`,
            rolls: [],
            total: 0
        });

    }
}


function startGame() {

    createPlayers();

    currentPlayer = 0;
    currentRound = 1;

    setup.classList.add("hidden");
    result.classList.add("hidden");
    game.classList.remove("hidden");

    renderPlayers();
    updateTurn();

}


startBtn.addEventListener("click", startGame);


function updateTurn() {

    roundNumber.textContent = currentRound;

    const player = players[currentPlayer];

    turnText.textContent =
        `🎯 نوبت ${player.name} — دور ${currentRound}`;

}


function renderPlayers() {

    playersBox.innerHTML = "";

    players.forEach(player => {

        const row = document.createElement("div");

        row.className = "player-row";

        row.innerHTML = `
            <div>
                <div class="player-name">${player.name}</div>
                <div class="rolls">
                    ${player.rolls.length
                        ? "🎲 " + player.rolls.join(" • ")
                        : "هنوز تاسی نریخته"}
                </div>
            </div>

            <div class="player-score">
                ${player.total}
            </div>
        `;

        playersBox.appendChild(row);

    });

}


function showDiceNumber(number) {

    const dots = document.querySelectorAll(".dot");

    dots.forEach(dot => dot.style.display = "none");

    const patterns = {

        1: [5],

        2: [1, 9],

        3: [1, 5, 9],

        4: [1, 3, 7, 9],

        5: [1, 3, 5, 7, 9],

        6: [1, 3, 4, 6, 7, 9]

    };

    patterns[number].forEach(pos => {

        dots[pos - 1].style.display = "block";

    });

}


async function rollDice() {

    if (rolling) return;

    rolling = true;

    rollBtn.disabled = true;

    dice.classList.add("rolling");

    turnText.textContent = "🎲 تاس داره می‌چرخه...";

    /*
       نتیجه در انتهای انیمیشن تعیین می‌شود.
       بعداً همین بخش به سرور/اتاق آنلاین وصل می‌شود.
    */

    const resultNumber = Math.floor(Math.random() * 6) + 1;

    await new Promise(resolve => setTimeout(resolve, 1800));

    dice.classList.remove("rolling");

    showDiceNumber(resultNumber);

    const player = players[currentPlayer];

    player.rolls.push(resultNumber);
    player.total += resultNumber;

    renderPlayers();

    await new Promise(resolve => setTimeout(resolve, 900));

    nextTurn();

}


rollBtn.addEventListener("click", rollDice);


function nextTurn() {

    currentPlayer++;

    if (currentPlayer >= players.length) {

        currentPlayer = 0;
        currentRound++;

    }

    if (currentRound > 3) {

        finishGame();

        return;

    }

    rollBtn.disabled = false;

    updateTurn();

}


function finishGame() {

    game.classList.add("hidden");
    result.classList.remove("hidden");

    let max = Math.max(...players.map(p => p.total));

    const winners = players.filter(p => p.total === max);

    if (winners.length === 1) {

        winnerBox.textContent =
            `🏆 برنده: ${winners[0].name} با ${max} امتیاز`;

    } else {

        winnerBox.textContent =
            `🤝 مساوی! ${winners.map(p => p.name).join(" و ")}`;

    }

    finalScores.innerHTML = "";

    players
        .slice()
        .sort((a,b) => b.total - a.total)
        .forEach(player => {

            const row = document.createElement("div");

            row.className = "final-score";

            row.innerHTML = `
                <span>${player.name}</span>
                <span>${player.total} 🎲</span>
            `;

            finalScores.appendChild(row);

        });

}


newGameBtn.addEventListener("click", () => {

    result.classList.add("hidden");
    setup.classList.remove("hidden");

});


console.log("🎲 Dice Game WebApp loaded");
JS


echo
echo "===================================="
echo "🎲 بازی ساخته شد"
echo "===================================="
echo
echo "فایل‌های ساخته‌شده:"
echo "  bot.py"
echo "  webapp/index.html"
echo "  webapp/style.css"
echo "  webapp/game.js"
echo
echo "✅ 2 / 4 / 6 / 10 players"
echo "✅ 3 rounds"
echo "✅ animated dice"
echo "✅ total score"
echo "===================================="
