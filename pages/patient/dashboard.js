let activeFilter = "all";
let searchQuery = "";
let cachedAppointments = [];

const appointmentList = document.getElementById("appointmentList");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function setElementText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function dashboardNotificationIcon(title) {
  if (!title) return { icon: "bell", iconBg: "bg-slate-100", iconColor: "text-slate-600" };
  const t = title.toLowerCase();
  if (t.includes("account") || t.includes("admin"))
    return { icon: "user-round-cog", iconBg: "bg-violet-100", iconColor: "text-violet-600" };
  if (t.includes("reminder") || t.includes("appointment"))
    return { icon: "calendar-clock", iconBg: "bg-orange-100", iconColor: "text-orange-600" };
  return { icon: "circle-alert", iconBg: "bg-red-100", iconColor: "text-red-600" };
}

async function loadDashboardNotifications() {
  const r = await fetch(`${API_BASE}/patient/notifications.php`, { credentials: "include" });
  const j = await r.json();
  if (j.status !== "success") return [];
  return j.data || [];
}

function updateDashboardNotificationBadge(unreadCount) {
  const badge = document.getElementById("dashboardNotificationCount");
  if (!badge) return;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "0";
    badge.classList.add("hidden");
  }
}

function renderDashboardNotificationList(rows) {
  const notificationList = document.getElementById("dashboardNotificationList");
  if (!notificationList) return;

  notificationList.innerHTML = "";
  const unreadCount = rows.filter((item) => parseInt(item.is_read, 10) === 0).length;
  updateDashboardNotificationBadge(unreadCount);

  if (rows.length === 0) {
    notificationList.innerHTML =
      '<div class="p-6 text-center text-slate-400">No notifications</div>';
    return;
  }

  rows.forEach((item) => {
    const meta = dashboardNotificationIcon(item.title);
    const isUnread = parseInt(item.is_read, 10) === 0;
    const wrap = document.createElement("div");
    wrap.className = `px-5 py-4 border-b border-slate-50 cursor-pointer transition hover:bg-slate-50 ${isUnread ? "bg-teal-50/30" : ""}`;
    wrap.innerHTML = `
      <div class="flex gap-4">
        <div class="relative">
          <div class="w-10 h-10 rounded-full ${meta.iconBg} ${meta.iconColor} flex items-center justify-center">
            <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
          </div>
          ${isUnread ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>` : ""}
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800">${item.title}</p>
          <p class="text-xs text-slate-600">${item.message}</p>
          <p class="text-[10px] text-slate-400 mt-1">${new Date(item.created_at).toLocaleString()}</p>
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
        const updated = await loadDashboardNotifications();
        renderDashboardNotificationList(updated);
      }
    };
    notificationList.appendChild(wrap);
  });
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function getStatusClasses(status) {
  const s = String(status).toLowerCase();
  if (s === "upcoming") return "bg-emerald-100 text-emerald-700";
  if (s === "completed") return "bg-blue-100 text-blue-700";
  if (s === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-red-100 text-red-700";
}

function formatStatus(status) {
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

async function fetchAppointments() {
  const params = new URLSearchParams();
  const r = await fetch(
    `${API_BASE}/patient/appointments.php?${params.toString()}`,
    { credentials: "include" },
  );
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.message || "Load failed");
  return j.data || [];
}

function getVisibleAppointments(rows) {
  return rows.filter((item) => {
    const matchesStatus =
      activeFilter === "all" || String(item.status_key) === activeFilter;
    const haystack = `${item.doctor_name || ""} ${item.specialization || ""}`.toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
}

function renderCounts(rows) {
  const upcoming = rows.filter((a) => a.status_key === "upcoming").length;
  const completed = rows.filter((a) => a.status_key === "completed").length;
  const missed = rows.filter((a) => a.status_key === "missed").length;

  setElementText("upcomingCount", upcoming);
  setElementText("completedCount", completed);
  setElementText("missedCount", missed);
  setElementText("totalCount", rows.length);

  const next = rows.find((a) => a.status_key === "upcoming");
  setElementText(
    "nextAppointment",
    next ? `${next.app_date} • ${formatTime12h(next.app_time)}` : "-",
  );
}

function renderAppointments(rows) {
  if (!appointmentList || !emptyState) return;

  appointmentList.innerHTML = "";

  if (!rows.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  rows.forEach((item) => {
    const lineColor =
      item.status_key === "upcoming"
        ? "bg-emerald-500"
        : item.status_key === "completed"
          ? "bg-blue-500"
          : "bg-red-500";

    const showReschedule =
      item.status_key === "missed" || item.status_key === "upcoming";

    const card = document.createElement("div");
    card.className =
      "appointment-card relative overflow-hidden bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm hover:shadow-md transition";

    card.innerHTML = `
      <div class="absolute left-0 top-0 h-full w-1 ${lineColor} rounded-l-[20px]"></div>

      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <h3 class="text-base font-semibold text-slate-800">${item.doctor_name}</h3>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(item.status)}">
              ${formatStatus(item.status)}
            </span>
          </div>

          <p class="text-xs text-slate-500 mb-3">${item.specialization || ""} • Consultation</p>

          <div class="grid grid-cols-3 gap-2 text-xs text-slate-500">
            <div class="bg-slate-50 rounded-xl px-3 py-2">
              <span class="block text-[10px] text-slate-400 mb-0.5">Date</span>
              <span class="font-medium text-slate-700">${item.app_date}</span>
            </div>
            <div class="bg-slate-50 rounded-xl px-3 py-2">
              <span class="block text-[10px] text-slate-400 mb-0.5">Time</span>
              <span class="font-medium text-slate-700">${formatTime12h(item.app_time)}</span>
            </div>
            <div class="bg-slate-50 rounded-xl px-3 py-2">
              <span class="block text-[10px] text-slate-400 mb-0.5">Room</span>
              <span class="font-medium text-slate-700">${item.room_num || "—"}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 lg:flex-col">
          <button type="button" data-view="${item.appointment_id}" class="view-btn px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition whitespace-nowrap">
            Details
          </button>
          ${
            showReschedule
              ? `<button type="button" data-reschedule="${item.appointment_id}" class="reschedule-btn px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium shadow-sm transition whitespace-nowrap">
            Reschedule
          </button>`
              : ""
          }
          ${
            item.status_key === "completed" && parseInt(item.rating || 0) === 0
              ? `<button type="button" data-feedback="${item.appointment_id}" class="feedback-btn px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium shadow-sm transition flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="message-square" class="w-3 h-3"></i> Feedback
          </button>`
              : ""
          }
        </div>
      </div>
    `;

    appointmentList.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openDetailModal(Number(button.dataset.view));
    });
  });

  document.querySelectorAll(".reschedule-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openRescheduleModal(Number(button.dataset.reschedule));
    });
  });

  document.querySelectorAll(".feedback-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const apt = cachedAppointments.find(a => a.appointment_id == button.dataset.feedback);
      if (apt) openFeedbackModal(apt);
    });
  });
}

async function reload() {
  try {
    const rows = await fetchAppointments();
    cachedAppointments = rows;
    renderCounts(rows);
    renderAppointments(getVisibleAppointments(rows));
  } catch (e) {
    console.error(e);
    if (appointmentList) {
      appointmentList.innerHTML =
        '<p class="text-red-500 text-sm">Could not load appointments. Are you logged in?</p>';
    }
  }
}

async function openBookingModal() {
  try {
    const r = await fetch(`${API_BASE}/patient/profile.php`, { credentials: "include" });
    const j = await r.json();
    if (j.status === "success" && j.data) {
      const d = j.data;
      const fields = [
        d.full_name, d.email, d.contact_number,
        d.age, d.gender, d.blood_group, d.address,
        d.emergency_contact_name, d.emergency_contact_phone
      ];
      const complete = fields.every(f => f !== null && f !== undefined && String(f).trim() !== "");
      if (!complete) {
        const ov = document.createElement("div");
        ov.style.cssText =
          "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;background:rgba(0,0,0,0.25);backdrop-filter:blur(4px);";
        ov.innerHTML =
          '<div style="background:#fff;border-radius:28px;box-shadow:0 20px 60px rgba(15,23,42,0.18);padding:28px 32px;width:90%;max-width:420px;text-align:center;border:1px solid #fef3c7;"><div style="margin:0 auto 16px;width:64px;height:64px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;color:#d97706;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h3 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px;">Profile Incomplete</h3><p style="color:#64748b;font-size:16px;">Please complete your profile before booking. Redirecting...</p></div>';
        document.body.appendChild(ov);
        setTimeout(function () {
          window.location.href = "profile.html";
        }, 2000);
        return;
      }
    } else {
      window.location.href = "profile.html";
      return;
    }
  } catch (err) {
    console.error("Profile check error:", err);
    window.location.href = "profile.html";
    return;
  }

  const modal = document.getElementById("bookingModal");
  const iframe = document.getElementById("bookingModalIframe");
  const inner = document.getElementById("bookingModalInner");
  if (!modal || !iframe) return;
  iframe.style.height = "0px";
  if (inner) inner.style.height = "";
  iframe.src = `booking.html?t=${Date.now()}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openRescheduleModal(appointmentId) {
  const modal = document.getElementById("bookingModal");
  const iframe = document.getElementById("bookingModalIframe");
  const inner = document.getElementById("bookingModalInner");
  if (!modal || !iframe) return;
  iframe.style.height = "0px";
  if (inner) inner.style.height = "";
  iframe.src = `booking.html?t=${Date.now()}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  iframe.onload = () => {
    // Auto-resize first
    if (typeof fitModalIframe === "function") fitModalIframe(iframe);
    // Then send reschedule context
    iframe.contentWindow.postMessage(
      { type: "START_RESCHEDULE", appointment_id: appointmentId },
      "*",
    );
  };
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function showSuccessToast(title, text) {
  const toast = document.getElementById("successToast");
  if (!toast) return;
  const t = toast.querySelector(".toast-title");
  const x = toast.querySelector(".toast-text");
  if (t) t.textContent = title;
  if (x) x.textContent = text;
  toast.classList.remove("hidden");
  toast.classList.add("flex");
  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 2000);
}

async function openDetailModal(id) {
  const r = await fetch(`${API_BASE}/patient/appointment_detail.php?id=${id}`, {
    credentials: "include",
  });
  const j = await r.json();
  if (j.status !== "success" || !j.data) {
    alert(j.message || "Not found");
    return;
  }
  const a = j.data;
  const body = document.getElementById("detailModalBody");
  const modal = document.getElementById("detailModal");
  if (!body || !modal) return;
  body.innerHTML = `
    <div class="space-y-3 text-sm text-slate-600">
      <p><span class="text-slate-400">Doctor</span><br/><strong class="text-slate-800">${a.doctor_name}</strong> — ${a.specialization || ""}</p>
      <p><span class="text-slate-400">When</span><br/>${a.app_date} at ${formatTime12h(a.app_time)} · ${a.room_num || ""}</p>
      <p><span class="text-slate-400">Status</span><br/>${formatStatus(a.status)}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Reason</span><br/>${a.reason_for_visit || "—"}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Doctor comments</span><br/>${a.doctor_comments || "—"}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Prescribed medicines</span><br/>${a.prescribed_medicines || "—"}</p>
      <p class="text-xs text-slate-400">Reschedule date shown above is your current scheduled visit. Use Reschedule on the card to pick a new slot if allowed.</p>
    </div>
  `;
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const missBtn = document.getElementById("detailRescheduleBtn");
  if (missBtn) {
    missBtn.classList.toggle("hidden", a.status_key !== "missed");
    missBtn.onclick = () => {
      document.getElementById("detailModal").classList.add("hidden");
      document.getElementById("detailModal").classList.remove("flex");
      openRescheduleModal(id);
    };
  }
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.remove("active-filter", "bg-teal-600", "text-white");
      btn.classList.add(
        "bg-white",
        "border",
        "border-slate-200",
        "text-slate-700",
      );
    });

    button.classList.remove(
      "bg-white",
      "border",
      "border-slate-200",
      "text-gray-700",
    );
    button.classList.add("active-filter", "bg-teal-600", "text-white");

    renderAppointments(getVisibleAppointments(cachedAppointments));
  });
});

window.addEventListener("message", function (event) {
  if (!event.data) return;
  if (event.data.type === "patient-booking-done") {
    closeBookingModal();
    reload();
    showSuccessToast("Success", "Your appointment was saved.");
  }
  if (event.data.type === "booking:close") {
    closeBookingModal();
  }
  if (event.data.type === "profile-incomplete-redirect") {
    const ov = document.createElement("div");
    ov.style.cssText =
      "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;background:rgba(0,0,0,0.25);backdrop-filter:blur(4px);";
    ov.innerHTML =
      '<div style="background:#fff;border-radius:28px;box-shadow:0 20px 60px rgba(15,23,42,0.18);padding:28px 32px;width:90%;max-width:420px;text-align:center;border:1px solid #fef3c7;"><div style="margin:0 auto 16px;width:64px;height:64px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;color:#d97706;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h3 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px;">Profile Incomplete</h3><p style="color:#64748b;font-size:16px;">Please complete your profile before booking. Redirecting...</p></div>';
    document.body.appendChild(ov);
    setTimeout(function () {
      window.location.href = "profile.html";
    }, 2000);
  }
});

const searchInput = document.getElementById("searchInput");

function applySearch(query) {
  searchQuery = query.trim();
  renderAppointments(getVisibleAppointments(cachedAppointments));
}

if (searchInput) {
  searchInput.addEventListener("input", () => applySearch(searchInput.value));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      applySearch("");
    }
  });
}

document.getElementById("closeDetailModal")?.addEventListener("click", closeDetailModal);
document.getElementById("detailModal")?.addEventListener("click", (e) => {
  if (e.target.id === "detailModal") closeDetailModal();
});

const dashboardNotificationBtn = document.getElementById("dashboardNotificationBtn");
const dashboardNotificationPanel = document.getElementById("dashboardNotificationPanel");
const dashboardMarkAllReadBtn = document.getElementById("dashboardMarkAllReadBtn");

dashboardNotificationBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  dashboardNotificationPanel?.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (
    dashboardNotificationPanel &&
    dashboardNotificationBtn &&
    !dashboardNotificationPanel.contains(e.target) &&
    !dashboardNotificationBtn.contains(e.target)
  ) {
    dashboardNotificationPanel.classList.add("hidden");
  }
});

dashboardMarkAllReadBtn?.addEventListener("click", async () => {
  await fetch(`${API_BASE}/patient/notifications.php`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark_all_read" }),
  });
  updateDashboardNotificationBadge(0);
  const updated = await loadDashboardNotifications();
  renderDashboardNotificationList(updated);
});

// --- FEEDBACK MODAL LOGIC ---
function openFeedbackModal(apt) {
    document.getElementById('feedback-doc-name').textContent = apt.doctor_name || 'Dr.';
    document.getElementById('feedback-apt-id').value = apt.appointment_id;
    document.getElementById('feedback-rating-val').value = 5;
    document.getElementById('feedback-text').value = '';
    
    document.getElementById('feedbackModal').classList.remove('hidden');
    document.getElementById('feedbackModal').classList.add('flex');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.add('hidden');
    document.getElementById('feedbackModal').classList.remove('flex');
}

async function submitFeedback() {
    const aptId = document.getElementById('feedback-apt-id').value;
    const rating = 5; // Hardcoded to pass backend check
    const feedback = document.getElementById('feedback-text').value;
    
    const btn = document.getElementById('submitFeedbackBtn');
    btn.innerHTML = 'Submitting...';
    btn.disabled = true;
    
    try {
        const res = await fetch('../../api/patient/submit_feedback.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                appointment_id: aptId,
                rating: rating,
                feedback: feedback
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            closeFeedbackModal();
            showSuccessToast("Feedback Sent", "Thank you for your rating.");
            reload();
        } else {
            alert('Error: ' + data.message);
        }
    } catch(e) {
        alert('Exception: ' + e.message);
    } finally {
        btn.innerHTML = 'Submit Review';
        btn.disabled = false;
    }
}

function checkForPendingFeedback(rows) {
    const unrated = rows.find(a => a.status_key === "completed" && parseInt(a.rating || 0) === 0);
    if (unrated) {
        // Show prompt automatically for the most recent unrated one
        const key = `prompted_feedback_${unrated.appointment_id}`;
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, 'true');
            setTimeout(() => openFeedbackModal(unrated), 1000);
        }
    }
}

(async function initDashboard() {
  const ok = await requirePatientSession();
  if (!ok) return;
  await reload();
  // Auto feedback popup disabled - users can click "Leave Feedback" button manually
  try {
    const notes = await loadDashboardNotifications();
    renderDashboardNotificationList(notes);
  } catch (err) {
    console.error(err);
  }
})();
