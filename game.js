// game.js
document.addEventListener("DOMContentLoaded", () => {
    if (typeof items === "undefined") {
        console.error("items.js not loaded or 'items' array missing!");
        return;
    }

    let coins = 50;
    let playerInventory = ["Rock", "Paper", "Scissors"];
    let botInventory = ["Rock", "Paper", "Scissors"];
    let difficulty = 50;

    // ===== DOM REFS =====
    const COIN_EL = document.getElementById("coin-count");
    const BATTLE_STATUS = document.getElementById("battle-status");
    const DIFFICULTY_SLIDER = document.getElementById("difficulty-slider");
    const DIFFICULTY_VALUE = document.getElementById("difficulty-value");

    // ===== SCREEN NAVIGATION =====
    const navButtons = document.querySelectorAll("nav button");
    const screens = document.querySelectorAll(".screen");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("aria-controls");
            screens.forEach(screen => {
                const active = screen.id === targetId;
                screen.classList.toggle("active", active);
                screen.hidden = !active;
            });

            navButtons.forEach(b => b.setAttribute("aria-selected", b === btn));
        });
    });

    // ===== DIFFICULTY SLIDER =====
    DIFFICULTY_SLIDER.addEventListener("input", (e) => {
        difficulty = parseInt(e.target.value, 10);
        DIFFICULTY_VALUE.textContent = difficulty;
        DIFFICULTY_SLIDER.setAttribute("aria-valuenow", difficulty);
    });

    // ===== BATTLE SYSTEM =====
    function renderBattleChoices() {
        const container = document.getElementById("battle-choices");
        container.innerHTML = "";
        playerInventory.forEach(name => {
            const item = items.find(i => i.name === name);
            if (item) {
                const btn = document.createElement("button");
                btn.textContent = `${item.emoji} ${item.name}`;
                btn.addEventListener("click", () => startBattle(item));
                container.appendChild(btn);
            }
        });
    }

    function startBattle(playerItem) {
        const botItem = chooseBotItem();
        const result = getBattleResult(playerItem, botItem);
        updateBattleStatus(playerItem, botItem, result);
        if (result === "win") {
            coins += 10;
            updateCoins();
        }
    }

    function chooseBotItem() {
        const allItems = botInventory.map(name => items.find(i => i.name === name));
        if (Math.random() < difficulty / 100) {
            const playerItems = playerInventory.map(name => items.find(i => i.name === name));
            const counters = allItems.filter(bi =>
                playerItems.some(pi => bi.beats.includes(pi.name))
            );
            if (counters.length > 0) {
                return counters[Math.floor(Math.random() * counters.length)];
            }
        }
        return allItems[Math.floor(Math.random() * allItems.length)];
    }

    function getBattleResult(playerItem, botItem) {
        if (playerItem.name === botItem.name) return "draw";
        if (playerItem.beats.includes(botItem.name)) return "win";
        return "lose";
    }

    function updateBattleStatus(playerItem, botItem, result) {
        let msg = `You chose ${playerItem.emoji} ${playerItem.name}. Bot chose ${botItem.emoji} ${botItem.name}. `;
        if (result === "win") msg += "You win! 🎉 +10 coins";
        if (result === "lose") msg += "You lose! 😢";
        if (result === "draw") msg += "It’s a draw! 🤝";
        BATTLE_STATUS.textContent = msg;
    }

    // ===== COINS =====
    function updateCoins() {
        COIN_EL.textContent = coins;
    }

    // ===== SHOP =====
    function renderShop() {
        const shopContainer = document.getElementById("shop-items");
        shopContainer.innerHTML = "";
        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "shop-item";
            card.innerHTML = `
                <div class="item-info">
                    <span class="item-emoji">${item.emoji}</span>
                    <span class="item-name">${item.name}</span>
                </div>
                <span class="item-rarity ${item.rarity.toLowerCase()}">${item.rarity}</span>
                <button>Buy (${item.cost} 💰)</button>
            `;
            const btn = card.querySelector("button");
            btn.addEventListener("click", () => {
                if (coins >= item.cost && !playerInventory.includes(item.name)) {
                    coins -= item.cost;
                    playerInventory.push(item.name);
                    updateCoins();
                    renderBattleChoices();
                    btn.disabled = true;
                }
            });
            if (playerInventory.includes(item.name)) {
                btn.disabled = true;
            }
            shopContainer.appendChild(card);
        });
    }

    // ===== MATCHUPS =====
    function renderMatchups() {
        const table = document.createElement("table");
        const header = document.createElement("tr");
        header.innerHTML = `<th></th>` + items.map(i => `<th>${i.name}</th>`).join("");
        table.appendChild(header);

        items.forEach(rowItem => {
            const row = document.createElement("tr");
            row.innerHTML = `<th>${rowItem.name}</th>` +
                items.map(colItem => {
                    if (rowItem.name === colItem.name) return `<td>—</td>`;
                    if (rowItem.beats.includes(colItem.name)) return `<td>✅</td>`;
                    if (colItem.beats.includes(rowItem.name)) return `<td>❌</td>`;
                    return `<td>🤝</td>`;
                }).join("");
            table.appendChild(row);
        });

        const container = document.getElementById("matchup-chart");
        container.innerHTML = "";
        container.appendChild(table);
    }

    // ===== BOT INVENTORY =====
    function renderBotInventory() {
        const container = document.getElementById("bot-inventory-list");
        container.innerHTML = "";
        botInventory.forEach(name => {
            const item = items.find(i => i.name === name);
            if (item) {
                const div = document.createElement("div");
                div.textContent = `${item.emoji} ${item.name}`;
                container.appendChild(div);
            }
        });
    }

    // ===== INIT =====
    updateCoins();
    renderBattleChoices();
    renderShop();
    renderMatchups();
    renderBotInventory();
});
