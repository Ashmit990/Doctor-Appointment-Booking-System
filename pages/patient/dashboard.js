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

(async function initDashboard() {
  const ok = await requirePatientSession();
  if (!ok) return;
  await reload();
})();
