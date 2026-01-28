let myCardNumber = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  const res = await authFetch("/api/card");
  const data = await res.json();

  myCardNumber = String(data.card_number);

  document.getElementById("fromCardNumber").innerText =
    maskCard(data.card_number);
  document.getElementById("fromCardBalance").innerText =
    `Баланс: ${Number(data.balance).toFixed(2)} ₴`;

  renderSavedCards();
});

function maskCard(card) {
  return "•••• •••• •••• " + card.slice(-4);
}

document.getElementById("transferForm").addEventListener("submit", async e => {
  e.preventDefault();

  const toCardNumber = document.getElementById("toCard").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const description = document.getElementById("comment").value.trim();

  if (!toCardNumber || amount <= 0) {
    alert("Некоректні дані");
    return;
  }

  const res = await authFetch("/api/transfer", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ toCardNumber, amount, description })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Переказ успішний!");
    window.location.href = "/dashboard.html";
  } else {
    alert(data.error || "Помилка переказу");
  }
});

async function renderSavedCards() {
  const list = document.getElementById("savedCardsList");

  const res = await authFetch("/api/transfer/history");
  const cards = await res.json();

  list.innerHTML = "";

  if (!Array.isArray(cards)) return;

  cards.forEach(c => {
    const el = document.createElement("div");
    el.className = "saved-card";
    el.textContent = "•••• •••• •••• " + c.card_number.slice(-4);

    el.onclick = () => {
      document.getElementById("toCard").value = c.card_number;
    };

    list.appendChild(el);
  });
}

function goBack() {
  window.location.href = "/dashboard.html";
}
