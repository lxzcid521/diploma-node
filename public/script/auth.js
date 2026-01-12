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