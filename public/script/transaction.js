console.log("FULL URL:", window.location.href);


document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("Transaction ID:", id);

  if (!id) {
    alert("Немає id транзакції");
    window.location.href = "/dashboard.html";
    return;
  }

  loadTransaction(id);
});

async function loadTransaction(id) {
  try {
    const res = await authFetch(`/api/transactions/${id}`);
    const tx = await res.json();

    const div = document.getElementById("details");

    if (!res.ok) {
      div.innerHTML = `<div class="card-box">Помилка завантаження</div>`;
      return;
    }

    const isIncome = tx.type === "income";
    const amountClass = isIncome ? "income" : "expense";
    const sign = isIncome ? "+" : "-";


    let extraInfo = "";

    if (tx.operation_type === "card") {
      extraInfo = `
        <p>Картка отримувача: <span>**** ${tx.target_card_number.slice(-4)}</span></p>
      `;
    }

    if (tx.operation_type === "mobile") {
      extraInfo = `
        <p>Номер телефону: <span>${tx.phone_number}</span></p>
      `;
    }

    div.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-name">Операція</span>
          <span class="amount ${amountClass}">${sign}${tx.amount} ₴</span>
        </div>

        <div class="card-body">
          <div class="card-box">
            <p>Дата: <span>${new Date(tx.created_at).toLocaleString()}</span></p>
            <p>Коментар: <span>${tx.description || "—"}</span></p>
            ${extraInfo}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    console.error("Ошибка загрузки транзакции:", err);
  }
}


function goBack() {
  window.location.href = "/dashboard.html";
}
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

    return authFetch(url, options); // повтор запроса
  }

  return res;
}

function logoutUser() {
  fetch("/api/logout", { method: "POST", credentials: "include" });
  localStorage.clear();
  window.location.href = "/index.html";
}