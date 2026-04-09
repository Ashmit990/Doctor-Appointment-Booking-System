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
