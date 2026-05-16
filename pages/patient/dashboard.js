let activeFilter = "all";
let searchQuery = "";
let cachedAppointments = [];

let currentView = "appointments";
let treatCategories = [];
let treatSelectedCategory = null;
let treatCategoriesLoaded = false;

const appointmentList = document.getElementById("appointmentList");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function showView(view) {
  currentView = view;
  const apptView = document.getElementById("appointmentsView");
  const treatView = document.getElementById("treatmentsView");
  const sidebarAppt = document.getElementById("sidebarAppointments");
  const sidebarTreat = document.getElementById("sidebarTreatments");

  if (apptView) apptView.classList.toggle("hidden", view !== "appointments");
  if (treatView) treatView.classList.toggle("hidden", view !== "treatments");

  const activeBtn =
    "flex flex-col md:flex-row items-center md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl bg-white/20 text-white text-[10px] md:text-sm font-medium transition-all w-auto md:w-full md:text-left";
  const inactiveBtn =
    "flex flex-col md:flex-row items-center md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white text-[10px] md:text-sm font-medium transition-all w-auto md:w-full md:text-left";

  if (sidebarAppt)
    sidebarAppt.className = view === "appointments" ? activeBtn : inactiveBtn;
  if (sidebarTreat)
    sidebarTreat.className = view === "treatments" ? activeBtn : inactiveBtn;

  if (view === "treatments" && !treatCategoriesLoaded) treatLoadCategories();
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function setElementText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function dashboardNotificationIcon(title) {
  if (!title)
    return {
      icon: "bell",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    };
  const t = title.toLowerCase();
  if (t.includes("account") || t.includes("admin"))
    return {
      icon: "user-round-cog",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    };
  if (t.includes("reminder") || t.includes("appointment"))
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

async function loadDashboardNotifications() {
  const r = await fetch(`${API_BASE}/patient/notifications.php`, {
    credentials: "include",
  });
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
  const unreadCount = rows.filter(
    (item) => parseInt(item.is_read, 10) === 0,
  ).length;
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

async function refreshDashboardNotifications() {
  try {
    const notes = await loadDashboardNotifications();
    renderDashboardNotificationList(notes);
  } catch (err) {
    console.error(err);
  }
}

function getStatusClasses(status) {
  const s = String(status).toLowerCase();
  if (s === "upcoming") return "bg-emerald-100 text-emerald-700";
  if (s === "completed") return "bg-blue-100 text-blue-700";
  if (s === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-red-100 text-red-700";
}

function getPaymentStatusClasses(status) {
  const s = String(status || "unpaid").toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-700";
  if (s === "pending" || s === "initiated")
    return "bg-amber-100 text-amber-700";
  if (s === "failed" || s === "expired" || s === "cancelled")
    return "bg-rose-100 text-rose-700";
  if (s === "followup") return "bg-violet-100 text-violet-700";
  return "bg-slate-100 text-slate-600";
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
    const haystack =
      `${item.doctor_name || ""} ${item.specialization || ""}`.toLowerCase();
    const matchesSearch =
      !searchQuery || haystack.includes(searchQuery.toLowerCase());
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
  setElementText("dashTotalCount", rows.length);
  setElementText("dashUpcomingCount", upcoming);
  setElementText("dashCompletedCount", completed);

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
      "appointment-card apt-card card-hover relative overflow-hidden bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm";

    card.innerHTML = `
      <div class="absolute left-0 top-0 h-full w-1 ${lineColor} rounded-l-[20px]"></div>

      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <h3 class="text-base font-semibold text-slate-800">${item.doctor_name}</h3>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(item.status)}">
              ${formatStatus(item.status)}
            </span>
            ${item.payment_status_label ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusClasses(item.payment_status_key)}">${item.payment_status_label}${item.payment_status_key === "completed" ? " via Khalti" : ""}</span>` : ""}
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
          ${item.status_key === "completed" ? `
          <div class="mt-3 pt-3 border-t border-slate-100">
            <button type="button"
              data-open-docs="${item.appointment_id}"
              data-docs-label="${item.doctor_name} · ${item.app_date}"
              class="open-docs-btn flex items-center gap-2 text-xs font-medium text-[#0d7377] hover:text-[#0a5a5d] transition-colors group">
              <span class="w-6 h-6 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
              </span>
              My Documents
              <span class="docs-count-badge-${item.appointment_id} px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold hidden"></span>
            </button>
          </div>` : ""}
        </div>

        <div class="flex flex-wrap gap-1.5 lg:flex-col w-28 shrink-0">
          <button type="button" data-view="${item.appointment_id}" class="view-btn w-full px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-xs font-semibold transition whitespace-nowrap text-center shadow-sm">
            Details
          </button>
          ${
            showReschedule
              ? `<button type="button" data-reschedule="${item.appointment_id}" class="reschedule-btn w-full px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium shadow-sm transition whitespace-nowrap text-center">
            Reschedule
          </button>`
              : ""
          }
          ${
            item.status_key === "completed" && item.feedback
              ? `<button type="button" data-view-feedback="${item.appointment_id}" class="view-feedback-btn w-full px-3 py-2 rounded-lg border border-yellow-300 bg-yellow-400 text-white hover:bg-yellow-500 text-xs font-medium transition whitespace-nowrap text-center">
            View Feedback
          </button>`
              : item.status_key === "completed" && !item.feedback
                ? `<button type="button" data-feedback="${item.appointment_id}" class="feedback-btn w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium shadow-sm transition whitespace-nowrap text-center">
            Feedback
          </button>`
                : ""
          }
          ${
            item.status_key === "completed"
              ? `<button type="button" data-view-report="${item.appointment_id}" class="view-report-btn w-full px-3 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 text-xs font-medium transition whitespace-nowrap text-center flex items-center justify-center gap-1">
                <i data-lucide="file-text" class="w-3 h-3"></i>
                View Report
              </button>`
              : ""
          }
          ${
            item.payment_status_key === "completed"
              ? `<button type="button" data-view-receipt="${item.appointment_id}" class="view-receipt-btn w-full px-3 py-2 rounded-lg border border-[#0d7377] bg-[#0d7377] text-white hover:bg-[#0a5a5d] text-xs font-medium shadow-sm transition whitespace-nowrap text-center flex items-center justify-center gap-1">
                <i data-lucide="receipt" class="w-3 h-3"></i>
                View Receipt
              </button>`
              : ""
          }
          <button type="button" data-view-ticket="${item.appointment_id}" class="view-ticket-btn w-full px-3 py-2 rounded-lg border border-[#0d7377] text-[#0d7377] hover:bg-teal-50 text-xs font-medium transition whitespace-nowrap text-center">
            View Ticket
          </button>
        </div>
      </div>
    `;

    appointmentList.appendChild(card);
  });

  document.querySelectorAll(".view-receipt-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openReceiptModal(button.dataset.viewReceipt);
    });
  });

  document.querySelectorAll(".view-report-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openPatientMedicalReportModal(Number(button.dataset.viewReport));
    });
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
      const apt = cachedAppointments.find(
        (a) => a.appointment_id == button.dataset.feedback,
      );
      if (apt) openFeedbackModal(apt);
    });
  });

  document.querySelectorAll(".view-feedback-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const apt = cachedAppointments.find(
        (a) => a.appointment_id == button.dataset.viewFeedback,
      );
      if (apt) openViewFeedbackModal(apt);
    });
  });

  document.querySelectorAll(".view-ticket-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const apt = cachedAppointments.find(
        (a) => a.appointment_id == button.dataset.viewTicket,
      );
      if (!apt) return;
      if (apt.ticket_number) {
        openTicketModal(apt);
        return;
      }
      button.textContent = "...";
      button.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/patient/generate_ticket.php`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointment_id: apt.appointment_id }),
        });
        const j = await res.json();
        if (j.status === "success") {
          await reload();
          const updated = cachedAppointments.find(
            (a) => a.appointment_id == apt.appointment_id,
          );
          if (updated) openTicketModal(updated);
        } else {
          button.textContent = "View Ticket";
          button.disabled = false;
        }
      } catch (e) {
        console.error(e);
        button.textContent = "View Ticket";
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll(".open-docs-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openPatientDocsModal(
        Number(button.dataset.openDocs),
        button.dataset.docsLabel,
      );
    });
  });

  if (typeof lucide !== "undefined") lucide.createIcons();

  // Load doc counts for completed appointments
  document.querySelectorAll(".open-docs-btn").forEach((button) => {
    const aptId = Number(button.dataset.openDocs);
    fetch(`${API_BASE}/patient/patient_docs.php?appointment_id=${aptId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.status === "success" && j.data.length > 0) {
          const badge = document.querySelector(`.docs-count-badge-${aptId}`);
          if (badge) {
            badge.textContent = j.data.length;
            badge.classList.remove("hidden");
          }
        }
      })
      .catch(() => {});
  });
}

// ── Patient Documents Modal ────────────────────────────────────────────────────
let _currentDocsAptId = null;

function openPatientDocsModal(appointmentId, label) {
  _currentDocsAptId = appointmentId;
  const modal = document.getElementById("patientDocsModal");
  const inner = document.getElementById("patientDocsModalInner");
  const subtitle = document.getElementById("docsModalSubtitle");
  if (!modal) return;

  if (subtitle) subtitle.textContent = label || "";
  document.getElementById("docsPendingList").classList.add("hidden");
  document.getElementById("docsPendingItems").innerHTML = "";
  document.getElementById("docsFileInput").value = "";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => {
    inner.classList.remove("scale-95");
    inner.classList.add("scale-100");
  }, 10);

  if (typeof lucide !== "undefined") lucide.createIcons();
  loadUploadedDocs(appointmentId);
}

function closePatientDocsModal() {
  const modal = document.getElementById("patientDocsModal");
  const inner = document.getElementById("patientDocsModalInner");
  if (!modal) return;
  inner.classList.remove("scale-100");
  inner.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
    _currentDocsAptId = null;
  }, 200);
}

document.getElementById("patientDocsModal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("patientDocsModal")) closePatientDocsModal();
});

async function loadUploadedDocs(appointmentId) {
  const container = document.getElementById("docsUploadedList");
  if (!container) return;
  container.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">Loading…</div>';

  try {
    const r = await fetch(`${API_BASE}/patient/patient_docs.php?appointment_id=${appointmentId}`, { credentials: "include" });
    const j = await r.json();
    if (j.status !== "success" || !j.data.length) {
      container.innerHTML = `<div class="text-center py-8 text-slate-300">
        <p class="text-sm">No documents yet</p></div>`;
      return;
    }
    renderUploadedDocs(j.data);
  } catch (e) {
    container.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
  }
}

function renderUploadedDocs(docs) {
  const container = document.getElementById("docsUploadedList");
  if (!container) return;

  container.innerHTML = docs.map((doc) => {
    const ext = doc.original_name.split(".").pop().toUpperCase();
    const isImage = ["JPG", "JPEG", "PNG", "GIF"].includes(ext);
    const isPdf   = ext === "PDF";
    const iconColor = isPdf ? "text-red-500" : isImage ? "text-blue-500" : "text-slate-500";
    const sizeKB = doc.file_size > 1024 * 1024
      ? (doc.file_size / 1024 / 1024).toFixed(1) + " MB"
      : Math.round(doc.file_size / 1024) + " KB";
    const url = `${window.location.origin}/Doctor-Appointment-Booking-System/uploads/patient_docs/${doc.stored_name}`;

    return `<div class="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-200" data-doc-id="${doc.id}">
      <div class="w-10 h-10 rounded-xl ${isPdf ? 'bg-red-50' : isImage ? 'bg-blue-50' : 'bg-slate-100'} flex items-center justify-center shrink-0">
        <span class="text-[9px] font-extrabold ${iconColor}">${ext}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-slate-700 truncate">${doc.original_name}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">${sizeKB} &nbsp;·&nbsp; ${doc.uploaded_at.slice(0, 10)}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <a href="${url}" target="_blank" download="${doc.original_name}"
          class="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-100 flex items-center justify-center transition"
          title="Download">
          <i data-lucide="download" class="w-3.5 h-3.5 text-[#0d7377]"></i>
        </a>
        <button type="button" onclick="showDeleteConfirm(${doc.id})"
          class="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition"
          title="Delete">
          <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i>
        </button>
      </div>
    </div>`;
  }).join("");

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function handleDocsFileSelect(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const pendingSection = document.getElementById("docsPendingList");
  const pendingItems   = document.getElementById("docsPendingItems");
  pendingSection.classList.remove("hidden");

  pendingItems.innerHTML = files.map((f) => {
    const sizeKB = f.size > 1024 * 1024
      ? (f.size / 1024 / 1024).toFixed(1) + " MB"
      : Math.round(f.size / 1024) + " KB";
    return `<div class="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100">
      <div class="w-8 h-8 rounded-lg bg-white border border-teal-100 flex items-center justify-center shrink-0">
        <i data-lucide="file" class="w-4 h-4 text-[#0d7377]"></i>
      </div>
      <span class="text-xs font-medium text-slate-700 flex-1 truncate">${f.name}</span>
      <span class="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-teal-100 shrink-0">${sizeKB}</span>
    </div>`;
  }).join("");

  if (typeof lucide !== "undefined") lucide.createIcons();
}

async function uploadPendingDocs() {
  if (!_currentDocsAptId) return;
  const input = document.getElementById("docsFileInput");
  const btn   = document.getElementById("docsUploadBtn");
  if (!input.files.length) return;

  btn.disabled = true;
  btn.textContent = "Uploading…";

  const formData = new FormData();
  formData.append("appointment_id", _currentDocsAptId);
  Array.from(input.files).forEach((f) => formData.append("files[]", f));

  try {
    const r = await fetch(`${API_BASE}/patient/patient_docs.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const j = await r.json();

    document.getElementById("docsPendingList").classList.add("hidden");
    document.getElementById("docsPendingItems").innerHTML = "";
    input.value = "";

    if (j.status === "success") {
      await loadUploadedDocs(_currentDocsAptId);
      // Refresh badge
      const badge = document.querySelector(`.docs-count-badge-${_currentDocsAptId}`);
      if (badge) {
        const count = parseInt(badge.textContent || "0") + j.uploaded.length;
        badge.textContent = count;
        badge.classList.remove("hidden");
      }
    } else {
      alert(j.message || "Upload failed");
    }
  } catch (e) {
    console.error(e);
    alert("Upload error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="upload" class="w-3 h-3"></i> Upload';
    if (typeof lucide !== "undefined") lucide.createIcons();
  }
}

function closeDeleteConfirm() {
  const modal = document.getElementById("docsDeleteConfirm");
  const inner = document.getElementById("docsDeleteConfirmInner");
  if (!modal) return;
  inner.classList.remove("scale-100");
  inner.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }, 150);
}

function showDeleteConfirm(docId) {
  const modal = document.getElementById("docsDeleteConfirm");
  const inner = document.getElementById("docsDeleteConfirmInner");
  const btn   = document.getElementById("docsDeleteConfirmBtn");
  if (!modal) { deletePatientDoc(docId); return; }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => {
    inner.classList.remove("scale-95");
    inner.classList.add("scale-100");
  }, 10);
  if (typeof lucide !== "undefined") lucide.createIcons();
  btn.onclick = () => { closeDeleteConfirm(); deletePatientDoc(docId); };
}

async function deletePatientDoc(docId) {
  try {
    const r = await fetch(`${API_BASE}/patient/patient_docs.php?doc_id=${docId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const j = await r.json();
    if (j.status === "success" && _currentDocsAptId) {
      await loadUploadedDocs(_currentDocsAptId);
      // Refresh badge
      const r2 = await fetch(`${API_BASE}/patient/patient_docs.php?appointment_id=${_currentDocsAptId}`, { credentials: "include" });
      const j2 = await r2.json();
      const badge = document.querySelector(`.docs-count-badge-${_currentDocsAptId}`);
      if (badge) {
        const cnt = j2.data?.length || 0;
        badge.textContent = cnt;
        if (cnt === 0) badge.classList.add("hidden");
      }
    }
  } catch (e) {
    console.error(e);
    alert("Delete failed");
  }
}

function openTicketModal(apt) {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl("tkt-number", apt.ticket_number || "—");
  setEl("tkt-category", apt.ticket_category || apt.specialization || "—");
  setEl(
    "tkt-cost",
    apt.ticket_cost ? "Rs. " + Number(apt.ticket_cost).toFixed(2) : "—",
  );
  setEl(
    "tkt-date",
    apt.ticket_generated_at
      ? new Date(
          apt.ticket_generated_at.replace(" ", "T") + "+05:45",
        ).toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
  );
  setEl("tkt-doctor", apt.doctor_name || "—");
  const modal = document.getElementById("ticketModal");
  if (!modal) return;
  // Disable iframe pointer events to prevent iframe click-through bug in Chrome
  ["bookingIframe", "bookingModalIframe"].forEach(function (id) {
    const f = document.getElementById(id);
    if (f) f.style.pointerEvents = "none";
  });
  smoothOpenModal(modal, { mode: "display" });
}

function closeTicketModal() {
  const modal = document.getElementById("ticketModal");
  if (modal) smoothCloseModal(modal, { mode: "display" });
  // Re-enable iframe pointer events
  ["bookingIframe", "bookingModalIframe"].forEach(function (id) {
    const f = document.getElementById(id);
    if (f) f.style.pointerEvents = "";
  });
}

function printTicket() {
  const num = (document.getElementById("tkt-number")?.textContent || "").trim();
  const doctor = (
    document.getElementById("tkt-doctor")?.textContent || ""
  ).trim();
  const category = (
    document.getElementById("tkt-category")?.textContent || ""
  ).trim();
  const cost = (document.getElementById("tkt-cost")?.textContent || "").trim();
  const date = (document.getElementById("tkt-date")?.textContent || "").trim();

  const heights = [
    22, 16, 28, 14, 24, 18, 30, 12, 20, 26, 14, 22, 28, 16, 24, 18, 12, 26, 20,
    14, 28, 16, 22, 18, 26, 12, 24, 20,
  ];
  const barcode = heights
    .map(function (h) {
      return '<span style="height:' + h + 'px"></span>';
    })
    .join("");

  const html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    "<title>Treatment Ticket</title><style>" +
    "* { margin:0;padding:0;box-sizing:border-box; }" +
    'body { font-family:"Segoe UI",Arial,sans-serif;background:#f4f6f8;display:flex;align-items:center;justify-content:center;min-height:100vh; }' +
    ".ticket { background:#fff;width:420px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.13); }" +
    ".header { background:linear-gradient(135deg,#0d7377 0%,#0a5a5d 100%);padding:28px 28px 22px;color:#fff; }" +
    ".header-top { display:flex;align-items:center;gap:14px;margin-bottom:6px; }" +
    ".logo { width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px; }" +
    ".header h1 { font-size:20px;font-weight:700; } .header p { font-size:11px;opacity:0.75;margin-top:1px; }" +
    ".tid { margin-top:14px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;display:inline-block;font-size:13px;font-weight:600;letter-spacing:1px; }" +
    ".divider { border:none;border-top:2px dashed #e2e8f0;margin:0 24px; }" +
    ".body { padding:22px 28px; }" +
    ".row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9; }" +
    ".row:last-child { border-bottom:none; }" +
    ".lbl { font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px; }" +
    ".val { font-size:14px;font-weight:600;color:#1e293b;text-align:right; }" +
    ".cost { color:#0d7377;font-size:16px;font-weight:700; }" +
    ".footer { padding:14px 28px 22px;text-align:center; }" +
    ".footer p { font-size:10px;color:#94a3b8;margin-bottom:10px; }" +
    ".barcode { display:flex;justify-content:center;gap:2px;margin:8px auto; }" +
    ".barcode span { display:inline-block;background:#1e293b;width:3px;border-radius:1px; }" +
    "@media print { body { background:none; } .ticket { box-shadow:none;width:100%; } }" +
    '</style></head><body><div class="ticket">' +
    '<div class="header"><div class="header-top"><div class="logo">🎫</div>' +
    "<div><h1>Treatment Ticket</h1><p>Healthcare Management System</p></div></div>" +
    '<div class="tid">' +
    num +
    "</div></div>" +
    '<hr class="divider">' +
    '<div class="body">' +
    '<div class="row"><span class="lbl">Doctor</span><span class="val">' +
    doctor +
    "</span></div>" +
    '<div class="row"><span class="lbl">Treatment Category</span><span class="val">' +
    category +
    "</span></div>" +
    '<div class="row"><span class="lbl">Estimated Cost</span><span class="val cost">' +
    cost +
    "</span></div>" +
    '<div class="row"><span class="lbl">Generated On</span><span class="val" style="font-size:12px;font-weight:500;color:#475569">' +
    date +
    "</span></div>" +
    '</div><hr class="divider">' +
    '<div class="footer"><p>Present this ticket at the reception counter. Prices are estimates and may vary.</p>' +
    '<div class="barcode">' +
    barcode +
    "</div></div>" +
    "</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()};};<\/script>" +
    "</body></html>";

  const win = window.open("", "_blank", "width=520,height=680");
  if (!win) {
    alert("Please allow popups to print the ticket.");
    return;
  }
  win.document.write(html);
  win.document.close();
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

// Iframe resizing functions
function fitBookingIframe(iframe) {
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    iframe.style.height = height + 20 + "px";
  } catch (err) {
    console.warn("Could not resize booking iframe:", err);
  }
}

function fitModalIframe(iframe) {
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    iframe.style.height = height + 20 + "px";
  } catch (err) {
    console.warn("Could not resize modal iframe:", err);
  }
}

async function openBookingModal() {
  try {
    const r = await fetch(`${API_BASE}/patient/profile.php`, {
      credentials: "include",
    });
    const j = await r.json();
    if (j.status === "success" && j.data) {
      const d = j.data;
      const fields = [
        d.full_name,
        d.email,
        d.contact_number,
        d.age,
        d.gender,
        d.blood_group,
        d.address,
        d.emergency_contact_name,
        d.emergency_contact_phone,
      ];
      const complete = fields.every(
        (f) => f !== null && f !== undefined && String(f).trim() !== "",
      );
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
  smoothOpenModal(modal, {
    mode: "class",
    panelSelector: "#bookingModalInner",
  });
}

function openRescheduleModal(appointmentId) {
  const modal = document.getElementById("bookingModal");
  const iframe = document.getElementById("bookingModalIframe");
  const inner = document.getElementById("bookingModalInner");
  if (!modal || !iframe) return;
  iframe.style.height = "0px";
  if (inner) inner.style.height = "";
  iframe.src = `booking.html?t=${Date.now()}`;
  smoothOpenModal(modal, {
    mode: "class",
    panelSelector: "#bookingModalInner",
  });

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
  smoothCloseModal(modal, {
    mode: "class",
    panelSelector: "#bookingModalInner",
  });
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
      <p><span class="text-slate-400">Payment</span><br/><strong class="${getPaymentStatusClasses(a.payment_status_key)} inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold">${a.payment_status_label || "Unpaid"}${a.payment_status_key === "completed" ? " via Khalti" : ""}</strong></p>
      <p><span class="text-slate-400">Payment details</span><br/>Method: ${a.payment_method || "—"}<br/>Reference: ${a.payment_transaction_id || a.payment_pidx || "—"}<br/>Amount: ${a.payment_amount ? "Rs. " + Number(a.payment_amount).toFixed(2) : "—"}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Reason</span><br/>${a.reason_for_visit || "—"}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Doctor comments</span><br/>${a.doctor_comments || "—"}</p>
      <p class="break-words whitespace-pre-wrap"><span class="text-slate-400">Prescribed medicines</span><br/>${a.prescribed_medicines || "—"}</p>
      <p class="text-xs text-slate-400">Reschedule date shown above is your current scheduled visit. Use Reschedule on the card to pick a new slot if allowed.</p>
    </div>
  `;
  smoothOpenModal(modal, { mode: "class" });

  const missBtn = document.getElementById("detailRescheduleBtn");
  if (missBtn) {
    missBtn.classList.toggle("hidden", a.status_key !== "missed");
    missBtn.onclick = () => {
      smoothCloseModal("detailModal", { mode: "class" });
      setTimeout(() => openRescheduleModal(id), 180);
    };
  }
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal");
  if (!modal) return;
  smoothCloseModal(modal, { mode: "class" });
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
  const bookingIframe = document.getElementById("bookingIframe");
  const bookingModalIframe = document.getElementById("bookingModalIframe");
  const sourceIsInline =
    bookingIframe && event.source === bookingIframe.contentWindow;
  const sourceIsModal =
    bookingModalIframe && event.source === bookingModalIframe.contentWindow;

  if (event.data.type === "payment:cancel") {
    if (sourceIsModal && bookingModalIframe) {
      bookingModalIframe.src = `booking.html?t=${Date.now()}`;
    } else if (sourceIsInline && bookingIframe) {
      bookingIframe.src = `booking.html?t=${Date.now()}`;
    }
  }

  if (event.data.type === "patient-booking-done") {
    closeBookingModal();
    reload();
    showSuccessToast("Success", "Your appointment was saved.");
  }
  if (event.data.type === "payment-result") {
    const status = String(event.data.status || "")
      .toLowerCase()
      .trim();
    console.log("Payment result received in dashboard:", {
      status,
      data: event.data,
    });

    if (status === "completed") {
      // Close booking modal
      const bookingModalIframe = document.getElementById("bookingModalIframe");
      if (
        bookingModalIframe &&
        event.source === bookingModalIframe.contentWindow
      ) {
        closeBookingModal();
      }
      // Show success popup
      showSuccessToast(
        "Payment successful ✓",
        event.data.message ||
          "Your appointment has been booked successfully via Khalti.",
      );
      
      // Refresh the appointment list in the background
      if (typeof reload === "function") {
        reload();
      }

      // Open the receipt modal if we have an appointment ID
      if (event.data.appointment_id) {
        setTimeout(() => {
          if (typeof openReceiptModal === 'function') {
            openReceiptModal(event.data.appointment_id);
          }
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else if (status === "failed" || status === "cancelled") {
      showSuccessToast(
        "Payment " + status,
        event.data.message || "The payment did not complete. Please try again.",
      );
    } else if (status === "checking") {
      // Window was closed, reload to verify payment status
      console.log("Payment window closed, reloading to verify status...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
  if (event.data.type === "booking:resize") {
    if (
      bookingIframe &&
      event.source === bookingIframe.contentWindow &&
      typeof fitBookingIframe === "function"
    ) {
      fitBookingIframe(bookingIframe);
    }
    if (
      bookingModalIframe &&
      event.source === bookingModalIframe.contentWindow &&
      typeof fitModalIframe === "function"
    ) {
      fitModalIframe(bookingModalIframe);
    }
  }
  if (event.data.type === "payment-retry") {
    if (sourceIsInline && bookingIframe) {
      bookingIframe.src = `booking.html?t=${Date.now()}`;
    }
    if (sourceIsModal && bookingModalIframe) {
      bookingModalIframe.src = `booking.html?t=${Date.now()}`;
    }
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

document
  .getElementById("closeDetailModal")
  ?.addEventListener("click", closeDetailModal);
document.getElementById("detailModal")?.addEventListener("click", (e) => {
  if (e.target.id === "detailModal") closeDetailModal();
});

const dashboardNotificationBtn = document.getElementById(
  "dashboardNotificationBtn",
);
const dashboardNotificationPanel = document.getElementById(
  "dashboardNotificationPanel",
);
const dashboardMarkAllReadBtn = document.getElementById(
  "dashboardMarkAllReadBtn",
);

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

let _fbCurrentApt = null; // currently open appointment object

function showPanel(panel) {
  document.getElementById("fbViewPanel").classList.add("hidden");
  document.getElementById("fbWritePanel").classList.add("hidden");
  document.getElementById(panel).classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
}

/** Open to VIEW existing feedback */
function openViewFeedbackModal(apt) {
  _fbCurrentApt = apt;
  document.getElementById("feedback-apt-id").value = apt.appointment_id;
  document.getElementById("fb-view-doctor").textContent =
    apt.doctor_name || "Doctor";
  document.getElementById("fb-view-text").textContent =
    apt.feedback || "(No written feedback)";
  smoothOpenModal("feedbackModal", { mode: "class" });
  showPanel("fbViewPanel");
}

/** Open to WRITE new feedback */
function openFeedbackModal(apt) {
  _fbCurrentApt = apt;
  document.getElementById("feedback-apt-id").value = apt.appointment_id;
  document.getElementById("feedback-mode").value = "new";
  document.getElementById("fb-write-doctor").textContent =
    apt.doctor_name || "Doctor";
  document.getElementById("fb-write-title").textContent = "Leave Feedback";
  document.getElementById("feedback-text").value = "";
  document.getElementById("fb-back-btn").classList.add("hidden");
  document.getElementById("submitFeedbackBtn").textContent = "Submit Review";
  smoothOpenModal("feedbackModal", { mode: "class" });
  showPanel("fbWritePanel");
}

/** Switch from view → edit */
function switchToEditMode() {
  if (!_fbCurrentApt) return;
  document.getElementById("feedback-mode").value = "edit";
  document.getElementById("fb-write-title").textContent = "Edit Feedback";
  document.getElementById("fb-write-doctor").textContent =
    _fbCurrentApt.doctor_name || "Doctor";
  document.getElementById("feedback-text").value = _fbCurrentApt.feedback || "";
  document.getElementById("fb-back-btn").classList.remove("hidden");
  document.getElementById("submitFeedbackBtn").textContent = "Save Changes";
  showPanel("fbWritePanel");
}

/** Switch back to view */
function switchToViewMode() {
  showPanel("fbViewPanel");
}

function closeFeedbackModal() {
  smoothCloseModal("feedbackModal", { mode: "class" });
}

async function submitFeedback() {
  const aptId = document.getElementById("feedback-apt-id").value;
  const mode = document.getElementById("feedback-mode").value;
  const feedback = document.getElementById("feedback-text").value.trim();

  const btn = document.getElementById("submitFeedbackBtn");
  btn.textContent = "Saving...";
  btn.disabled = true;

  try {
    const isEdit = mode === "edit";
    const url = isEdit
      ? "../../api/patient/update_feedback.php"
      : "../../api/patient/submit_feedback.php";

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointment_id: aptId, feedback }),
    });
    const data = await res.json();
    if (data.status === "success") {
      closeFeedbackModal();
      showSuccessToast(
        isEdit ? "Feedback Updated" : "Feedback Sent",
        isEdit
          ? "Your review has been updated."
          : "Thank you for your feedback!",
      );
      reload();
    } else {
      alert("Error: " + data.message);
    }
  } catch (e) {
    alert("Exception: " + e.message);
  } finally {
    btn.textContent = mode === "edit" ? "Save Changes" : "Submit Review";
    btn.disabled = false;
  }
}

function checkForPendingFeedback(rows) {
  const unrated = rows.find((a) => a.status_key === "completed" && !a.feedback);
  if (unrated) {
    const key = `prompted_feedback_${unrated.appointment_id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      setTimeout(() => openFeedbackModal(unrated), 1000);
    }
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateTimeShort(dt) {
  if (!dt) return "";
  const d = new Date(dt.replace(" ", "T") + "+05:45");
  return d.toLocaleString("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── TREATMENTS ────────────────────────────────────────────────────────────────
const TREAT_CATEGORY_ICONS = {
  "General Consultation": "stethoscope",
  Cardiology: "heart-pulse",
  Orthopedics: "bone",
  Dermatology: "sun",
  Neurology: "brain",
  Pediatrics: "baby",
  Gynecology: "venus",
  Ophthalmology: "eye",
  Physiotherapy: "activity",
  Dentistry: "smile",
};

function treatIconFor(name) {
  return TREAT_CATEGORY_ICONS[name] || "circle-plus";
}

function treatSwitchTab(tab) {
  const isGenerate = tab === "generate";
  document
    .getElementById("treatPanelGenerate")
    .classList.toggle("hidden", !isGenerate);
  document
    .getElementById("treatPanelHistory")
    .classList.toggle("hidden", isGenerate);
  document.getElementById("treatTabGenerate").className = isGenerate
    ? "px-5 py-2 rounded-xl text-sm font-semibold bg-[#0d7377] text-white shadow-sm transition"
    : "px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition";
  document.getElementById("treatTabHistory").className = !isGenerate
    ? "px-5 py-2 rounded-xl text-sm font-semibold bg-[#0d7377] text-white shadow-sm transition"
    : "px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition";
  if (!isGenerate) treatLoadTicketHistory();
}

async function treatLoadCategories() {
  treatCategoriesLoaded = true;
  const grid = document.getElementById("treatCategoryGrid");
  if (!grid) return;
  try {
    const r = await fetch(`${API_BASE}/patient/treatment_categories.php`, {
      credentials: "include",
    });
    const j = await r.json();
    if (j.status !== "success" || !j.data.length) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-10 text-slate-400 text-sm">No treatment categories available.</div>';
      return;
    }
    treatCategories = j.data;
    grid.innerHTML = "";
    treatCategories.forEach((cat) => {
      const card = document.createElement("div");
      card.className =
        "treat-category-card bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg";
      card.dataset.id = cat.id;
      card.innerHTML = `
          <div class="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
          <i data-lucide="${treatIconFor(cat.name)}" class="w-5 h-5 text-[#0d7377]"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800">${escHtml(cat.name)}</p>
          <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">${escHtml(cat.description || "")}</p>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-slate-100">
          <span class="text-xs font-bold text-[#0d7377]">Rs. ${Number(cat.estimated_cost).toFixed(2)}</span>
          <span class="text-xs text-slate-400">${cat.duration_minutes} min</span>
        </div>
      `;
      card.addEventListener("click", () => treatSelectCategory(cat));
      grid.appendChild(card);
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
  } catch (e) {
    grid.innerHTML =
      '<div class="col-span-full text-center py-10 text-red-400 text-sm">Failed to load categories.</div>';
  }
}

function treatSelectCategory(cat) {
  treatSelectedCategory = cat;
  document.querySelectorAll(".treat-category-card").forEach((c) => {
    c.style.borderColor = "";
    c.style.background = "";
    c.style.boxShadow = "";
  });
  const card = document.querySelector(
    `.treat-category-card[data-id="${cat.id}"]`,
  );
  if (card) {
    card.style.borderColor = "#0d7377";
    card.style.background = "#f0fdfc";
    card.style.boxShadow = "0 0 0 2px #0d737740";
  }
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl("treatSummaryName", cat.name);
  setEl("treatSummaryCost", `Rs. ${Number(cat.estimated_cost).toFixed(2)}`);
  setEl("treatSummaryDuration", `${cat.duration_minutes} min`);
  document.getElementById("treatSelectedSummary")?.classList.remove("hidden");
  const btn = document.getElementById("treatGenerateBtn");
  if (btn) btn.disabled = false;
}

async function treatGenerateTicket() {
  if (!treatSelectedCategory) return;
  const btn = document.getElementById("treatGenerateBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i> Generating…';
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
  try {
    const r = await fetch(`${API_BASE}/patient/generate_ticket.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: treatSelectedCategory.id }),
    });
    const j = await r.json();
    if (j.status !== "success")
      throw new Error(j.message || "Failed to generate ticket");
    treatShowTicketModal(j.data);
  } catch (e) {
    showTreatmentToast("error", "Error", e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<i data-lucide="ticket-plus" class="w-4 h-4"></i> Generate Ticket';
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
  }
}

function treatShowTicketModal(ticket) {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl("treatTktNumber", ticket.ticket_number);
  setEl("treatTktCategory", ticket.category);
  setEl("treatTktCost", `Rs. ${Number(ticket.cost).toFixed(2)}`);
  setEl("treatTktDuration", `${ticket.duration_minutes} min`);
  setEl("treatTktDate", formatDateTimeShort(ticket.generated_at));
  const modal = document.getElementById("treatTicketModal");
  if (modal) smoothOpenModal(modal, { mode: "display" });
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function closeTreatTicketModal() {
  const modal = document.getElementById("treatTicketModal");
  if (modal) smoothCloseModal(modal, { mode: "display" });
}

function treatPrintTicket() {
  const num = (
    document.getElementById("treatTktNumber")?.textContent || ""
  ).trim();
  const category = (
    document.getElementById("treatTktCategory")?.textContent || ""
  ).trim();
  const cost = (
    document.getElementById("treatTktCost")?.textContent || ""
  ).trim();
  const duration = (
    document.getElementById("treatTktDuration")?.textContent || ""
  ).trim();
  const date = (
    document.getElementById("treatTktDate")?.textContent || ""
  ).trim();
  const heights = [
    22, 16, 28, 14, 24, 18, 30, 12, 20, 26, 14, 22, 28, 16, 24, 18, 12, 26, 20,
    14, 28, 16, 22, 18, 26, 12, 24, 20,
  ];
  const barcode = heights
    .map((h) => `<span style="height:${h}px"></span>`)
    .join("");
  const html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Treatment Ticket</title><style>' +
    '* {margin:0;padding:0;box-sizing:border-box;} body{font-family:"Segoe UI",Arial,sans-serif;background:#f4f6f8;display:flex;align-items:center;justify-content:center;min-height:100vh;}' +
    ".ticket{background:#fff;width:420px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.13);}" +
    ".header{background:linear-gradient(135deg,#0d7377 0%,#0a5a5d 100%);padding:28px 28px 22px;color:#fff;}" +
    ".header-top{display:flex;align-items:center;gap:14px;margin-bottom:6px;} .logo{width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;}" +
    ".header h1{font-size:20px;font-weight:700;} .header p{font-size:11px;opacity:0.75;margin-top:1px;}" +
    ".tid{margin-top:14px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;display:inline-block;font-size:13px;font-weight:600;letter-spacing:1px;}" +
    ".divider{border:none;border-top:2px dashed #e2e8f0;margin:0 24px;} .body{padding:22px 28px;}" +
    ".row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;} .row:last-child{border-bottom:none;}" +
    ".lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;} .val{font-size:14px;font-weight:600;color:#1e293b;text-align:right;}" +
    ".cost{color:#0d7377;font-size:16px;font-weight:700;} .footer{padding:14px 28px 22px;text-align:center;}" +
    ".footer p{font-size:10px;color:#94a3b8;margin-bottom:10px;} .barcode{display:flex;justify-content:center;gap:2px;margin:8px auto;}" +
    ".barcode span{display:inline-block;background:#1e293b;width:3px;border-radius:1px;}" +
    "@media print{body{background:none;} .ticket{box-shadow:none;width:100%;}}" +
    '</style></head><body><div class="ticket">' +
    '<div class="header"><div class="header-top"><div class="logo">🎫</div><div><h1>Treatment Ticket</h1><p>Healthcare Management System</p></div></div>' +
    '<div class="tid">' +
    num +
    '</div></div><hr class="divider">' +
    '<div class="body">' +
    '<div class="row"><span class="lbl">Category</span><span class="val">' +
    category +
    "</span></div>" +
    '<div class="row"><span class="lbl">Estimated Cost</span><span class="val cost">' +
    cost +
    "</span></div>" +
    '<div class="row"><span class="lbl">Duration</span><span class="val">' +
    duration +
    "</span></div>" +
    '<div class="row"><span class="lbl">Generated On</span><span class="val" style="font-size:12px;font-weight:500;color:#475569">' +
    date +
    "</span></div>" +
    '</div><hr class="divider">' +
    '<div class="footer"><p>Present this ticket at the reception counter. Prices are estimates and may vary.</p>' +
    '<div class="barcode">' +
    barcode +
    "</div></div>" +
    "</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>" +
    "</body></html>";
  const win = window.open("", "_blank", "width=520,height=680");
  if (!win) {
    alert("Please allow popups to print the ticket.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

async function treatLoadTicketHistory() {
  const container = document.getElementById("treatTicketHistoryList");
  if (!container) return;
  container.innerHTML =
    '<div class="text-center py-10 text-slate-400 text-sm">Loading…</div>';
  try {
    const r = await fetch(`${API_BASE}/patient/my_tickets.php`, {
      credentials: "include",
    });
    const j = await r.json();
    if (j.status !== "success") throw new Error(j.message);
    if (!j.data.length) {
      container.innerHTML =
        '<div class="text-center py-10 text-slate-400 text-sm">No tickets generated yet.</div>';
      return;
    }
    container.innerHTML = "";
    j.data.forEach((t) => {
      const div = document.createElement("div");
      div.className =
        "bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3 flex items-center justify-between gap-4";
      div.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <i data-lucide="ticket" class="w-5 h-5 text-[#0d7377]"></i>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-800 truncate">${escHtml(t.category)}</p>
            <p class="text-xs text-slate-400 font-mono">${escHtml(t.ticket_number)}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold text-[#0d7377]">Rs. ${Number(t.cost).toFixed(2)}</p>
          <p class="text-xs text-slate-400">${t.duration_minutes} min · ${formatDateTimeShort(t.generated_at)}</p>
        </div>
      `;
      container.appendChild(div);
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div class="text-center py-10 text-red-400 text-sm">${escHtml(e.message)}</div>`;
  }
}

function showTreatmentToast(type, title, msg) {
  const toast = document.getElementById("treatToast");
  const iconEl = document.getElementById("treatToastIcon");
  const titleEl = document.getElementById("treatToastTitle");
  const msgEl = document.getElementById("treatToastMsg");
  if (!toast) return;
  const isSuccess = type === "success";
  iconEl.className = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`;
  iconEl.innerHTML = isSuccess
    ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
    : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
  titleEl.textContent = title;
  msgEl.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3500);
}

(async function initDashboard() {
  const ok = await requirePatientSession();
  if (!ok) return;
  await reload();

  // Check for payment result in URL params (Same-tab redirect flow)
  const urlParams = new URLSearchParams(window.location.search);
  const successParam = urlParams.get("success");
  const paymentStatus = urlParams.get("payment_status");

  if (successParam === "true") {
    showSuccessToast(
      "Payment successful \u2713",
      "Your appointment has been booked successfully via Khalti.",
    );
    // Auto-open receipt modal
    const apptId = urlParams.get("appointment_id");
    if (apptId) {
      setTimeout(() => openReceiptModal(apptId), 800);
    }
    // Clear params without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (successParam === "false") {
    showSuccessToast(
      "Payment " + (paymentStatus || "Failed"),
      "The payment did not complete. Please try again.",
    );
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Auto feedback popup disabled - users can click "Leave Feedback" button manually
  await refreshDashboardNotifications();
  setInterval(refreshDashboardNotifications, 5000);

  // Check for follow-up reminders (for tomorrow's appointments)
  try {
    await fetch(`${API_BASE}/patient/check_followup_reminders.php`, {
      credentials: "include",
    });
  } catch (err) {
    console.error("Error checking follow-up reminders:", err);
  }

  // Handle payment result messages from popup flow
  window.addEventListener("message", async (event) => {
    if (event.data && event.data.type === "payment-result") {
      const status = String(event.data.status || "")
        .toLowerCase()
        .trim();
      console.log("Payment result received in dashboard:", event.data);

      if (status === "completed") {
        await reload();
        showSuccessToast(
          "Payment successful \u2713",
          event.data.message ||
            "Your appointment has been booked successfully via Khalti.",
        );
        if (event.data.appointment_id) {
          setTimeout(() => openReceiptModal(event.data.appointment_id), 800);
        }
      } else if (status === "failed" || status === "cancelled") {
        showSuccessToast(
          "Payment " + status,
          event.data.message ||
            "The payment did not complete. Please try again.",
        );
      }
    }
  });
})();

function openReceiptModal(appointmentId) {
  const modal = document.getElementById("receiptModal");
  const iframe = document.getElementById("receiptModalIframe");
  const inner = document.getElementById("receiptModalInner");
  if (!modal || !iframe) return;

  iframe.src = `receipt.html?appointment_id=${appointmentId}&t=${Date.now()}`;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => {
    inner.classList.remove("scale-95");
    inner.classList.add("scale-100");
  }, 10);

  if (typeof lucide !== "undefined") lucide.createIcons();
}

function closeReceiptModal() {
  const modal = document.getElementById("receiptModal");
  const inner = document.getElementById("receiptModalInner");
  if (!modal || !inner) return;

  inner.classList.remove("scale-100");
  inner.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
    document.getElementById("receiptModalIframe").src = "";
  }, 200);
}
