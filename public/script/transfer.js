let myCardNumber = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  try {
    const res = await authFetch("/api/card");
    const data = await res.json();

    if (res.ok) {
      myCardNumber = String(data.card_number);
      document.getElementById("fromCardNumber").innerText =
        maskCard(data.card_number);
      document.getElementById("fromCardBalance").innerText =
        `Баланс: ${Number(data.balance).toFixed(2)} ₴`;
    }
  } catch (e) {
    console.error(e);
  }
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

  try {
    const res = await authFetch("/api/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toCardNumber, amount, description })
    });

    const data = await res.json();

    if (res.ok) {
      saveCard(toCardNumber);
      alert("Переказ успішний!");
      window.location.href = "/dashboard.html";
    } else {
      alert(data.error || "Помилка переказу");
    }
  } catch (err) {
    console.error(err);
    alert("Помилка сервера");
  }
});

function goBack() {
  window.location.href = "/dashboard.html";
}


function getSavedCards() {
  return JSON.parse(localStorage.getItem("savedCards")) || [];
}

function renderSavedCards() {
  const list = document.getElementById("savedCardsList");
  if (!list) return;

  const cards = getSavedCards();
  list.innerHTML = "";

  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = "saved-card";
    el.textContent = "•••• •••• •••• " + card.cardNumber.slice(-4);

    el.onclick = () => {
      const input = document.getElementById("toCard");
      input.value = card.cardNumber;
      input.focus();
    };

    list.appendChild(el);
  });
}


function saveCard(cardNumber) {
  if (String(cardNumber) === String(myCardNumber)) {
    return; /** не сохраняем свою карту */
  }

  let cards = getSavedCards();

  cards = cards.filter(c => String(c.cardNumber) !== String(cardNumber));

  cards.unshift({
    cardNumber: String(cardNumber),
    lastUsed: new Date().toISOString()
  });

  cards = cards.slice(0, 5);

  localStorage.setItem("savedCards", JSON.stringify(cards));
}



