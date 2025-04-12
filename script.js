const counter = document.getElementById("counter");
const clickBtn = document.getElementById("clickBtn");
const deleteBtn = document.getElementById("deleteBtn");
const SystemLabel = document.getElementById("SystemLabel");
const SystelTitle = document.getElementById("SystelTitle");

const ws = new WebSocket("wss://testserver-production-0d2a.up.railway.app");

let last_joke = "No joke.";
let accountToken = localStorage.getItem("accountToken");

ws.addEventListener("open", () => {
  if (accountToken) {
    ws.send(JSON.stringify({
      type: "auth_token",
      token: accountToken
    }));
  } else {
    const action = prompt("Welcome! Type 'login' or 'signup'").toLowerCase();

    if (action === "signup") {
      const username = prompt("Choose a username:");
      if (username) {
        ws.send(JSON.stringify({
          type: "create_account",
          username
        }));
      }
    } else if (action === "login") {
      const trytoken = prompt("Enter your password:");
      if (trytoken) {
        ws.send(JSON.stringify({
          type: "auth_token",
          token: trytoken
        }));
        localStorage.setItem("accountToken", trytoken);
      }
    } else {
      alert("Invalid option.");
    }
  }
});

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
  const digitCount = value.toString().length;
  const target = 10 ** digitCount - 1;

  const percent = Math.min((value / target) * 95, 100);
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
    document.getElementById("Lastclick").textContent = `Last click From ${data.from}`;

    if (data.joke.type === 'single') {
      document.getElementById("SystemLabel").textContent = data.joke.joke;
    } else {
      document.getElementById("SystemLabel").textContent = `${data.joke.setup} - ${data.joke.delivery}`;
    }

    if (data.joke.joke !== last_joke) {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
    
      hours = hours % 12;
      hours = hours ? hours : 12; 
      minutes = minutes < 10 ? '0' + minutes : minutes;
    
      SystelTitle.textContent = `System ● ${hours}:${minutes} ${ampm} | Click have chance`;
      
      last_joke = data.joke.joke;
    }
    
  }  

  if (data.type === "account_created") {
    alert("Account created!");
    localStorage.setItem("accountToken", data.token);
  
    const box = document.querySelector(".box");
    if (box && box.parentNode) {
      box.parentNode.removeChild(box);
    }
  
    const box2 = document.createElement("div");
    box2.className = "box2";
  
    console.log("box2 created:", box2);
  
    const h1 = document.createElement("h1");
    box2.appendChild(h1);
  
    document.body.appendChild(box2);
  
    alert("Your password is: " + data.token);
  }   

  if (data.type === "auth_success") {
    document.getElementById("Usernamelabel").textContent = `Username: ${data.username || "Guest"}`;
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

deleteBtn.addEventListener("click", () => {
  const token = localStorage.getItem("accountToken");
  if (!token) {
    alert("No account found.");
    return;
  }

  if (!confirm("Are you sure you want to delete your account?")) {
    return;
  }

  socket.send(JSON.stringify({
    type: "deleteAccount",
    token: token
  }));
});
