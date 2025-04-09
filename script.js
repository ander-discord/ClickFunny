const counter = document.getElementById("counter");
const clickBtn = document.getElementById("clickBtn");
const ws = new WebSocket("wss://testserver-production-0d2a.up.railway.app");

let accountToken = localStorage.getItem("accountToken");

if (!accountToken) {
  const username = prompt("Create your account - Enter a username:");

  if (username) {
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        type: "create_account",
        username
      }));
    });
  }
} else {
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({
      type: "auth_token",
      token: accountToken
    }));
  });
}

function createDigitColumn(digit) {
  const column = document.createElement("div");
  column.className = "digit-column";

  for (let i = 0; i <= 9; i++) {
    const span = document.createElement("span");
    span.textContent = i;
    column.appendChild(span);
  }

  column.style.transform = `translateY(-${digit * 3.2}rem)`;
  return column;
}

function renderDigits(value) {
  const padded = value.toString().padStart(7, "0").split("");

  const percent = Math.min((value / 1000000) * 100, 100);
  document.getElementById("progressOverlay").style.height = `${percent}%`;
  while (counter.children.length < padded.length) {
    counter.appendChild(createDigitColumn(0));
  }

  padded.forEach((digit, i) => {
    const column = counter.children[i];
    const targetY = `-${digit * 3.2}rem`;

    if (column.style.transform !== `translateY(${targetY})`) {
      column.style.transform = `translateY(${targetY})`;
    }
  });
}

ws.addEventListener("message", event => {
  const data = JSON.parse(event.data);

  if (data.type === "account_error") {
    alert("Error: " + data.message);
    localStorage.removeItem("accountToken");
    location.reload(); 
  }

  if (data.type === "update") {
    renderDigits(data.count);
  }

  if (data.type === "account_created") {
    alert("Account created!");
    localStorage.setItem("accountToken", data.token);
  }

  if (data.type === "auth_success") {
    console.log(`Logged With token: ${localStorage.getItem("accountToken")}`);
  }
  if (data.type === "auth_failed") {
    alert("Error 011");
    localStorage.removeItem("accountToken");
  }
});

clickBtn.addEventListener("click", () => {
  ws.send(JSON.stringify({
    type: "increment",
    token: localStorage.getItem("accountToken")
  }));
});
