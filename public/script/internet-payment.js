let paymentData = {};

function selectService(name) {
  document.getElementById("serviceName").value = name;
}

function openConfirm() {
  const serviceName = document.getElementById("serviceName").value;
  const amount = document.getElementById("amount").value;
  const purpose = document.getElementById("purpose").value;
  const status = document.getElementById("statusMsg");

  if (!serviceName || !amount) {
    status.textContent = "Заповніть всі поля";
    status.style.color = "red";
    return;
  }

  paymentData = { serviceName, amount, purpose };

  document.getElementById("confirmText").innerText =
    `Сервіс: ${serviceName}
Сума: ${amount} ₴
Призначення: ${purpose || "Оплата послуг"}`;

  document.getElementById("confirmModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

async function confirmPayment() {
  closeModal();

  const status = document.getElementById("statusMsg");

  try {
    const res = await authFetch("/api/internet-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData)
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = data.error || "Помилка платежу";
      status.style.color = "red";
      return;
    }

    status.textContent = "Платіж успішний ✔️";
    status.style.color = "green";
    clearForm();

  } catch (err) {
    status.textContent = "Помилка з'єднання з сервером";
    status.style.color = "red";
  }
}

function clearForm() {
  document.getElementById("serviceName").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("purpose").value = "";
}

function goBack() {
  window.location.href = "/payments.html";
}