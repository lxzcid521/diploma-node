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
});

function maskCard(card) {
  return "•••• •••• •••• " + card.slice(-4);
}

document.getElementById("mobileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const comment = document.getElementById("comment").value;

  if (!phone.startsWith("+380") || phone.length < 13) {
    alert("Введіть коректний номер телефону");
    return;
  }

  try {
    const res = await authFetch("/api/mobile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        amount,
        comment
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Помилка");

    alert("Мобільний успішно поповнено!");
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
});
function goBack() {
  window.location.href = "/dashboard.html";
}

