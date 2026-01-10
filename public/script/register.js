document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    
    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value.trim();
    const submitBtn = e.submitter || document.querySelector("#registerForm button");
    const confirm = document.getElementById("confirm").value;

    if (!full_name || !email || !password) {
        alert("Будь ласка, заповніть обов'язкові поля (ПІБ, Email, Пароль).");
        return;
    }
    if (password.length < 8) {
        alert("Пароль має містити мінімум 8 символів.");
        return;
    }
    if (password !== confirm) {
    alert("Паролі не співпадають");
    return;
    }
    if (submitBtn) submitBtn.disabled = true; 

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ full_name, email, password, phone })
        });

        const data = await res.json(); 

        if (res.ok) {
            alert("Реєстрація успішна! Ласкаво просимо.");
            window.location.href = "/index.html";
        } else {
            alert(`Помилка: ${data.error || "Невідома помилка реєстрації."}`);
        }

    } catch (error) {
        console.error("Помилка під час відправки запиту:", error);
        alert("Не вдалося підключитися до сервера. Перевірте з'єднання.");
        
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});
