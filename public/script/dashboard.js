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
}

async function loadTransactions() {
  const res = await authFetch("/api/transactions");
  const data = await res.json();
  console.log("API transactions:", data);
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
    const id = tx.id || tx.transaction_id;

    console.log("TX ID:", id);

    const li = document.createElement("li");
    li.className = "transaction";

    li.onclick = () => {
      window.location.href = `/transaction.html?id=${id}`;
    };

    const isIncome = tx.type === "income";
    const icon = isIncome ? "⬇️" : "⬆️";
    const sign = isIncome ? "+" : "-";

    li.innerHTML = `
      <div class="info">
        <span>${icon} ${tx.description}</span>
        <span>${formatDate(tx.created_at)}</span>
      </div>
      <div class="amount ${tx.type}">
        ${sign}${Number(tx.amount).toFixed(2)} ₴
      </div>
    `;

    list.appendChild(li);
  });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("uk-UA");
}

function setupButtons() {
  document.getElementById("transferBtn")?.addEventListener("click", () => {
    window.location.href = "/transfer.html";
  });

  document.getElementById("mobileBtn")?.addEventListener("click", () => {
    window.location.href = "/mobile.html";
  });
}

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
