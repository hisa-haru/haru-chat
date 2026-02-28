/* =========================
   UI担当ファイル ui.js
   ========================= */

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

/* ===== 入力欄高さ自動調整 ===== */
(function(){
  const msg = document.getElementById("msg");
  if (!msg) return;

  msg.addEventListener("input", () => {
    msg.style.height = "auto";
    msg.style.height = msg.scrollHeight + "px";
  });
})();

/* ===== ログ下余白自動調整 ===== */
(function(){
  const inputArea = document.getElementById("inputArea");
  const log = document.getElementById("log");
  if (!inputArea || !log) return;

  function updatePadding(){
    log.style.paddingBottom = (inputArea.offsetHeight + 20) + "px";
  }

  new ResizeObserver(updatePadding).observe(inputArea);
  window.addEventListener("resize", updatePadding);
  updatePadding();
})();

/* ===== ログ操作 ===== */
function clearLog(){
  const log = document.getElementById("log");
  log.innerHTML = "";
}

/* ===== メッセージ表示 ===== */
function append(role, text, timestamp=null) {
  const log = document.getElementById("log");

  if (timestamp) {
    const timeDiv = document.createElement("div");
    timeDiv.className = "timestamp " + (role === "user" ? "me" : "bot");
    timeDiv.textContent = new Date(timestamp).toLocaleString("ja-JP");
    log.appendChild(timeDiv);
  }

  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "me" : "bot");
  div.textContent = text;
  log.appendChild(div);

  log.scrollTop = log.scrollHeight;
}

/* ===== 送信中表示 ===== */
function showTyping() {
  const log = document.getElementById("log");

  const div = document.createElement("div");
  div.className = "msg bot typing";
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

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}
