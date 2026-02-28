// ui.js - UIまわり全部ここ（毎回全コピペ運用でも壊れにくい形）

/* ===== Sidebar open/close ===== */
function toggleSidebar(){
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isOpen = sidebar.classList.contains("open");

  if (isOpen){
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  } else {
    sidebar.classList.add("open");
    overlay.style.display = "block";
  }
}

function closeSidebar(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").style.display = "none";
}

/* ===== Dark mode ===== */
function applyDark(isDark){
  document.body.classList.toggle("dark", isDark);
  try { localStorage.setItem("haru_dark", isDark ? "1" : "0"); } catch(e){}
}

function toggleDark(){
  const isDark = !document.body.classList.contains("dark");
  applyDark(isDark);
}

// 初期反映（保存 > OS設定 の順）
(function initDark(){
  let saved = null;
  try { saved = localStorage.getItem("haru_dark"); } catch(e){}

  if (saved === "1") applyDark(true);
  else if (saved === "0") applyDark(false);
  else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyDark(prefersDark);
  }
})();

/* ===== Input auto height ===== */
document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("msg");
  if (!msg) return;

  msg.addEventListener("input", () => {
    msg.style.height = "auto";
    msg.style.height = msg.scrollHeight + "px";
  });
});

/* ===== Log bottom padding (for fixed input) ===== */
(function(){
  const inputArea = document.getElementById("inputArea");
  const log = document.getElementById("log");
  if (!inputArea || !log) return;

  function updatePadding(){
    log.style.paddingBottom = (inputArea.offsetHeight + 18) + "px";
  }
  new ResizeObserver(updatePadding).observe(inputArea);
  window.addEventListener("resize", updatePadding);
  updatePadding();
})();

/* ===== Log helpers ===== */
function clearLog(){
  const log = document.getElementById("log");
  if (log) log.innerHTML = "";
}

function append(role, text, timestamp=null){
  const log = document.getElementById("log");
  if (!log) return;

  const isUser = (role === "user" || role === "me");
  const isBot  = (role === "assistant" || role === "bot");

  if (timestamp){
    const timeDiv = document.createElement("div");
    timeDiv.className = "timestamp " + (isUser ? "me" : "bot");
    timeDiv.textContent = new Date(timestamp).toLocaleString("ja-JP");
    log.appendChild(timeDiv);
  }

  const div = document.createElement("div");
  div.className = "msg " + (isUser ? "me" : "bot");
  div.textContent = text;
  log.appendChild(div);

  log.scrollTop = log.scrollHeight;
}

/* ===== Typing indicator ===== */
function showTyping(){
  const log = document.getElementById("log");
  if (!log) return;

  if (document.getElementById("typingIndicator")) return;

  const div = document.createElement("div");
  div.className = "typing";
  div.id = "typingIndicator";
  div.innerHTML = `
    <span>晴が入力中</span>
    <span class="dot">.</span>
    <span class="dot">.</span>
    <span class="dot">.</span>
  `;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function hideTyping(){
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}
