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
              ${card.expiry_date}
            </div>
            <div>
              <small>CVV</small><br>
              <span id="cvv">***</span>
              <button onclick="toggleCVV('${card.cvv}')">👁</button>
            </div>
          </div>

          <div class="card-box">
            <p>IBAN: <span>${card.iban || "UA00 XXXX XXXX XXXX"}</span></p>
            <p>Власник: <span>${card.owner_name}</span></p>
          </div>

          <button class="btn" onclick="shareCard('${card.card_number}','${card.iban}')">
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

function shareCard(number, iban) {
  const text = `Номер картки: ${number}\nIBAN: ${iban}`;

  navigator.clipboard.writeText(text);
  alert("Реквізити скопійовано ✔");
}

function goBack() {
  window.location.href = "/dashboard.html";
}


// ===== authFetch как у тебя =====
async function authFetch(url, options = {}) {
  const accessToken = localStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "include"
  });

  if (res.status === 401) {
    const refreshRes = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include"
    });

    if (!refreshRes.ok) {
      logoutUser();
      return;
    }

    const data = await refreshRes.json();
    localStorage.setItem("accessToken", data.accessToken);
    return authFetch(url, options);
  }

  return res;
}

function logoutUser() {
  fetch("/api/logout", { method: "POST", credentials: "include" });
  localStorage.clear();
  window.location.href = "/index.html";
}
