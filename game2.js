const dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");
const inviteButton = document.getElementById("inviteButton");

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

const params = new URLSearchParams(location.search);
let roomId = null;

if (!roomId) {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    history.replaceState(null, "", "?room=" + roomId);
}

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

function parseStatus(status) {
    const parts = String(status || "").split(":");

    if (parts[0] === "waiting") {
        return {
            state: "waiting",
            max: Number(parts[1] || 0),
            round: 0,
            turn: 0
        };
    }

    if (parts[0] === "playing") {
        return {
            state: "playing",
            max: Number(parts[1] || 0),
            round: Number(parts[2] || 1),
            turn: Number(parts[3] || 0)
        };
    }

    if (parts[0] === "finished") {
        return {
            state: "finished",
            max: Number(parts[1] || 0),
            round: 4,
            turn: 0
        };
    }

    return {
        state: "waiting",
        max: 0,
        round: 0,
        turn: 0
    };
}

const tgUser = tg?.initDataUnsafe?.user;

const savedGuestId = sessionStorage.getItem("dice_guest_id") || (
    "guest-" + Math.random().toString(36).substring(2)
);

sessionStorage.setItem("dice_guest_id", savedGuestId);

const me = {
    id: String(
        tgUser?.id || savedGuestId
    ),
    name:
        tgUser?.first_name ||
        tgUser?.username ||
        "مهمان",
    rolls: []
};

playerName.textContent = me.name;

let room = null;

function getPlayers() {
    return Array.isArray(room?.players)
        ? room.players
        : [];
}

function render() {
    const list = getPlayers();

    let output =
        "🎲 اتاق: " + roomId + "\n" +
        "👥 تعداد بازیکنان: " + list.length + "\n\n";

    list.forEach((p, index) => {
        const rolls =
            Array.isArray(p.rolls)
                ? p.rolls
                : [];

        const total = rolls.reduce(
            (sum, n) => sum + Number(n),
            0
        );

        output +=
            `${index + 1}. ${p.name}\n` +
            `   🎲 تاس: ${rolls.length}/3\n` +
            `   🏆 مجموع: ${total}\n\n`;
    });

    result.textContent = output;

    const mine = list.find(
        p => String(p.id) === me.id
    );

    const count = mine?.rolls?.length || 0;

    rollButton.disabled = count >= 3;

    if (count >= 3) {
        rollButton.textContent =
            "✅ سه تاس کامل شد";
    } else {
        rollButton.textContent =
            `🎲 ریختن تاس ${count + 1}/3`;
    }
}

async function loadRoom() {

    const { data, error } =
        await supabaseClient
            .from("game_rooms")
            .select("id,room_id,players,status")
            .eq("room_id", roomId)
            .maybeSingle();

    if (error) {
        result.textContent =
            "❌ " + error.message;
        return;
    }

    if (!data) {

        const { data: created, error: insertError } =
            await supabaseClient
                .from("game_rooms")
                .insert({
                    room_id: roomId,
                    players: [me],
                    status: "waiting"
                })
                .select("id,room_id,players,status")
                .single();

        if (insertError) {
            result.textContent =
                "❌ " + insertError.message;
            return;
        }

        room = created;
        render();
        return;
    }

    room = data;

    const list = getPlayers();

    const alreadyJoined =
        list.some(
            p => String(p.id) === me.id
        );

    if (!alreadyJoined) {

        if (list.length >= 10) {
            result.textContent =
                "❌ ظرفیت اتاق تکمیل است.";
            rollButton.disabled = true;
            return;
        }

        list.push(me);

        const { error: updateError } =
            await supabaseClient
                .from("game_rooms")
                .update({
                    players: list
                })
                .eq("room_id", roomId);

        if (updateError) {
            result.textContent =
                "❌ " + updateError.message;
            return;
        }

        room.players = list;
    }

    render();
}

async function rollDice() {

    const list = getPlayers();

    const index = list.findIndex(
        p => String(p.id) === me.id
    );

    if (index === -1) return;

    const rolls =
        Array.isArray(list[index].rolls)
            ? [...list[index].rolls]
            : [];

    if (rolls.length >= 3) return;

    const value =
        Math.floor(Math.random() * 6) + 1;

    rolls.push(value);

    list[index] = {
        ...list[index],
        rolls: rolls
    };

    dice.textContent =
        faces[value - 1];

    const { error } =
        await supabaseClient
            .from("game_rooms")
            .update({
                players: list
            })
            .eq("room_id", roomId);

    if (error) {
        result.textContent =
            "❌ " + error.message;
        return;
    }

    room.players = list;

    render();
}

rollButton.addEventListener(
    "click",
    rollDice
);

inviteButton.addEventListener(
    "click",
    () => {

        const link =
            location.origin +
            location.pathname +
            "?room=" +
            roomId;

        const share =
            "https://t.me/share/url?url=" +
            encodeURIComponent(link) +
            "&text=" +
            encodeURIComponent(
                "🎲 بیا وارد بازی من شو!"
            );

        if (tg) {
            tg.openTelegramLink(share);
        } else {
            location.href = share;
        }
    }
);

supabaseClient
    .channel("room-" + roomId)
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "game_rooms",
            filter:
                "room_id=eq." + roomId
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
