const list = document.getElementById("templatesList");
const saveBtn = document.getElementById("saveBtn");

loadTemplates();

saveBtn.onclick = async () => {
  const iban = document.getElementById("iban").value;
  const receiverName = document.getElementById("receiverName").value;
  const purpose = document.getElementById("purpose").value;

  const res = await authFetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ iban, receiverName, purpose })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("Шаблон збережено");
  loadTemplates();
};

async function loadTemplates() {
  const res = await authFetch("/api/templates");
  const templates = await res.json();

  list.innerHTML = "";

  templates.forEach(t => {
    const div = document.createElement("div");
    div.className = "template-card";

    div.innerHTML = `
  <div class="template-info">
    <b>${t.receiver_name}</b>
    <p>IBAN: ${t.iban}</p>
  </div>

  <input type="text" value="${t.purpose || ""}" id="purpose-${t.id}" placeholder="Назва шаблону">

  <div class="actions">
    <button onclick="updateTemplate(${t.id})">✏️ Змінити</button>
    <button onclick="deleteTemplate(${t.id})">🗑 Видалити</button>
  </div>
`;

    list.appendChild(div);
  });
}

window.deleteTemplate = function(id) {
  if (!confirm("Видалити шаблон?")) return;

  authFetch(`/api/templates/${id}`, {
    method: "DELETE"
  }).then(() => loadTemplates());
};


async function updateTemplate(id) {
  const newPurpose = document.getElementById(`purpose-${id}`).value;

  const res = await authFetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: newPurpose })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("Оновлено");
}
function goBack() {
  window.location.href = "/payments.html";
}