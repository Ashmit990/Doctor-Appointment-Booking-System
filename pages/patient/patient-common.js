const API_SEG = window.location.pathname.split("/").filter(Boolean)[0];
const API_BASE = API_SEG ? `/${API_SEG}/api` : "/api";

async function requirePatientSession() {
  const r = await fetch(`${API_BASE}/auth/session_info.php`, {
    credentials: "include",
  });
  const j = await r.json();
  if (!j.logged_in || j.role !== "Patient") {
    window.location.href = "../auth/login.html";
    return false;
  }
  return true;
}

function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).slice(0, 8).split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function logoutPatient() {
  window.location.href = `${API_BASE}/auth/logout.php`;
}

function resolveModalElement(modalOrId) {
  if (!modalOrId) return null;
  if (typeof modalOrId === "string") return document.getElementById(modalOrId);
  return modalOrId;
}

function resolveModalPanel(modal, panelSelector) {
  if (!modal) return null;
  if (panelSelector) return modal.querySelector(panelSelector);
  return modal.firstElementChild;
}

function smoothOpenModal(modalOrId, options = {}) {
  const modal = resolveModalElement(modalOrId);
  if (!modal) return;

  const mode = options.mode || "class";
  const showClass = options.showClass || "flex";
  const hideClass = options.hideClass || "hidden";
  const displayMode = options.displayMode || "flex";
  const panel = resolveModalPanel(modal, options.panelSelector);

  if (mode === "display") {
    modal.style.display = displayMode;
  } else {
    modal.classList.remove(hideClass);
    if (showClass) modal.classList.add(showClass);
  }

  modal.style.pointerEvents = "auto";
  modal.style.transition = "opacity .22s ease";
  modal.style.opacity = "0";

  if (panel) {
    panel.style.transition = "transform .24s ease, opacity .24s ease";
    panel.style.transform = "translateY(10px) scale(0.97)";
    panel.style.opacity = "0";
  }

  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    if (panel) {
      panel.style.transform = "translateY(0) scale(1)";
      panel.style.opacity = "1";
    }
  });
}

function smoothCloseModal(modalOrId, options = {}) {
  const modal = resolveModalElement(modalOrId);
  if (!modal) return;

  const mode = options.mode || "class";
  const showClass = options.showClass || "flex";
  const hideClass = options.hideClass || "hidden";
  const duration = options.duration || 220;
  const panel = resolveModalPanel(modal, options.panelSelector);

  modal.style.opacity = "0";
  if (panel) {
    panel.style.transform = "translateY(10px) scale(0.97)";
    panel.style.opacity = "0";
  }

  setTimeout(() => {
    if (mode === "display") {
      modal.style.display = "none";
    } else {
      modal.classList.add(hideClass);
      if (showClass) modal.classList.remove(showClass);
    }
    modal.style.pointerEvents = "";
  }, duration);
}
function goToHome() {
  window.location.href = "homepage.html";
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}
