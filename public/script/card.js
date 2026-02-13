document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    alert("Немає id картки");
    window.location.href = "/dashboard.html";
    return;
  }

  loadCard(id);
});

async function loadCard(id) {
  try {
    const res = await authFetch(`/api/cards/${id}`);
    const card = await res.json();

    if (!res.ok) {
      document.getElementById("cardDetails").innerHTML = "Помилка завантаження";
      return;
    }

    document.getElementById("cardDetails").innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-name">${card.card_name || "Моя картка"}</span>
          <span>${card.balance} ₴</span>
        </div>

        <div class="card-body">
          <div class="card-number">${card.card_number}</div>

          <div class="card-info">
            <div>
              <small>Термін дії</small><br>
              ${card.card_expiry}
            </div>
            <div>
              <small>CVV</small><br>
              <span id="cvv">***</span>
              <button onclick="toggleCVV('${card.cvv}')">👁</button>
            </div>
          </div>

          <div class="card-box">
            <p>IBAN: <span>${card.iban || "UA00 XXXX XXXX XXXX"}</span></p>
            <p>Власник: <span>${card.card_holder}</span></p>
          </div>

          <button class="btn" onclick="shareCard('${card.card_number}','${card.iban}','${card.card_holder}')">
            Поділитись реквізитами
          </button>
        </div>
      </div>
    `;

  } catch (err) {
    console.error("Ошибка:", err);
  }
}

function toggleCVV(cvv) {
  const el = document.getElementById("cvv");
  el.textContent = el.textContent === "***" ? cvv : "***";
}

function shareCard(number, iban, holder) {
  const text = `Номер картки: ${number}\nIBAN: ${iban}\nОтримувач: ${holder}\n`;

  navigator.clipboard.writeText(text);
  alert("Реквізити скопійовано ✔");
}

function goBack() {
  window.location.href = "/dashboard.html";
}



