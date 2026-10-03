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
