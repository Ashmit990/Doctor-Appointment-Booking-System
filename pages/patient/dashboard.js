let activeFilter = "all";
let searchQuery = "";
let cachedAppointments = [];

const appointmentList = document.getElementById("appointmentList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToProfile() {
  window.location.href = "profile.html";
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
  if (activeFilter !== "all") params.set("status", activeFilter);
  if (searchQuery) params.set("q", searchQuery);
  const r = await fetch(
    `${API_BASE}/patient/appointments.php?${params.toString()}`,
    { credentials: "include" },
  );
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.message || "Load failed");
  return j.data || [];
}

function renderCounts(rows) {
  const upcoming = rows.filter((a) => a.status_key === "upcoming").length;
  const completed = rows.filter((a) => a.status_key === "completed").length;
  const missed = rows.filter((a) => a.status_key === "missed").length;

  document.getElementById("upcomingCount").textContent = upcoming;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("missedCount").textContent = missed;
  document.getElementById("totalCount").textContent = rows.length;

  const next = rows.find((a) => a.status_key === "upcoming");
  document.getElementById("nextAppointment").textContent = next
    ? `${next.app_date} • ${formatTime12h(next.app_time)}`
    : "-";
}

function renderAppointments(rows) {
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
      "appointment-card relative overflow-hidden bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md";

    card.innerHTML = `
      <div class="absolute left-0 top-0 h-full w-1 ${lineColor} rounded-l-[24px]"></div>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-800">${item.doctor_name}</h3>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(item.status)}">
              ${formatStatus(item.status)}
            </span>
          </div>

          <p class="text-sm text-slate-400 mb-4">${item.specialization || ""} • Consultation</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-500">
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Date</span>
              <span class="font-medium text-slate-700">${item.app_date}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Time</span>
              <span class="font-medium text-slate-700">${formatTime12h(item.app_time)}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Location</span>
              <span class="font-medium text-slate-700">${item.room_num || "—"}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" data-view="${item.appointment_id}" class="view-btn px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition">
            View details
          </button>
          ${
            showReschedule
              ? `<button type="button" data-reschedule="${item.appointment_id}" class="reschedule-btn px-4 py-2.5 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium shadow-sm transition">
            Reschedule
          </button>`
              : ""
          }
          ${
            item.status_key === "completed" && parseInt(item.rating || 0) === 0
              ? `<button type="button" data-feedback="${item.appointment_id}" class="feedback-btn px-4 py-2.5 rounded-2xl bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-medium shadow-sm transition flex items-center gap-1">
            <i data-lucide="star" class="w-4 h-4"></i> Rate Visit
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
    renderAppointments(rows);
  } catch (e) {
    console.error(e);
    appointmentList.innerHTML =
      '<p class="text-red-500 text-sm">Could not load appointments. Are you logged in?</p>';
  }
}

function openBookingModal() {
  const modal = document.getElementById("bookingModal");
  const iframe = document.querySelector("#bookingModal iframe");
  iframe.src = `booking.html?t=${Date.now()}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openRescheduleModal(appointmentId) {
  const modal = document.getElementById("bookingModal");
  const iframe = document.querySelector("#bookingModal iframe");
  iframe.src = `booking.html?t=${Date.now()}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  iframe.onload = () => {
    iframe.contentWindow.postMessage(
      {
        type: "START_RESCHEDULE",
        appointment_id: appointmentId,
      },
      "*",
    );
  };
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function showSuccessToast(title, text) {
  const toast = document.getElementById("successToast");
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
  body.innerHTML = `
    <div class="space-y-3 text-sm text-slate-600">
      <p><span class="text-slate-400">Doctor</span><br/><strong class="text-slate-800">${a.doctor_name}</strong> — ${a.specialization || ""}</p>
      <p><span class="text-slate-400">When</span><br/>${a.app_date} at ${formatTime12h(a.app_time)} · ${a.room_num || ""}</p>
      <p><span class="text-slate-400">Status</span><br/>${formatStatus(a.status)}</p>
      <p><span class="text-slate-400">Reason</span><br/>${a.reason_for_visit || "—"}</p>
      <p><span class="text-slate-400">Doctor comments</span><br/>${a.doctor_comments || "—"}</p>
      <p><span class="text-slate-400">Prescribed medicines</span><br/>${a.prescribed_medicines || "—"}</p>
      <p class="text-xs text-slate-400">Reschedule date shown above is your current scheduled visit. Use Reschedule on the card to pick a new slot if allowed.</p>
    </div>
  `;
  document.getElementById("detailModal").classList.remove("hidden");
  document.getElementById("detailModal").classList.add("flex");

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
  document.getElementById("detailModal").classList.add("hidden");
  document.getElementById("detailModal").classList.remove("flex");
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

    reload();
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
});

const searchBtn = document.getElementById("searchBtn");
searchBtn.addEventListener("click", () => {
  searchQuery = searchInput.value.trim();
  reload();
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchQuery = searchInput.value.trim();
    reload();
  }
});

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
    document.getElementById('feedback-rating-val').value = 0;
    document.getElementById('feedback-text').value = '';
    
    renderStars(0);
    
    document.getElementById('feedbackModal').classList.remove('hidden');
    document.getElementById('feedbackModal').classList.add('flex');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.add('hidden');
    document.getElementById('feedbackModal').classList.remove('flex');
}

function renderStars(rating) {
    const container = document.getElementById('star-rating-container');
    container.innerHTML = '';
    document.getElementById('feedback-rating-val').value = rating;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.setAttribute('data-lucide', 'star');
        star.setAttribute('data-star-index', i);
        star.className = `w-10 h-10 cursor-pointer transition transform hover:scale-110 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`;
        container.appendChild(star);
    }
    
    // Use event delegation for click handling (persists after lucide renders)
    container.onclick = (e) => {
        const star = e.target.closest('[data-star-index]');
        if (star) {
            const index = parseInt(star.getAttribute('data-star-index'));
            renderStars(index);
        }
    };
    
    lucide.createIcons();
}

async function submitFeedback() {
    const aptId = document.getElementById('feedback-apt-id').value;
    const rating = parseInt(document.getElementById('feedback-rating-val').value);
    const feedback = document.getElementById('feedback-text').value;
    
    if (rating === 0) {
        alert("Please select a star rating!");
        return;
    }
    
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
  // Check feedback on load
  if (cachedAppointments && cachedAppointments.length) {
      checkForPendingFeedback(cachedAppointments);
  }
  try {
    const notes = await loadDashboardNotifications();
    renderDashboardNotificationList(notes);
  } catch (err) {
    console.error(err);
  }
})();
