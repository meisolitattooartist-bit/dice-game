const dice = document.getElementById("dice");
const result = document.getElementById("result");
const rollButton = document.getElementById("rollButton");
const playerName = document.getElementById("playerName");

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

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
