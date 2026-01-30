document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
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
      div.innerHTML = "Помилка завантаження";
      return;
    }

    let html = `
      <p><b>Сума:</b> ${tx.amount} ₴</p>
      <p><b>Дата:</b> ${new Date(tx.created_at).toLocaleString()}</p>
      <p><b>Коментар:</b> ${tx.description}</p>
    `;

    if (tx.operation_type === "card") {
      html += `<p><b>Картка отримувача:</b> **** ${tx.target_card_number.slice(-4)}</p>`;
    }

    if (tx.operation_type === "mobile") {
      html += `<p><b>Номер телефону:</b> ${tx.phone_number}</p>`;
    }

    div.innerHTML = html;

  } catch (err) {
    console.error("Ошибка загрузки транзакции:", err);
  }
}

function goBack() {
  window.location.href = "/dashboard.html";
}
