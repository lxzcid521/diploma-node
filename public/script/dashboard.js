document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  document.getElementById("welcomeText").innerText = user.full_name;

  loadTransactions();
  loadCard();

  setupButtons();
  setupInactivityTimer();
});

async function loadCard() {
  try {
    const res = await authFetch("/api/card");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    document.getElementById("cardNumber").innerText = data.card_number;
    document.getElementById("cardHolder").innerText = data.card_holder;
    document.getElementById("cardExpiry").innerText = data.card_expiry;
    document.getElementById("cardBalance").innerText = data.balance;
  } catch (err) {
    console.error("Ошибка загрузки карты:", err);
  }
}

/** Загружаем список транзакций */
async function loadTransactions() {
  const res = await authFetch("/api/transactions");
  if (!res) return;

  const data = await res.json();
  renderTransactions(data);
}

function renderTransactions(transactions) {
  const list = document.getElementById("transactionsList");
  list.innerHTML = "";

  if (!transactions.length) {
    list.innerHTML = "<li>Операцій поки немає</li>";
    return;
  }

  transactions.forEach(tx => {
    console.log("TX:", tx);

    const li = document.createElement("li");
    li.className = "transaction";

    li.onclick = () => {
      window.location.href = `/transaction.html?id=${tx.transaction_id}`;
    };

    const isIncome = tx.type === "income";
    const icon = isIncome ? "⬇️" : "⬆️";
    const sign = isIncome ? "+" : "-";

    li.innerHTML = `
      <div class="info">
        <span class="desc">${icon} ${tx.description}</span>
        <span class="date">${formatDate(tx.created_at)}</span>
      </div>
      <div class="amount ${tx.type}">
        ${sign}${Number(tx.amount).toFixed(2)} ₴
      </div>
    `;

    list.appendChild(li);
  });
}

/** Формат даты */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/** Кнопки */
function setupButtons() {
  const transferBtn = document.getElementById("transferBtn");
  if (transferBtn) {
    transferBtn.addEventListener("click", () => {
      window.location.href = "/transfer.html";
    });
  }

  const mobileBtn = document.getElementById("mobileBtn");
  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      window.location.href = "/mobile.html";
    });
  }
}

/** Таймер неактивности */
let inactivityTimer;

function setupInactivityTimer() {
  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutUser, 10 * 60 * 1000);
  }

  ["click", "mousemove", "keydown"].forEach(e =>
    document.addEventListener(e, resetTimer)
  );

  resetTimer();
}
