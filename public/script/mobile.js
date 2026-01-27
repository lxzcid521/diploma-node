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
  loadPhoneHistory();
});

const phoneInput = document.getElementById("phone");

// Если поле пустое, подставляем +380
phoneInput.addEventListener("focus", () => {
  if (!phoneInput.value) {
    phoneInput.value = "+380";
  }
});

// Блокируем удаление +380
phoneInput.addEventListener("keydown", (e) => {
  // Разрешаем стрелки, цифры, backspace только после +380
  const start = phoneInput.selectionStart;
  if (
    start <= 4 && 
    (e.key === "Backspace" || e.key === "Delete")
  ) {
    e.preventDefault();
  }
});

// Убираем любые символы кроме цифр после +380
phoneInput.addEventListener("input", () => {
  if (!phoneInput.value.startsWith("+380")) {
    phoneInput.value = "+380";
  }
  // Оставляем только цифры после +380
  phoneInput.value = "+380" + phoneInput.value.slice(4).replace(/\D/g, "");
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

async function loadPhoneHistory() {
  try {
    const res = await authFetch("/api/mobile/history");
    const phones = await res.json();

    const container = document.getElementById("phoneHistory");
    container.innerHTML = "";

    phones.forEach(p => {
      const el = document.createElement("div");
      el.className = "saved-card";
      el.textContent = p.phone_number;

      el.onclick = () => {
        document.getElementById("phone").value = p.phone_number;
      };

      container.appendChild(el);
    });
  } catch (e) {
    console.error(e);
  }
}

