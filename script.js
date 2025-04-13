const counter = document.getElementById("counter");
const deleteBtn = document.getElementById("deleteBtn");
const SystemLabel = document.getElementById("SystemLabel");
const SystelTitle = document.getElementById("SystelTitle");

const ws = new WebSocket("wss://testserver-production-0d2a.up.railway.app");

let last_msg = "No message";
let accountToken = localStorage.getItem("accountToken");
const grid = document.getElementsByClassName("grid")[0]; 
const positions = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1]
];

const size = 110;
const bV = [-3, -2, -1, 1, 2, 3];

const buttons = [];

bV.forEach((val, i) => {
  const btn = document.createElement("button");
  btn.id = `clickBtn${i + 1}`;
  btn.textContent = val > 0 ? `+${val}` : `${val}`;
  btn.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.7)';
  btn.style.width = '130px'

  if (val < 0) {
    btn.style.backgroundColor ="rgb(255, 53, 53)";
  } 

  grid.appendChild(btn);
  buttons.push({ el: btn, pos: i });

  const [x, y] = positions[i];
  btn.style.transform = `translate(${x * (size + 30) - 5}px, ${y * size - 30}px)`;

  btn.addEventListener("click", () => {
    if (Math.random() < 0.75) {
      const currentIndex = buttons.findIndex(b => b.el === btn);
      let otherIndex;
      do {
        otherIndex = Math.floor(Math.random() * buttons.length);
      } while (otherIndex === currentIndex);

      [buttons[currentIndex].pos, buttons[otherIndex].pos] = [buttons[otherIndex].pos, buttons[currentIndex].pos];

      buttons.forEach(({ el, pos }) => {
        const [x, y] = positions[pos];
        el.style.transform = `translate(${x * (size + 30) - 5}px, ${y * size - 30}px)`;
      });
    }

    ws.send(JSON.stringify({
      type: "increment",
      token: localStorage.getItem("accountToken"),
      add: val
    }));
  });
});

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
    span.style.color = "orange";
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

    SystemLabel.innerHTML = data.msg.replace(/\*(.*?)\*/g, "<em>$1</em>");
    SystemLabel.style.fontSize = `100%`;   

    if (data.msg !== last_msg) {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
    
      hours = hours % 12;
      hours = hours ? hours : 12; 
      minutes = minutes < 10 ? '0' + minutes : minutes;
    
      SystelTitle.textContent = `System ● ${hours}:${minutes} ${ampm} | Powered By AI`;
      
      last_msg = data.msg;
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

deleteBtn.addEventListener("click", () => {
  const token = localStorage.getItem("accountToken");
  if (!token) {
    alert("No account found.");
    return;
  }

  if (!confirm("Are you sure you want to delete your account?")) {
    return;
  }

  ws.send(JSON.stringify({
    type: "deleteAccount",
    token: token
  }));
});
