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
      document.getElementById("fromCardNumber").innerText =
        maskCard(data.card_number);
      document.getElementById("fromCardBalance").innerText =
        `Баланс: ${Number(data.balance).toFixed(2)} ₴`;
    }
  } catch (e) {
    console.error(e);
  }
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
