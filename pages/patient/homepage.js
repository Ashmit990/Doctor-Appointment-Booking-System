let calViewYear = new Date().getFullYear();
let calViewMonth = new Date().getMonth() + 1;
let appointmentDatesInMonth = new Set();
let selectedCalendarDate = null;

function goToDashboard(event) {
  if (event) event.stopPropagation();
  window.location.href = "dashboard.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function notificationIcon(title) {
  if (!title) return { icon: "bell", iconBg: "bg-slate-100", iconColor: "text-slate-600", dot: "bg-teal-500" };
  const t = title.toLowerCase();
  if (t.includes("health") || t.includes("notice"))
    return {
      icon: "shield-alert",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      dot: "bg-yellow-500",
    };
  if (t.includes("reminder") || t.includes("appointment"))
    return {
      icon: "calendar-clock",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      dot: "bg-teal-500",
    };
  if (t.includes("upcoming") || t.includes("visit"))
    return {
      icon: "calendar-clock",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      dot: "bg-teal-500",
    };
  return {
    icon: "circle-alert",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    dot: "bg-red-500",
  };
}

async function loadHomeData() {
  const r = await fetch(`${API_BASE}/patient/home.php`, { credentials: "include" });
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.message || "Home load failed");
  return j.data;
}

async function loadNotifications() {
  const r = await fetch(`${API_BASE}/patient/notifications.php`, {
    credentials: "include",
  });
  const j = await r.json();
  if (j.status !== "success") return [];
  return j.data || [];
}

function applyHomeToUI(data) {
  document.getElementById("todayBookingsCount").textContent =
    data.today_bookings_count ?? 0;
  document.getElementById("upcomingCount").textContent = data.upcoming_count ?? 0;
  document.getElementById("completedCount").textContent = data.completed_count ?? 0;
  document.getElementById("totalAppointments").textContent =
    data.total_appointments ?? 0;

  const unread = data.unread_notifications ?? 0;
  const badge = document.getElementById("notificationCount");
  badge.textContent = unread;
  badge.classList.toggle("hidden", unread < 1);

  const todayA = data.today_appointment;
  const nextA = data.next_appointment;

  if (todayA) {
    document.getElementById("todayBookingMessage").classList.add("hidden");
    document.getElementById("todayBookingCard").classList.remove("hidden");
    document.getElementById("todayDoctorName").textContent = todayA.doctor_name || "";
    document.getElementById("todayDoctorMeta").textContent =
      (todayA.specialization || "") + " • Consultation";
    document.getElementById("todayBookingDate").textContent = todayA.app_date || "";
    document.getElementById("todayBookingTime").textContent = formatTime12h(
      todayA.app_time,
    );
    document.getElementById("todayBookingLocation").textContent =
      todayA.room_num || "—";
    document.getElementById("todayBookingStatus").textContent = "Yes";
  } else {
    document.getElementById("todayBookingMessage").classList.remove("hidden");
    document.getElementById("todayBookingCard").classList.add("hidden");
    document.getElementById("todayBookingStatus").textContent = "No";
  }

  const sameAsToday =
    todayA &&
    nextA &&
    String(todayA.appointment_id) === String(nextA.appointment_id);

  if (nextA && !sameAsToday) {
    document.getElementById("nextDoctorName").textContent = nextA.doctor_name || "";
    document.getElementById("nextDoctorMeta").textContent =
      (nextA.specialization || "") + " • Consultation";
    document.getElementById("nextBookingDate").textContent = formatDateShort(
      nextA.app_date,
    );
    document.getElementById("nextBookingTime").textContent = formatTime12h(
      nextA.app_time,
    );
    document.getElementById("nextBookingLocation").textContent =
      nextA.room_num || "—";
    document.getElementById("nextDoctorSummary").textContent =
      nextA.doctor_name || "—";
  } else if (!nextA || sameAsToday) {
    document.getElementById("nextDoctorName").textContent = "—";
    document.getElementById("nextDoctorMeta").textContent = "";
    document.getElementById("nextBookingDate").textContent = "—";
    document.getElementById("nextBookingTime").textContent = "—";
    document.getElementById("nextBookingLocation").textContent = "—";
    document.getElementById("nextDoctorSummary").textContent =
      sameAsToday && todayA
        ? todayA.doctor_name || "—"
        : "—";
  }
}

function renderNotificationList(rows) {
  const notificationList = document.getElementById("notificationList");
  notificationList.innerHTML = "";

  rows.forEach((item) => {
    const meta = notificationIcon(item.title);
    const when = item.created_at
      ? new Date(item.created_at.replace(" ", "T")).toLocaleString()
      : "";
    const wrap = document.createElement("div");
    wrap.className =
      "notification-card px-5 py-4 border-b border-slate-100 last:border-b-0";
    wrap.innerHTML = `
      <div class="flex gap-4">
        <div class="pt-1">
          <div class="w-10 h-10 rounded-full ${meta.iconBg} ${meta.iconColor} flex items-center justify-center">
            <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
          </div>
          <div class="w-2.5 h-2.5 rounded-full ${meta.dot} mt-3 mx-auto"></div>
        </div>
        <div class="flex-1">
          <div class="flex items-start justify-between gap-4">
            <p class="text-[16px] leading-8 text-slate-600">
              <span class="font-bold text-slate-800">${item.title || "Notice"}</span>
              <span> ${item.message || ""}</span>
            </p>
            <span class="text-sm text-slate-400 whitespace-nowrap">${when}</span>
          </div>
        </div>
      </div>
    `;
    notificationList.appendChild(wrap);
  });

  if (typeof lucide !== "undefined") lucide.createIcons();
}

async function refreshCalendarDots(year, month) {
  const r = await fetch(
    `${API_BASE}/patient/calendar.php?year=${year}&month=${month}`,
    { credentials: "include" },
  );
  const j = await r.json();
  appointmentDatesInMonth = new Set();
  if (j.status === "success" && j.data && j.data.dates) {
    j.data.dates.forEach((d) => appointmentDatesInMonth.add(d));
  }
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function buildCalendarGrid(container, year, month, compact) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const dim = daysInMonth(year, month);
  const label = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const header = compact ? "miniCalTitle" : "fullCalTitle";
  const el = document.getElementById(header);
  if (el) el.textContent = label;

  container.innerHTML = "";

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  weekdays.forEach((w) => {
    const s = document.createElement("span");
    s.className = compact
      ? "text-xs text-slate-400 text-center"
      : "text-sm font-semibold text-slate-400 text-center";
    s.textContent = w;
    container.appendChild(s);
  });

  for (let i = 0; i < firstDow; i++) {
    const pad = document.createElement("span");
    container.appendChild(pad);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let d = 1; d <= dim; d++) {
    const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("span");
    const hasApt = appointmentDatesInMonth.has(ds);
    const isToday = ds === todayStr;
    cell.className = compact
      ? "text-center text-xs cursor-pointer relative py-1 rounded-lg hover:bg-slate-100"
      : "calendar-day text-center text-sm cursor-pointer relative py-2 rounded-xl hover:bg-slate-100";

    if (isToday) cell.classList.add("font-semibold", "text-slate-800");
    else cell.classList.add("text-slate-600");

    cell.textContent = String(d);
    cell.dataset.date = ds;

    if (hasApt) {
      const dot = document.createElement("div");
      dot.className =
        "calendar-dot absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500";
      cell.appendChild(dot);
    }

    cell.addEventListener("click", () => {
      if (!compact) selectCalendarDate(ds);
    });

    container.appendChild(cell);
  }
}

async function renderMiniCalendar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  await refreshCalendarDots(y, m);
  const grid = document.getElementById("miniCalGrid");
  if (grid) buildCalendarGrid(grid, y, m, true);
}

async function openFullCalendar() {
  calViewYear = new Date().getFullYear();
  calViewMonth = new Date().getMonth() + 1;
  await refreshCalendarDots(calViewYear, calViewMonth);
  const grid = document.getElementById("fullCalGrid");
  if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
  document.getElementById("calendarDayDetail").innerHTML =
    '<p class="text-sm text-slate-500">Select a date to see appointments.</p>';
  document.getElementById("calendarModal").classList.remove("hidden");
  document.getElementById("calendarModal").classList.add("flex");
}

function closeCalendarPopup() {
  document.getElementById("calendarModal").classList.add("hidden");
  document.getElementById("calendarModal").classList.remove("flex");
}

async function selectCalendarDate(dateStr) {
  selectedCalendarDate = dateStr;
  const panel = document.getElementById("calendarDayDetail");
  panel.innerHTML =
    '<p class="text-sm text-slate-400">Loading…</p>';

  const r = await fetch(
    `${API_BASE}/patient/appointments_by_day.php?date=${encodeURIComponent(dateStr)}`,
    { credentials: "include" },
  );
  const j = await r.json();
  if (j.status !== "success") {
    panel.innerHTML = `<p class="text-sm text-red-500">${j.message || "Error"}</p>`;
    return;
  }

  const list = j.data || [];
  if (!list.length) {
    panel.innerHTML = `<p class="text-sm text-slate-500">No appointments on ${formatDateShort(dateStr)}.</p>`;
    return;
  }

  panel.innerHTML = list
    .map(
      (a) => `
    <div class="rounded-2xl border border-slate-100 bg-white p-4 mb-3 shadow-sm">
      <div class="flex justify-between items-start gap-2">
        <div>
          <p class="font-semibold text-slate-800">${a.doctor_name}</p>
          <p class="text-xs text-slate-400">${a.specialization || ""}</p>
        </div>
        <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">${a.status}</span>
      </div>
      <p class="text-sm text-slate-600 mt-2">${formatTime12h(a.app_time)} · ${a.room_num || ""}</p>
      ${a.reason_for_visit ? `<p class="text-xs text-slate-500 mt-1">${a.reason_for_visit}</p>` : ""}
      ${a.doctor_comments ? `<p class="text-xs text-slate-500 mt-2"><strong>Doctor:</strong> ${a.doctor_comments}</p>` : ""}
      ${a.prescribed_medicines ? `<p class="text-xs text-slate-500 mt-1"><strong>Prescribed:</strong> ${a.prescribed_medicines}</p>` : ""}
    </div>`,
    )
    .join("");
}

document.getElementById("fullCalNavPrev")?.addEventListener("click", async () => {
  calViewMonth--;
  if (calViewMonth < 1) {
    calViewMonth = 12;
    calViewYear--;
  }
  await refreshCalendarDots(calViewYear, calViewMonth);
  const grid = document.getElementById("fullCalGrid");
  if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
});

document.getElementById("fullCalNavNext")?.addEventListener("click", async () => {
  calViewMonth++;
  if (calViewMonth > 12) {
    calViewMonth = 1;
    calViewYear++;
  }
  await refreshCalendarDots(calViewYear, calViewMonth);
  const grid = document.getElementById("fullCalGrid");
  if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
});

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
const markAllReadBtn = document.getElementById("markAllReadBtn");

notificationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notificationPanel.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (
    !notificationPanel.contains(e.target) &&
    !notificationBtn.contains(e.target)
  ) {
    notificationPanel.classList.add("hidden");
  }
});

markAllReadBtn.addEventListener("click", async () => {
  await fetch(`${API_BASE}/patient/notifications.php`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark_all_read" }),
  });
  document.getElementById("notificationCount").classList.add("hidden");
});

document.getElementById("calendarCardBtn").addEventListener("click", openFullCalendar);
document.getElementById("closeCalendarModal").addEventListener("click", closeCalendarPopup);
document.getElementById("calendarModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("calendarModal")) closeCalendarPopup();
});

(async function init() {
  const ok = await requirePatientSession();
  if (!ok) return;

  try {
    const me = await fetch(`${API_BASE}/patient/me.php`, { credentials: "include" }).then(
      (r) => r.json(),
    );
    if (me.status === "success" && me.data) {
      const name = me.data.full_name || "Patient";
      document.getElementById("patientNameHeading").textContent = name + "!";
    }

    const home = await loadHomeData();
    applyHomeToUI(home);

    const notes = await loadNotifications();
    renderNotificationList(notes);

    document.getElementById("todayDateLabel").textContent =
      new Date().toDateString();

    await renderMiniCalendar();
  } catch (e) {
    console.error(e);
  }
})();
