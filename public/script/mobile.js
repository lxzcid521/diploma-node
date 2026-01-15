document.getElementById("mobileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const amount = document.getElementById("amount").value;
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

    alert("Мобільний успішно поповнено ✅");
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
});
