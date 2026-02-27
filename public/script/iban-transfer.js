let transferData = {};

function openConfirm() {
  const iban = document.getElementById("iban").value;
  const receiverName = document.getElementById("receiverName").value;
  const amount = document.getElementById("amount").value;
  const purpose = document.getElementById("purpose").value;

  if (!isValidIBAN(iban)) {
    alert("Невірний IBAN");
    return;
  }

  transferData = { iban, receiverName, amount, purpose };

  document.getElementById("confirmText").innerText =
    `IBAN: ${iban}\nОтримувач: ${receiverName}\nСума: ${amount} ₴\nПризначення: ${purpose}`;

  document.getElementById("confirmModal").style.display = "flex";
}

async function confirmTransfer() {
  const res = await authFetch("/api/iban-transfer", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(transferData)
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  alert("Переказ успішний ✔️");
  closeModal();
  window.location.href = "dashboard.html";

}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

async function saveTemplate() {
  const res = await authFetch("/api/templates", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      iban: transferData.iban,
      receiverName: transferData.receiverName,
      purpose: transferData.purpose
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Помилка збереження шаблону");
    return;
  }

  alert("Шаблон збережено");
}

function isValidIBAN(iban) {
  return /^UA\d{27}$/.test(iban.replace(/\s/g,''));
}

function goBack() {
  window.location.href = "/payments.html";
}
