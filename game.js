const dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const roomId =
    new URLSearchParams(window.location.search).get("room") ||
    Math.random().toString(36).slice(2, 8).toUpperCase();

history.replaceState(
    null,
    "",
    `${window.location.pathname}?room=${roomId}`
);

result.textContent = `اتاق بازی: ${roomId}`;

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();

    const user = Telegram.WebApp.initDataUnsafe?.user;

    if (user) {
        playerName.textContent =
            user.first_name || user.username || "بازیکن";
    }
}

rollButton.addEventListener("click", () => {
    const number = Math.floor(Math.random() * 6) + 1;

    dice.textContent = diceFaces[number - 1];
    result.textContent = `🎉 عدد تاس: ${number}`;
});

const inviteButton = document.getElementById("inviteButton");

inviteButton.addEventListener("click", async () => {
    const inviteLink =
        `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    try {
        await navigator.clipboard.writeText(inviteLink);
        result.textContent = "✅ لینک دعوت کپی شد";
    } catch {
        result.textContent = inviteLink;
    }
});
