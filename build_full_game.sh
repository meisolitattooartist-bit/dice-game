#!/data/data/com.termux/files/usr/bin/bash
set -e

mkdir -p webapp

# =========================
# index.html
# =========================
cat > webapp/index.html <<'HTML'
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>🎲 بازی تاس</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="stylesheet" href="style.css">
<script src="config.js"></script>
</head>

<body>
<div class="app">

  <header>
    <h1>🎲 بازی تاس</h1>
    <div id="roomCode" class="room-code"></div>
  </header>

  <section id="setup" class="screen">
    <h2>ساخت بازی</h2>
    <p>تعداد بازیکنان را انتخاب کن</p>

    <div class="players-select">
      <button data-count="2">۲ نفر</button>
      <button data-count="4">۴ نفر</button>
      <button data-count="6">۶ نفر</button>
      <button data-count="10">۱۰ نفر</button>
    </div>

    <button id="createBtn" class="main-btn">🎲 ساخت اتاق</button>
    <div id="setupMsg"></div>
  </section>

  <section id="waiting" class="screen hidden">
    <h2>⏳ اتاق انتظار</h2>

    <div class="room-box">
      <div>کد اتاق</div>
      <strong id="waitingRoom"></strong>
    </div>

    <button id="inviteBtn" class="main-btn">📨 دعوت بازیکن</button>

    <div id="waitingPlayers"></div>

    <button id="startBtn" class="main-btn hidden">🚀 شروع بازی</button>
    <p id="waitingMsg"></p>
  </section>

  <section id="game" class="screen hidden">

    <div class="game-top">
      <div>اتاق: <b id="gameRoom"></b></div>
      <div id="roundText">دور ۱ از ۳</div>
    </div>

    <div id="turnText" class="turn"></div>

    <div class="dice-area">
      <div id="dice" class="dice">
        <span id="diceNumber">?</span>
      </div>
    </div>

    <button id="rollBtn" class="roll-btn">🎲 انداختن تاس</button>

    <div id="myRolls" class="my-rolls"></div>

    <div id="scoreBoard"></div>
  </section>

  <section id="result" class="screen hidden">
    <h2>🏆 نتیجه بازی</h2>
    <div id="results"></div>
    <button id="newGameBtn" class="main-btn">🔄 بازی جدید</button>
  </section>

</div>

<script src="game.js"></script>
</body>
</html>
HTML

# =========================
# style.css
# =========================
cat > webapp/style.css <<'CSS'
*{box-sizing:border-box}

body{
 margin:0;
 font-family:Tahoma,Arial,sans-serif;
 background:linear-gradient(145deg,#111827,#1f2937);
 color:#fff;
 min-height:100vh;
}

.app{
 max-width:600px;
 margin:auto;
 padding:18px;
}

header{
 text-align:center;
 padding:10px 0 18px;
}

h1{
 margin:0;
 font-size:30px;
}

h2{
 margin-top:5px;
}

.room-code{
 margin-top:8px;
 color:#9ca3af;
 font-size:14px;
}

.screen{
 background:rgba(255,255,255,.07);
 border:1px solid rgba(255,255,255,.1);
 border-radius:22px;
 padding:20px;
 margin-top:10px;
 box-shadow:0 10px 35px rgba(0,0,0,.25);
}

.hidden{display:none!important}

.players-select{
 display:grid;
 grid-template-columns:1fr 1fr;
 gap:12px;
 margin:20px 0;
}

button{
 border:0;
 border-radius:15px;
 padding:15px;
 font-size:17px;
 font-weight:bold;
 cursor:pointer;
 background:#374151;
 color:white;
}

button.selected{
 background:#2563eb;
}

.main-btn{
 width:100%;
 margin-top:12px;
 background:#2563eb;
}

.room-box{
 text-align:center;
 background:rgba(0,0,0,.25);
 border-radius:15px;
 padding:16px;
 margin:15px 0;
}

.room-box strong{
 display:block;
 font-size:30px;
 letter-spacing:4px;
 margin-top:8px;
}

.player{
 display:flex;
 justify-content:space-between;
 align-items:center;
 background:rgba(255,255,255,.06);
 padding:12px;
 border-radius:13px;
 margin:8px 0;
}

.player.me{
 border:1px solid #60a5fa;
}

.player.done{
 opacity:.7;
}

.turn{
 text-align:center;
 font-size:19px;
 font-weight:bold;
 margin:15px 0;
}

.dice-area{
 display:flex;
 justify-content:center;
 padding:20px;
}

.dice{
 width:120px;
 height:120px;
 background:#fff;
 color:#111;
 border-radius:22px;
 display:flex;
 align-items:center;
 justify-content:center;
 font-size:65px;
 font-weight:bold;
 box-shadow:0 15px 30px rgba(0,0,0,.35);
 transform:rotate(0deg) scale(1);
}

.dice.rolling{
 animation:roll 1.5s ease-in-out;
}

@keyframes roll{
 0%{transform:rotate(0deg) scale(1)}
 20%{transform:rotate(160deg) scale(1.08)}
 45%{transform:rotate(330deg) scale(.92)}
 70%{transform:rotate(520deg) scale(1.08)}
 100%{transform:rotate(720deg) scale(1)}
}

.roll-btn{
 width:100%;
 background:#16a34a;
 font-size:20px;
 padding:18px;
}

.roll-btn:disabled{
 opacity:.35;
 cursor:not-allowed;
}

.my-rolls{
 text-align:center;
 margin:15px 0;
 color:#d1d5db;
}

.score-card{
 background:rgba(255,255,255,.06);
 padding:12px;
 border-radius:14px;
 margin:8px 0;
}

.score-card.current{
 border:1px solid #f59e0b;
}

.score-line{
 display:flex;
 justify-content:space-between;
}

#results{
 margin-top:15px;
}

.winner{
 text-align:center;
 font-size:25px;
 padding:18px;
 background:rgba(245,158,11,.15);
 border-radius:18px;
 margin-bottom:15px;
}

#error{
 color:#fca5a5;
}
CSS

# =========================
# config.js
# =========================
cat > webapp/config.js <<'JS'
window.SUPABASE_URL = "";
window.SUPABASE_KEY = "";
JS

# Fill config.js locally from existing files, without printing the key
python - <<'PY'
from pathlib import Path

url = Path("url.txt").read_text().strip().rstrip("/")
key = Path("key.txt").read_text().strip()

js = f"""window.SUPABASE_URL = {url!r};
window.SUPABASE_KEY = {key!r};
"""
Path("webapp/config.js").write_text(js)
print("config.js ساخته شد")
PY

# =========================
# game.js
# =========================
cat > webapp/game.js <<'JS'
(() => {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
  }

  const SUPABASE_URL = String(window.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
  const SUPABASE_KEY = String(window.SUPABASE_KEY || "");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    document.body.innerHTML =
      '<div style="padding:30px;color:white;font-family:Tahoma">خطا: تنظیمات Supabase پیدا نشد.</div>';
    return;
  }

  const API = SUPABASE_URL + "/rest/v1";

  const $ = id => document.getElementById(id);

  let selectedCount = 2;
  let state = null;
  let myId = localStorage.getItem("dice_player_id");

  if (!myId) {
    myId = "p_" + crypto.randomUUID();
    localStorage.setItem("dice_player_id", myId);
  }

  let myName =
    tg?.initDataUnsafe?.user?.first_name ||
    tg?.initDataUnsafe?.user?.username ||
    "بازیکن";

  let roomId = new URLSearchParams(location.search).get("room");
  let pollTimer = null;
  let rolling = false;

  async function api(path, options = {}) {
    const res = await fetch(API + path, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(text || ("HTTP " + res.status));
    }

    return text ? JSON.parse(text) : null;
  }

  function randomRoom() {
    return Math.random().toString(36).slice(2, 8);
  }

  function randomNumber() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function showOnly(id) {
    ["setup", "waiting", "game", "result"].forEach(x => {
      $(x).classList.toggle("hidden", x !== id);
    });
  }

  function saveState(s) {
    return api(
      "/game_rooms?Room_id=eq." + encodeURIComponent(s.room_id),
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          Id: s.id,
          Room_id: s.room_id,
          players: s.players,
          status: JSON.stringify(s)
        })
      }
    );
  }

  async function createRoom() {
    const id = randomRoom();

    state = {
      id: "r_" + crypto.randomUUID(),
      room_id: id,
      max_players: selectedCount,
      host_id: myId,
      status: "waiting",
      round: 1,
      current_index: 0,
      players: [
        {
          id: myId,
          name: myName,
          rolls: [],
          total: 0
        }
      ]
    };

    try {
      await api("/game_rooms", {
        method: "POST",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          Id: state.id,
          Room_id: state.room_id,
          players: state.players,
          status: JSON.stringify(state)
        })
      });

      roomId = id;
      history.replaceState({}, "", "?room=" + encodeURIComponent(roomId));

      renderWaiting();
      startPolling();
    } catch (e) {
      $("setupMsg").textContent = "خطا: " + e.message;
    }
  }

  async function loadRoom() {
    const rows = await api(
      "/game_rooms?Room_id=eq." +
        encodeURIComponent(roomId) +
        "&select=*"
    );

    if (!rows || !rows.length) {
      throw new Error("اتاق پیدا نشد");
    }

    const row = rows[0];

    try {
      state =
        typeof row.status === "string"
          ? JSON.parse(row.status)
          : row.status;
    } catch {
      state = {
        id: row.Id,
        room_id: row.Room_id,
        max_players: 2,
        host_id: null,
        status: "waiting",
        round: 1,
        current_index: 0,
        players: row.players || []
      };
    }

    state.id = row.Id;
    state.room_id = row.Room_id;
    state.players = Array.isArray(state.players)
      ? state.players
      : row.players || [];

    const me = state.players.find(p => p.id === myId);

    if (!me) {
      if (state.status !== "waiting") {
        throw new Error("بازی شروع شده و ورود بازیکن جدید ممکن نیست.");
      }

      if (state.players.length >= state.max_players) {
        throw new Error("ظرفیت اتاق تکمیل است.");
      }

      state.players.push({
        id: myId,
        name: myName,
        rolls: [],
        total: 0
      });

      await saveState(state);
    }

    renderByState();
  }

  function renderByState() {
    $("roomCode").textContent = state?.room_id
      ? "اتاق " + state.room_id
      : "";

    if (state.status === "waiting") {
      renderWaiting();
    } else if (state.status === "playing") {
      renderGame();
    } else if (state.status === "finished") {
      renderResult();
    }
  }

  function renderWaiting() {
    showOnly("waiting");

    $("waitingRoom").textContent = state.room_id;
    $("gameRoom").textContent = state.room_id;

    const box = $("waitingPlayers");
    box.innerHTML = "";

    state.players.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "player" + (p.id === myId ? " me" : "");
      div.innerHTML =
        "<span>" +
        (i + 1) +
        ". " +
        escapeHtml(p.name) +
        (p.id === myId ? " 👤" : "") +
        "</span><b>آماده</b>";
      box.appendChild(div);
    });

    $("waitingMsg").textContent =
      state.players.length +
      " / " +
      state.max_players +
      " بازیکن";

    $("startBtn").classList.toggle(
      "hidden",
      !(state.host_id === myId && state.players.length >= 2)
    );
  }

  function renderGame() {
    showOnly("game");

    const current = state.players[state.current_index];

    $("gameRoom").textContent = state.room_id;
    $("roundText").textContent =
      "دور " + state.round + " از 3";

    $("turnText").textContent =
      current && current.id === myId
        ? "🎯 نوبت توئه!"
        : "⏳ نوبت " + (current?.name || "بازیکن");

    const me = state.players.find(p => p.id === myId);

    $("myRolls").textContent =
      "تاس‌های تو: " +
      (me?.rolls?.length ? me.rolls.join(" • ") : "هنوز تاسی ننداختی") +
      " | مجموع: " +
      (me?.total || 0);

    $("rollBtn").disabled =
      rolling || !current || current.id !== myId;

    renderScores();
  }

  function renderScores() {
    const box = $("scoreBoard");
    box.innerHTML = "";

    state.players.forEach((p, i) => {
      const div = document.createElement("div");

      const isCurrent =
        state.players[state.current_index]?.id === p.id;

      div.className =
        "score-card" + (isCurrent ? " current" : "");

      div.innerHTML =
        '<div class="score-line"><b>' +
        (i + 1) +
        ". " +
        escapeHtml(p.name) +
        "</b><b>" +
        (p.total || 0) +
        "</b></div>" +
        '<div class="score-line"><small>' +
        (p.rolls?.length
          ? p.rolls.join(" • ")
          : "—") +
        "</small><small>" +
        (p.rolls?.length || 0) +
        "/3</small></div>";

      box.appendChild(div);
    });
  }

  async function startGame() {
    if (!state || state.host_id !== myId) return;

    if (state.players.length < 2) {
      $("waitingMsg").textContent =
        "حداقل ۲ بازیکن لازم است.";
      return;
    }

    state.status = "playing";
    state.round = 1;
    state.current_index = 0;

    state.players.forEach(p => {
      p.rolls = [];
      p.total = 0;
    });

    await saveState(state);
    renderGame();
  }

  async function rollDice() {
    if (rolling || !state) return;

    const current = state.players[state.current_index];

    if (!current || current.id !== myId) return;

    if (current.rolls.length >= 3) return;

    rolling = true;
    $("rollBtn").disabled = true;

    const dice = $("dice");
    dice.classList.remove("rolling");
    void dice.offsetWidth;
    dice.classList.add("rolling");

    let n = randomNumber();

    const interval = setInterval(() => {
      $("diceNumber").textContent = randomNumber();
    }, 100);

    await new Promise(r => setTimeout(r, 1500));

    clearInterval(interval);

    $("diceNumber").textContent = n;

    current.rolls.push(n);
    current.total = current.rolls.reduce((a, b) => a + b, 0);

    if (current.rolls.length >= 3) {
      current.finished = true;
    }

    const everyoneDone =
      state.players.every(p => p.rolls.length >= 3);

    if (everyoneDone) {
      state.status = "finished";
    } else {
      let next = state.current_index + 1;

      if (next >= state.players.length) {
        next = 0;
        state.round++;
      }

      while (
        next < state.players.length &&
        state.players[next].rolls.length >= 3
      ) {
        next++;
        if (next >= state.players.length) next = 0;
      }

      state.current_index = next;
    }

    try {
      await saveState(state);
      renderByState();
    } catch (e) {
      alert("خطا در ذخیره تاس: " + e.message);
    }

    rolling = false;
  }

  function renderResult() {
    showOnly("result");

    const sorted = [...state.players].sort(
      (a, b) => b.total - a.total
    );

    const winner = sorted[0];

    let html =
      '<div class="winner">🏆 ' +
      escapeHtml(winner.name) +
      "<br>با " +
      winner.total +
      " امتیاز</div>";

    sorted.forEach((p, i) => {
      html +=
        '<div class="score-card">' +
        "<b>" +
        (i + 1) +
        ". " +
        escapeHtml(p.name) +
        "</b>" +
        "<div>🎲 " +
        p.rolls.join(" • ") +
        "</div>" +
        "<div>امتیاز: <b>" +
        p.total +
        "</b></div>" +
        "</div>";
    });

    $("results").innerHTML = html;
  }

  async function invite() {
    const link =
      location.origin +
      location.pathname +
      "?room=" +
      encodeURIComponent(state.room_id);

    if (tg?.switchInlineQuery) {
      tg.switchInlineQuery(
        "🎲 بیا توی بازی تاس! " + link
      );
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "🎲 بازی تاس",
        text: "بیا توی بازی من!",
        url: link
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      $("waitingMsg").textContent =
        "🔗 لینک دعوت کپی شد.";
    } catch {
      prompt("لینک دعوت:", link);
    }
  }

  async function poll() {
    if (!roomId) return;

    try {
      const rows = await api(
        "/game_rooms?Room_id=eq." +
          encodeURIComponent(roomId) +
          "&select=*"
      );

      if (!rows?.length) return;

      const row = rows[0];

      let remote;

      try {
        remote =
          typeof row.status === "string"
            ? JSON.parse(row.status)
            : row.status;
      } catch {
        return;
      }

      if (!remote) return;

      remote.id = row.Id;
      remote.room_id = row.Room_id;
      remote.players = Array.isArray(remote.players)
        ? remote.players
        : row.players || [];

      state = remote;
      renderByState();
    } catch {
      // قطع موقت اینترنت؛ polling بعدی دوباره امتحان می‌کند
    }
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, 1000);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.querySelectorAll(".players-select button")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".players-select button")
          .forEach(x => x.classList.remove("selected"));

        btn.classList.add("selected");
        selectedCount = Number(btn.dataset.count);
      });
    });

  document
    .querySelector('.players-select button[data-count="2"]')
    .classList.add("selected");

  $("createBtn").addEventListener("click", createRoom);
  $("startBtn").addEventListener("click", startGame);
  $("rollBtn").addEventListener("click", rollDice);
  $("inviteBtn").addEventListener("click", invite);

  $("newGameBtn").addEventListener("click", () => {
    location.href = location.pathname;
  });

  // ورود با لینک دعوت
  if (roomId) {
    showOnly("waiting");

    loadRoom()
      .then(() => {
        startPolling();
      })
      .catch(e => {
        showOnly("setup");
        $("setupMsg").textContent =
          "❌ " + e.message;
      });
  } else {
    showOnly("setup");
  }
})();
JS

# =========================
# bot.py
# =========================
OLD_TOKEN=""

if [ -f bot.py ]; then
  OLD_TOKEN=$(python - <<'PY'
import re
from pathlib import Path

try:
    s = Path("bot.py").read_text()
except:
    s = ""

m = re.search(r'BOT_TOKEN\s*=\s*["'\'']([^"'\'']+)["'\'']', s)
print(m.group(1) if m else "")
PY
)
fi

cat > bot.py <<PY
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN", ${OLD_TOKEN@Q})
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
        "🎲 به بازی تاس خوش اومدی!\\n\\n"
        "از دکمه زیر وارد بازی شو:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def game(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)

def main():
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN تنظیم نشده است."
        )

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("game", game))

    print("🎲 Dice bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
PY

# =========================
# GitHub Pages workflow
# =========================
mkdir -p .github/workflows

cat > .github/workflows/pages.yml <<'YAML'
name: Deploy Dice WebApp

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Prepare site
        run: |
          mkdir -p _site
          cp -r webapp/* _site/

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
YAML

echo
echo "======================================"
echo "🎲 کل بازی ساخته شد"
echo "======================================"
echo
echo "فایل‌های اصلی:"
echo "  webapp/index.html"
echo "  webapp/style.css"
echo "  webapp/game.js"
echo "  webapp/config.js"
echo "  bot.py"
echo
echo "Supabase config بدون نمایش کلید تنظیم شد."
echo
echo "قدم بعدی:"
echo "  git add ."
echo "  git commit -m 'full dice game'"
echo "  git push origin main"
echo
