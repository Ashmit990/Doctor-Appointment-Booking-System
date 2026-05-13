let calViewYear = new Date().getFullYear();
let calViewMonth = new Date().getMonth() + 1;
let appointmentDatesInMonth = new Set();
let selectedCalendarDate = null;
let miniCalYear = new Date().getFullYear();
let miniCalMonth = new Date().getMonth() + 1;
let _cachedNextApt = null;

function goToDashboard(event) {
  if (event) event.stopPropagation();
  window.location.href = "dashboard.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function getDoctorInitials(name) {
  if (!name) return '?';
  const clean = name.replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Collapse odd whitespace/newlines from DB so text wraps as normal sentences (not one word per line) */
function normalizeNotificationText(str) {
  if (str == null) return "";
  return String(str)
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function notificationIcon(title) {
  if (!title)
    return { icon: "bell", iconBg: "bg-gray-100", iconColor: "text-gray-600" };
  const t = title.toLowerCase();
  if (t.includes("health") || t.includes("notice"))
    return {
      icon: "shield-alert",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    };
  if (t.includes("account") || t.includes("admin"))
    return {
      icon: "user-round-cog",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    };
  if (
    t.includes("reminder") ||
    t.includes("appointment") ||
    t.includes("upcoming") ||
    t.includes("visit")
  )
    return {
      icon: "calendar-clock",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    };
  return {
    icon: "circle-alert",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  };
}

async function loadHomeData() {
  const r = await fetch(`${API_BASE}/patient/home.php`, {
    credentials: "include",
  });
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

async function refreshNotifications() {
  try {
    const rows = await loadNotifications();
    renderNotificationList(rows);
  } catch (err) {
    console.error(err);
  }
}

function applyHomeToUI(data) {
  document.getElementById("todayBookingsCount").textContent =
    data.today_bookings_count ?? 0;
  document.getElementById("upcomingCount").textContent =
    data.upcoming_count ?? 0;
  document.getElementById("completedCount").textContent =
    data.completed_count ?? 0;
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
    document.getElementById("todayDoctorName").textContent =
      todayA.doctor_name || "";
    document.getElementById("todayDoctorMeta").textContent =
      (todayA.specialization || "") + " • Consultation";
    document.getElementById("todayBookingDate").textContent =
      todayA.app_date || "";
    document.getElementById("todayBookingTime").textContent = formatTime12h(
      todayA.app_time,
    );
    document.getElementById("todayBookingLocation").textContent =
      todayA.room_num || "—";
    document.getElementById("todayBookingStatus").textContent = "Yes";
    document.getElementById("todayDoctorInitials").textContent = getDoctorInitials(todayA.doctor_name);
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
    document.getElementById("nextAppointmentCard").dataset.aptDate =
      nextA.app_date || "";
    document.getElementById("nextDoctorName").textContent =
      nextA.doctor_name || "";
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
    _cachedNextApt = nextA;
    document.getElementById("nextDoctorInitials").textContent = getDoctorInitials(nextA.doctor_name);
    const nextBadgeEl = document.getElementById("nextAppointmentBadge");
    if (nextBadgeEl) nextBadgeEl.style.display = "";
  } else if (!nextA || sameAsToday) {
    document.getElementById("nextDoctorName").textContent = "—";
    document.getElementById("nextDoctorMeta").textContent = "";
    document.getElementById("nextBookingDate").textContent = "—";
    document.getElementById("nextBookingTime").textContent = "—";
    document.getElementById("nextBookingLocation").textContent = "—";
    document.getElementById("nextDoctorSummary").textContent =
      sameAsToday && todayA ? todayA.doctor_name || "—" : "—";
  }
}

function renderNotificationList(rows) {
  const listEl = document.getElementById("notificationList");
  if (!listEl) return;
  listEl.innerHTML = "";

  const unreadCount = rows.filter(
    (item) => parseInt(item.is_read, 10) === 0,
  ).length;
  updateBadge(unreadCount);

  if (rows.length === 0) {
    listEl.innerHTML =
      '<div class="p-6 text-center text-gray-400">No notifications</div>';
    return;
  }

  rows.forEach((item) => {
    const meta = notificationIcon(item.title);
    const isUnread = parseInt(item.is_read, 10) === 0;
    const wrap = document.createElement("div");
    wrap.className = `px-5 py-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${isUnread ? "bg-teal-50/30" : ""}`;
    wrap.innerHTML = `
      <div class="flex gap-4">
        <div class="relative">
          <div class="w-10 h-10 rounded-full ${meta.iconBg} ${meta.iconColor} flex items-center justify-center">
            <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
          </div>
          ${isUnread ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>` : ""}
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-gray-800">${escapeHtml(item.title)}</p>
          <p class="text-xs text-gray-600">${escapeHtml(normalizeNotificationText(item.message))}</p>
          <p class="text-[10px] text-gray-400 mt-1">${new Date(item.created_at).toLocaleString()}</p>
        </div>
      </div>`;

    wrap.onclick = async () => {
      if (isUnread) {
        await fetch(`${API_BASE}/patient/notifications.php`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_id: item.notification_id }),
          credentials: "include",
        });
        const updated = await loadNotifications();
        renderNotificationList(updated);
      }
    };
    listEl.appendChild(wrap);
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

// Module-scoped so it persists across grid rebuilds
let miniSelectedDate = null;

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



    const isPast = ds < todayStr;
    
    cell.className = compact
      ? "text-center text-xs cursor-pointer relative py-1 rounded-lg hover:bg-slate-100"
      : "calendar-day text-center text-sm cursor-pointer relative py-2 rounded-xl hover:bg-slate-100";

    // Apply styling based on date
    if (isToday) {
      cell.classList.add("font-semibold");
      if (compact) {
        cell.style.backgroundColor = "#eaf3f3";
        cell.style.color = "#0d7377";
        cell.style.borderRadius = "0.5rem";
      } else {
        cell.style.backgroundColor = "#eaf3f3";
        cell.style.color = "#0d7377";
      }
    } else if (isPast) {
      cell.style.color = "#d1d5db";
    } else {
      cell.classList.add("text-slate-600");

    }

    cell.textContent = String(d);
    cell.dataset.date = ds;

    if (hasApt) {
      cell.classList.add("has-appointment");
    }

    cell.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!compact) {
        selectCalendarDate(ds);
      } else {
        const todayStr2 = new Date().toISOString().slice(0, 10);
        // Clear previous selection styles
        container.querySelectorAll(".cal-selected").forEach((el) => {
          el.classList.remove("cal-selected");
          const d = el.dataset.date;
          if (d === todayStr2) {
            el.style.backgroundColor = "#eaf3f3";
            el.style.color = "#0d7377";
          } else if (d < todayStr2) {
            el.style.backgroundColor = "";
            el.style.color = "#d1d5db";
          } else {
            el.style.backgroundColor = "";
            el.style.color = "";
          }
        });

        if (miniSelectedDate === ds) {
          miniSelectedDate = null;
          restoreTodayStatus();
        } else {
          miniSelectedDate = ds;
          cell.classList.add("cal-selected");
          cell.style.backgroundColor = "#4AB8AD";
          cell.style.color = "#fff";
          cell.style.borderRadius = "0.5rem";
          if (hasApt) {
            await updateNextCardForDate(ds);
          } else {
            highlightTodayStatusForDate(ds);
          }
        }
      }
    });

    container.appendChild(cell);
  }
}

// Cached home data for restoring Today Status
let _cachedHomeData = null;

async function renderMiniCalendar() {
  await refreshCalendarDots(miniCalYear, miniCalMonth);
  const grid = document.getElementById("miniCalGrid");
  if (grid) buildCalendarGrid(grid, miniCalYear, miniCalMonth, true);
}

/** Remove highlight ring from all appointment cards */
function clearAppointmentHighlights() {
  ["todayBookingCard", "nextAppointmentCard", "todayBookingMessage"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el)
        el.classList.remove(
          "ring-2",
          "ring-[#0d7377]",
          "ring-offset-2",
          "shadow-[0_0_0_3px_0d737740]",
        );
    },
  );
}

/** Highlight whichever appointment card matches the clicked date */
function highlightTodayStatusForDate(dateStr) {
  clearAppointmentHighlights();

  // Check today's booking card date
  const todayDateEl = document.getElementById("todayBookingDate");
  const todayCard = document.getElementById("todayBookingCard");
  if (todayDateEl && todayCard && !todayCard.classList.contains("hidden")) {
    const cardDate = (todayDateEl.textContent || "").trim();
      if (cardDate === dateStr) {
      todayCard.classList.add("ring-2", "ring-[#0d7377]", "ring-offset-2");
      return;
    }
  }

  // Check next appointment card date
  const nextDateEl = document.getElementById("nextBookingDate");
  const nextCard = document.getElementById("nextAppointmentCard");
  if (nextDateEl && nextCard) {
    // nextBookingDate may be formatted, so also check raw date stored in dataset
    const rawDate = nextCard.dataset.aptDate || "";
    const displayDate = (nextDateEl.textContent || "").trim();
      if (
      rawDate === dateStr ||
      displayDate === dateStr ||
      formatDateShort(dateStr) === displayDate
    ) {
      nextCard.classList.add("ring-2", "ring-[#0d7377]", "ring-offset-2");
    }
  }
}

/** Restore — remove highlights and re-render original next appointment card */
function restoreTodayStatus() {
  clearAppointmentHighlights();
  if (_cachedHomeData) applyHomeToUI(_cachedHomeData);
}

async function updateNextCardForDate(dateStr) {
  clearAppointmentHighlights();
  try {
    const r = await fetch(`${API_BASE}/patient/appointments_by_day.php?date=${encodeURIComponent(dateStr)}`, { credentials: 'include' });
    const j = await r.json();
    if (j.status !== 'success' || !j.data || !j.data.length) return;
    const apt = j.data[0];
    document.getElementById("nextDoctorName").textContent = apt.doctor_name || "";
    document.getElementById("nextDoctorMeta").textContent = (apt.specialization || "") + " \u2022 Consultation";
    document.getElementById("nextBookingDate").textContent = formatDateShort(apt.app_date);
    document.getElementById("nextBookingTime").textContent = formatTime12h(apt.app_time);
    document.getElementById("nextBookingLocation").textContent = apt.room_num || "\u2014";
    document.getElementById("nextDoctorInitials").textContent = getDoctorInitials(apt.doctor_name);
    const nextCard = document.getElementById("nextAppointmentCard");
    if (nextCard) {
      nextCard.dataset.aptDate = apt.app_date;
      nextCard.classList.add("ring-2", "ring-[#0d7377]", "ring-offset-2");
    }
    const nextBadge = document.getElementById("nextAppointmentBadge");
    if (nextBadge) {
      const isActualNext = _cachedNextApt && String(_cachedNextApt.appointment_id) === String(apt.appointment_id);
      nextBadge.style.display = isActualNext ? "" : "none";
    }
  } catch (err) {
    console.error(err);
  }
}

async function openFullCalendar() {
  calViewYear = new Date().getFullYear();
  calViewMonth = new Date().getMonth() + 1;
  await refreshCalendarDots(calViewYear, calViewMonth);
  const grid = document.getElementById("fullCalGrid");
  if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
  document.getElementById("calendarDayDetail").innerHTML =
    '<p class="text-sm text-slate-500">Select a date to see appointments.</p>';
  smoothOpenModal("calendarModal", {
    mode: "class",
    panelSelector: ".cal-modal-scroll",
  });
}

function closeCalendarPopup() {
  smoothCloseModal("calendarModal", {
    mode: "class",
    panelSelector: ".cal-modal-scroll",
  });
}

async function selectCalendarDate(dateStr) {
  selectedCalendarDate = dateStr;

  // Highlight selected date in full calendar
  const grid = document.getElementById("fullCalGrid");
  if (grid) {
    grid
      .querySelectorAll(".cal-selected")
      .forEach((el) => el.classList.remove("cal-selected"));
    const selected = grid.querySelector(`[data-date="${dateStr}"]`);
    if (selected) selected.classList.add("cal-selected");
  }

  const panel = document.getElementById("calendarDayDetail");
  panel.innerHTML = '<p class="text-sm text-slate-400">Loading…</p>';

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
    <div class="rounded-2xl border border-slate-100 bg-white p-4 mb-3 shadow-sm overflow-hidden">
      <div class="flex justify-between items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-slate-800 truncate">${escapeHtml(a.doctor_name)}</p>
          <p class="text-xs text-slate-400 truncate">${escapeHtml(a.specialization || "")}</p>
        </div>
        <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">${escapeHtml(a.status)}</span>
      </div>
      <p class="text-sm text-slate-600 mt-2">${formatTime12h(a.app_time)} · ${escapeHtml(a.room_num || "")}</p>
      ${a.reason_for_visit ? `<p class="text-xs text-slate-500 mt-1" style="word-break:break-all;overflow-wrap:anywhere;">${escapeHtml(a.reason_for_visit)}</p>` : ""}
      ${a.doctor_comments ? `<p class="text-xs text-slate-500 mt-2" style="word-break:break-all;overflow-wrap:anywhere;"><strong>Doctor:</strong> ${escapeHtml(a.doctor_comments)}</p>` : ""}
      ${a.prescribed_medicines ? `<p class="text-xs text-slate-500 mt-1" style="word-break:break-all;overflow-wrap:anywhere;"><strong>Prescribed:</strong> ${escapeHtml(a.prescribed_medicines)}</p>` : ""}
    </div>`,
    )
    .join("");
}

document.getElementById("miniCalNavPrev")?.addEventListener("click", async (e) => {
  e.stopPropagation();
  miniCalMonth--;
  if (miniCalMonth < 1) { miniCalMonth = 12; miniCalYear--; }
  miniSelectedDate = null;
  if (_cachedHomeData) applyHomeToUI(_cachedHomeData);
  await renderMiniCalendar();
});

document.getElementById("miniCalNavNext")?.addEventListener("click", async (e) => {
  e.stopPropagation();
  miniCalMonth++;
  if (miniCalMonth > 12) { miniCalMonth = 1; miniCalYear++; }
  miniSelectedDate = null;
  if (_cachedHomeData) applyHomeToUI(_cachedHomeData);
  await renderMiniCalendar();
});

document
  .getElementById("fullCalNavPrev")
  ?.addEventListener("click", async () => {
    calViewMonth--;
    if (calViewMonth < 1) {
      calViewMonth = 12;
      calViewYear--;
    }
    await refreshCalendarDots(calViewYear, calViewMonth);
    const grid = document.getElementById("fullCalGrid");
    if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
  });

document
  .getElementById("fullCalNavNext")
  ?.addEventListener("click", async () => {
    calViewMonth++;
    if (calViewMonth > 12) {
      calViewMonth = 1;
      calViewYear++;
    }
    await refreshCalendarDots(calViewYear, calViewMonth);
    const grid = document.getElementById("fullCalGrid");
    if (grid) buildCalendarGrid(grid, calViewYear, calViewMonth, false);
  });

const notificationBtnEl = document.getElementById("notificationBtn");
const notificationPanelEl = document.getElementById("notificationPanel");
const markAllReadBtnEl = document.getElementById("markAllReadBtn");

function positionNotificationPanel() {
  if (
    !notificationBtnEl ||
    !notificationPanelEl ||
    notificationPanelEl.classList.contains("hidden")
  )
    return;
  const rect = notificationBtnEl.getBoundingClientRect();
  const panelWidth = Math.min(window.innerWidth - 32, 390);
  let left = rect.right - panelWidth;
  if (left < 16) left = 16;
  notificationPanelEl.style.width = `${panelWidth}px`;
  notificationPanelEl.style.top = `${Math.round(rect.bottom + 8)}px`;
  notificationPanelEl.style.left = `${Math.round(left)}px`;
}

notificationBtnEl?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!notificationPanelEl) return;
  const wasHidden = notificationPanelEl.classList.contains("hidden");
  if (wasHidden) {
    notificationPanelEl.classList.remove("hidden");
    positionNotificationPanel();
    loadNotifications()
      .then((rows) => renderNotificationList(rows))
      .catch((err) => console.error(err));
  } else {
    notificationPanelEl.classList.add("hidden");
  }
});

window.addEventListener("resize", positionNotificationPanel);

document.addEventListener("click", (e) => {
  if (
    notificationPanelEl &&
    notificationBtnEl &&
    !notificationPanelEl.classList.contains("hidden") &&
    !notificationPanelEl.contains(e.target) &&
    !notificationBtnEl.contains(e.target)
  ) {
    notificationPanelEl.classList.add("hidden");
  }
});

markAllReadBtnEl?.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  await fetch(`${API_BASE}/patient/notifications.php`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark_all_read" }),
  });

  updateBadge(0);

  const updatedNotes = await loadNotifications();
  renderNotificationList(updatedNotes);
});

// Block ALL clicks inside the mini calendar grid from bubbling up
document.getElementById("miniCalGrid")?.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Only the expand button opens the full calendar popup
document.getElementById("expandCalBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  openFullCalendar();
});
document
  .getElementById("closeCalendarModal")
  .addEventListener("click", closeCalendarPopup);
document.getElementById("calendarModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("calendarModal"))
    closeCalendarPopup();
});

(async function init() {
  const ok = await requirePatientSession();
  if (!ok) return;

  try {
    const me = await fetch(`${API_BASE}/patient/me.php`, {
      credentials: "include",
    }).then((r) => r.json());
    if (me.status === "success" && me.data) {
      const name = me.data.full_name || "Patient";
      document.getElementById("patientNameHeading").textContent = name + "!";
    }

    const home = await loadHomeData();
    _cachedHomeData = home;
    applyHomeToUI(home);

    await refreshNotifications();
    setInterval(refreshNotifications, 5000);

    document.getElementById("todayDateLabel").textContent =
      new Date().toDateString();

    await renderMiniCalendar();
    
    // Check for follow-up reminders (for tomorrow's appointments)
    try {
      await fetch(`${API_BASE}/patient/check_followup_reminders.php`, { credentials: 'include' });
    } catch (err) {
      console.error('Error checking follow-up reminders:', err);
    }
    // Handle payment result messages from popup flow
    window.addEventListener("message", async (event) => {
      if (event.data && event.data.type === "payment-result") {
        const status = String(event.data.status || "").toLowerCase().trim();
        console.log("Payment result received on homepage:", event.data);

        if (status === "completed") {
          const modal = document.getElementById("bookingModal");
          if (modal) {
            smoothCloseModal(modal, {
              mode: "class",
              panelSelector: "#bookingModalOuter",
            });
          }
          showSuccessToast("Payment successful ✓", event.data.message || "Your appointment has been booked successfully via Khalti.");
          
          try {
            const home = await loadHomeData();
            _cachedHomeData = home;
            applyHomeToUI(home);
            await renderMiniCalendar();
          } catch (e) {
            console.error(e);
          }
        } else if (status === "failed" || status === "cancelled") {
          showSuccessToast("Payment " + status, event.data.message || "The payment did not complete. Please try again.");
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
})();

function updateBadge(unreadCount) {
  const badge = document.getElementById("notificationCount");
  if (!badge) return;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove("hidden"); // Show the red popup if there are unread items
  } else {
    badge.textContent = "0";
    badge.classList.add("hidden"); // Hide the red popup when count is 0
  }
}
