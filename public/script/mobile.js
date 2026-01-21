document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  try {
    const res = await authFetch("/api/card");
    const data = await res.json();

    if (res.ok) {
      myCardNumber = String(data.card_number);
      document.getElementById("fromCardNumber").innerText =
        maskCard(data.card_number);
      document.getElementById("fromCardBalance").innerText =
        `Баланс: ${Number(data.balance).toFixed(2)} ₴`;
    }
  } catch (e) {
    console.error(e);
  }
});

function maskCard(card) {
  return "•••• •••• •••• " + card.slice(-4);
}

document.getElementById("mobileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const amount = Number(document.getElementById("amount").value);
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

    alert("Мобільний успішно поповнено!");
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
});
function goBack() {
  window.location.href = "/dashboard.html";
}

function validePhone(phone) {

	phone = phone.replace('+38(', '');

	str = phone.match(/\d/g);
	
	if(!str) {
		return '+38';
	}
	str = str.join('');

	if(str.length == 1) {
		if(str == '3') {

			return '+3';
		}
		if(str == '8') {

			return '+38';
		}
		if(str == '0') {

			return '+380';
		}
	} 
	if(str.indexOf(380) === 0) {
		str = str.substr(3);
	} else if(str.indexOf(38) === 0) {
		str = str.substr(2);
	} else if(str.indexOf(80) === 0) {
		str = str.substr(2);
	} else if(str.indexOf(3) === 0) {
		str = str.substr(1);
	} else if(str.indexOf(8) === 0) {
		str = str.substr(1);
	} else if(str.indexOf(0) === 0) {
		str = str.substr(1);
	}
	str = '+380'+str;
	return str;
}