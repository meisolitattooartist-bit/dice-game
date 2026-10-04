const dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");
const inviteButton = document.getElementById("inviteButton");

const diceFaces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);

let roomId = params.get("room");

if (!roomId) {
    roomId = Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();

    history.replaceState(
        null,
        "",
        `${window.location.pathname}?room=${roomId}`
    );
}

if (window.Telegram?.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

const tgUser =
    window.Telegram?.WebApp?.initDataUnsafe?.user;

const currentUser = tgUser || {
    id: "guest-" + Math.random().toString(36).slice(2),
    first_name: "مهمان"
};

playerName.textContent =
    currentUser.first_name ||
    currentUser.username ||
    "بازیکن";

const myId = String(currentUser.id);

let room = null;

function getPlayers() {
    return Array.isArray(room?.players)
        ? room.players
        : [];
}

function render() {
    const players = getPlayers();

    const lines = [];

    lines.push(`🎲 اتاق: ${roomId}`);
    lines.push(`👥 تعداد بازیکنان: ${players.length}`);
    lines.push("");

    players.forEach((p, index) => {
        const rolls = Array.isArray(p.rolls)
            ? p.rolls
            : [];

        const total = rolls.reduce(
            (sum, n) => sum + Number(n),
            0
        );

        lines.push(
            `${index + 1}. ${p.name}  🎲 ${rolls.length}/3  🏆 ${total}`
        );
    });

    result.textContent = lines.join("\n");

    const me = players.find(
        p => String(p.id) === myId
    );

    const myRolls = me?.rolls || [];

    rollButton.disabled = myRolls.length >= 3;

    if (myRolls.length >= 3) {
        rollButton.textContent = "✅ سه تاس کامل شد";
    } else {
        rollButton.textContent =
            `🎲 ریختن تاس (${myRolls.length + 1}/3)`;
    }
}

async function loadRoom() {
    const { data, error } =
        await supabaseClient
            .from("game_rooms")
            .select("*")
            .eq("room_id", roomId)
            .maybeSingle();

    if (error) {
        result.textContent =
            "❌ " + error.message;
        return;
    }

    if (!data) {
        const newPlayer = {
            id: myId,
            name:
                currentUser.first_name ||
                currentUser.username ||
                "بازیکن",
            rolls: []
        };

        const { data: newRoom, error: insertError } =
            await supabaseClient
                .from("game_rooms")
                .insert({
                    room_id: roomId,
                    players: [newPlayer],
                    status: "waiting"
                })
                .select()
                .single();

        if (insertError) {
            result.textContent =
                "❌ " + insertError.message;
            return;
        }

        room = newRoom;
        render();
        return;
    }

    room = data;

    let players = getPlayers();

    const exists = players.some(
        p => String(p.id) === myId
    );

    if (!exists) {
        if (players.length >= 10) {
            result.textContent =
                "❌ ظرفیت اتاق تکمیل است.";
            rollButton.disabled = true;
            return;
        }

        players.push({
            id: myId,
            name:
                currentUser.first_name ||
                currentUser.username ||
                "بازیکن",
            rolls: []
        });

        const { error: updateError } =
            await supabaseClient
                .from("game_rooms")
                .update({
                    players: players
                })
                .eq("room_id", roomId);

        if (updateError) {
            result.textContent =
                "❌ " + updateError.message;
            return;
        }

        room.players = players;
    }

    render();
}

async function rollDice() {
    const players = getPlayers();

    const index = players.findIndex(
        p => String(p.id) === myId
    );

    if (index === -1) {
        return;
    }

    const rolls = Array.isArray(players[index].rolls)
        ? [...players[index].rolls]
        : [];

    if (rolls.length >= 3) {
        return;
    }

    const number =
        Math.floor(Math.random() * 6) + 1;

    rolls.push(number);

    players[index] = {
        ...players[index],
        rolls: rolls
    };

    dice.textContent =
        diceFaces[number - 1];

    const { error } =
        await supabaseClient
            .from("game_rooms")
            .update({
                players: players
            })
            .eq("room_id", roomId);

    if (error) {
        result.textContent =
            "❌ " + error.message;
        return;
    }

    room.players = players;
    render();

    if (rolls.length === 3) {
        const total = rolls.reduce(
            (sum, n) => sum + Number(n),
            0
        );

        result.textContent +=
            `\n\n🏁 مجموع شما: ${total}`;
    }
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

        if (window.Telegram?.WebApp) {
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
                room = payload.new;
                render();
            }
        }
    )
    .subscribe();

loadRoom();
