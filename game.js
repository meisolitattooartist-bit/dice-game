const dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");
const inviteButton = document.getElementById("inviteButton");

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);
let roomId = params.get("room");

if (!roomId) {
    roomId = Math.random().toString(36).slice(2, 8).toUpperCase();

    history.replaceState(
        null,
        "",
        `${window.location.pathname}?room=${roomId}`
    );
}

let currentUser = null;

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    currentUser = Telegram.WebApp.initDataUnsafe?.user;
}

if (!currentUser) {
    currentUser = {
        id: "guest-" + Math.random().toString(36).slice(2, 10),
        first_name: "مهمان"
    };
}

playerName.textContent =
    currentUser.first_name ||
    currentUser.username ||
    "بازیکن";

const player = {
    id: String(currentUser.id),
    name: currentUser.first_name ||
        currentUser.username ||
        "بازیکن",
    rolls: []
};

async function loadRoom() {
    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select("*")
        .eq("room_id", roomId)
        .maybeSingle();

    if (error) {
        console.error(error);
        result.textContent = "❌ " + error.message;
        return;
    }

    if (!data) {
        const { data: newRoom, error: insertError } =
            await supabaseClient
                .from("game_rooms")
                .insert({
                    room_id: roomId,
                    players: [player],
                    status: "waiting"
                })
                .select()
                .single();

        if (insertError) {
            console.error(insertError);
            result.textContent = "❌ " + insertError.message;
            return;
        }

        showRoom(newRoom);
        return;
    }

    let players = Array.isArray(data.players)
        ? data.players
        : [];

    const exists = players.some(
        p => String(p.id) === String(player.id)
    );

    if (!exists) {
        players.push(player);

        const { error: updateError } =
            await supabaseClient
                .from("game_rooms")
                .update({
                    players: players
                })
                .eq("room_id", roomId);

        if (updateError) {
            console.error(updateError);
            result.textContent = "❌ " + updateError.message;
            return;
        }

        data.players = players;
    }

    showRoom(data);
}

function showRoom(data) {
    const players = Array.isArray(data.players)
        ? data.players
        : [];

    result.textContent =
        `🎲 اتاق: ${roomId}\n` +
        `👥 بازیکنان: ${players.length}`;

    rollButton.disabled = false;
}

async function rollDice() {
    const number =
        Math.floor(Math.random() * 6) + 1;

    dice.textContent = diceFaces[number - 1];

    const { data, error } =
        await supabaseClient
            .from("game_rooms")
            .select("players")
            .eq("room_id", roomId)
            .single();

    if (error) {
        result.textContent = "❌ " + error.message;
        return;
    }

    const players = Array.isArray(data.players)
        ? data.players
        : [];

    const updatedPlayers = players.map(p => {
        if (String(p.id) === String(player.id)) {
            const rolls = Array.isArray(p.rolls)
                ? [...p.rolls, number]
                : [number];

            return {
                ...p,
                rolls: rolls
            };
        }

        return p;
    });

    const { error: updateError } =
        await supabaseClient
            .from("game_rooms")
            .update({
                players: updatedPlayers
            })
            .eq("room_id", roomId);

    if (updateError) {
        result.textContent =
            "❌ " + updateError.message;
        return;
    }

    const myPlayer = updatedPlayers.find(
        p => String(p.id) === String(player.id)
    );

    const total =
        (myPlayer?.rolls || [])
            .reduce(
                (sum, value) =>
                    sum + Number(value),
                0
            );

    result.textContent =
        `🎉 ${player.name}\n` +
        `🎲 تاس: ${number}\n` +
        `🏆 مجموع: ${total}`;
}

rollButton.addEventListener(
    "click",
    rollDice
);

inviteButton.addEventListener(
    "click",
    () => {
        const inviteLink =
            `${window.location.origin}` +
            `${window.location.pathname}?room=${roomId}`;

        const shareUrl =
            `https://t.me/share/url?url=` +
            `${encodeURIComponent(inviteLink)}` +
            `&text=` +
            `${encodeURIComponent(
                "🎲 بیا وارد بازی من شو!"
            )}`;

        if (
            window.Telegram &&
            Telegram.WebApp
        ) {
            Telegram.WebApp.openTelegramLink(
                shareUrl
            );
        } else {
            window.open(
                shareUrl,
                "_blank"
            );
        }
    }
);

supabaseClient
    .channel(`room-${roomId}`)
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "game_rooms",
            filter: `room_id=eq.${roomId}`
        },
        payload => {
            if (payload.new) {
                showRoom(payload.new);
            }
        }
    )
    .subscribe();

loadRoom();onst dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");
const inviteButton = document.getElementById("inviteButton");

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);
let roomId = params.get("room");

if (!roomId) {
    roomId = Math.random().toString(36).slice(2, 8).toUpperCase();

    history.replaceState(
        null,
        "",
        `${window.location.pathname}?room=${roomId}`
    );
}

let currentUser = null;

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    currentUser = Telegram.WebApp.initDataUnsafe?.user;
}

if (!currentUser) {
    currentUser = {
        id: "guest-" + Math.random().toString(36).slice(2, 10),
        first_name: "مهمان"
    };
}

playerName.textContent =
    currentUser.first_name ||
    currentUser.username ||
    "بازیکن";

const player = {
    id: String(currentUser.id),
    name: currentUser.first_name ||
        currentUser.username ||
        "بازیکن",
    rolls: []
};

async function loadRoom() {
    const { data, error } = await supabaseClient
        .from("game_rooms")
        .select("*")
        .eq("room_id", roomId)
        .maybeSingle();

    if (error) {
        console.error(error);
        result.textContent = "❌ " + error.message;
        return;
    }

    if (!data) {
        const { data: newRoom, error: insertError } =
            await supabaseClient
                .from("game_rooms")
                .insert({
                    room_id: roomId,
                    players: [player],
                    status: "waiting"
                })
                .select()
                .single();

        if (insertError) {
            console.error(insertError);
            result.textContent = "❌ " + insertError.message;
            return;
        }

        showRoom(newRoom);
        return;
    }

    let players = Array.isArray(data.players)
        ? data.players
        : [];

    const exists = players.some(
        p => String(p.id) === String(player.id)
    );

    if (!exists) {
        players.push(player);

        const { error: updateError } =
            await supabaseClient
                .from("game_rooms")
                .update({
                    players: players
                })
                .eq("room_id", roomId);

        if (updateError) {
            console.error(updateError);
            result.textContent = "❌ " + updateError.message;
            return;
        }

        data.players = players;
    }

    showRoom(data);
}

function showRoom(data) {
    const players = Array.isArray(data.players)
        ? data.players
        : [];

    result.textContent =
        `🎲 اتاق: ${roomId}\n` +
        `👥 بازیکنان: ${players.length}`;

    rollButton.disabled = false;
}

async function rollDice() {
    const number =
        Math.floor(Math.random() * 6) + 1;

    dice.textContent = diceFaces[number - 1];

    const { data, error } =
        await supabaseClient
            .from("game_rooms")
            .select("players")
            .eq("room_id", roomId)
            .single();

    if (error) {
        result.textContent = "❌ " + error.message;
        return;
    }

    const players = Array.isArray(data.players)
        ? data.players
        : [];

    const updatedPlayers = players.map(p => {
        if (String(p.id) === String(player.id)) {
            const rolls = Array.isArray(p.rolls)
                ? [...p.rolls, number]
                : [number];

            return {
                ...p,
                rolls: rolls
            };
        }

        return p;
    });

    const { error: updateError } =
        await supabaseClient
            .from("game_rooms")
            .update({
                players: updatedPlayers
            })
            .eq("room_id", roomId);

    if (updateError) {
        result.textContent =
            "❌ " + updateError.message;
        return;
    }

    const myPlayer = updatedPlayers.find(
        p => String(p.id) === String(player.id)
    );

    const total =
        (myPlayer?.rolls || [])
            .reduce(
                (sum, value) =>
                    sum + Number(value),
                0
            );

    result.textContent =
        `🎉 ${player.name}\n` +
        `🎲 تاس: ${number}\n` +
        `🏆 مجموع: ${total}`;
}

rollButton.addEventListener(
    "click",
    rollDice
);

inviteButton.addEventListener(
    "click",
    () => {
        const inviteLink =
            `${window.location.origin}` +
            `${window.location.pathname}?room=${roomId}`;

        const shareUrl =
            `https://t.me/share/url?url=` +
            `${encodeURIComponent(inviteLink)}` +
            `&text=` +
            `${encodeURIComponent(
                "🎲 بیا وارد بازی من شو!"
            )}`;

        if (
            window.Telegram &&
            Telegram.WebApp
        ) {
            Telegram.WebApp.openTelegramLink(
                shareUrl
            );
        } else {
            window.open(
                shareUrl,
                "_blank"
            );
        }
    }
);

supabaseClient
    .channel(`room-${roomId}`)
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "game_rooms",
            filter: `room_id=eq.${roomId}`
        },
        payload => {
            if (payload.new) {
                showRoom(payload.new);
            }
        }
    )
    .subscribe();

loadRoom()
