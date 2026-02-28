const THEME = {
  light: { themeColor: "#f4f4f4" },
  dark:  { themeColor: "#0f1623" }
};

function setThemeColor(hex){
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta){
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", hex);
}

function applyTheme(isDark){
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("haru_theme", isDark ? "dark" : "light");
  setThemeColor(isDark ? THEME.dark.themeColor : THEME.light.themeColor);
}

function toggleDark(){
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
}

/* 初期：保存テーマ反映 */
(function initTheme(){
  const saved = localStorage.getItem("haru_theme");
  applyTheme(saved === "dark");
})();

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
(function autoResizeTextarea(){
  const msg = document.getElementById("msg");
  if (!msg) return;

  const resize = () => {
    msg.style.height = "auto";
    msg.style.height = msg.scrollHeight + "px";
  };

  msg.addEventListener("input", resize);
  resize();
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
  if (log) log.innerHTML = "";
}

/* ===== メッセージ表示 ===== */
function append(role, text, timestamp=null) {
  const log = document.getElementById("log");
  if (!log) return;

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
  if (!log) return;

  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "typingIndicator";
  div.textContent = "晴が入力中…";
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}
