document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // важно! чтобы cookie refreshToken пришёл
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("accessToken", data.accessToken);

    localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "/dashboard.html";
  } else {
    alert(data.error);
  }
});
