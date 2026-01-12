
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/index.html";
    return;
  }
 loadTransactions();

  document.getElementById("welcomeText").innerText = user.full_name;

  try {
    const res = await authFetch("/api/card");
    const data = await res.json();

    if (res.ok) {
      document.getElementById("cardNumber").innerText = data.card_number;
      document.getElementById("cardHolder").innerText = data.card_holder;
      document.getElementById("cardExpiry").innerText = data.card_expiry;
      document.getElementById("cardBalance").innerText = data.balance;
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error("Ошибка загрузки карты:", err);
  }
});

function openCardDetails() {
  alert("Деталі картки UrBank");
}

 /**Получаем инфу с нашего API в самой функции ключаевая логика как я отображаю данные  */

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
    const li = document.createElement("li");
    li.className = "transaction";

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

/**Форматирую данные  */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
let inactivityTimer;

function resetTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(logoutUser, 10 * 60 * 1000);
}



["click", "mousemove", "keydown"].forEach(e =>
  document.addEventListener(e, resetTimer)
);

resetTimer();

const transferBtn = document.getElementById("transferBtn");

if (transferBtn) {
  transferBtn.addEventListener("click", () => {
    window.location.href = "/transfer.html";
  });
}

