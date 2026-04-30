let activeFilter = "all";
let searchQuery = "";
let cachedAppointments = [];

let currentView = 'appointments';
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
  const apptView  = document.getElementById('appointmentsView');
  const treatView = document.getElementById('treatmentsView');
  const sidebarAppt  = document.getElementById('sidebarAppointments');
  const sidebarTreat = document.getElementById('sidebarTreatments');

  if (apptView)  apptView.classList.toggle('hidden',  view !== 'appointments');
  if (treatView) treatView.classList.toggle('hidden', view !== 'treatments');

  const activeBtn   = 'flex flex-col md:flex-row items-center md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl bg-white/20 text-white text-[10px] md:text-sm font-medium transition-all w-auto md:w-full md:text-left';
  const inactiveBtn = 'flex flex-col md:flex-row items-center md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white text-[10px] md:text-sm font-medium transition-all w-auto md:w-full md:text-left';

  if (sidebarAppt)  sidebarAppt.className  = view === 'appointments' ? activeBtn : inactiveBtn;
  if (sidebarTreat) sidebarTreat.className = view === 'treatments'   ? activeBtn : inactiveBtn;

  if (view === 'treatments' && !treatCategoriesLoaded) treatLoadCategories();
  if (typeof lucide !== 'undefined') lucide.createIcons();
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

        <div class="flex flex-wrap gap-1.5 lg:flex-col w-28 shrink-0">
          <button type="button" data-view="${item.appointment_id}" class="view-btn w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition whitespace-nowrap text-center">
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
          <button type="button" data-view-ticket="${item.appointment_id}" class="view-ticket-btn w-full px-3 py-2 rounded-lg border border-[#007E85] text-[#007E85] hover:bg-teal-50 text-xs font-medium transition whitespace-nowrap text-center">
            View Ticket
          </button>
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

  document.querySelectorAll(".view-feedback-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const apt = cachedAppointments.find(a => a.appointment_id == button.dataset.viewFeedback);
      if (apt) openViewFeedbackModal(apt);
    });
  });

  document.querySelectorAll(".view-ticket-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const apt = cachedAppointments.find(a => a.appointment_id == button.dataset.viewTicket);
      if (!apt) return;
      if (apt.ticket_number) {
        openTicketModal(apt);
        return;
      }
      button.textContent = '...';
      button.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/patient/generate_ticket.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: apt.appointment_id }),
        });
        const j = await res.json();
        if (j.status === 'success') {
          await reload();
          const updated = cachedAppointments.find(a => a.appointment_id == apt.appointment_id);
          if (updated) openTicketModal(updated);
        } else {
          button.textContent = 'View Ticket';
          button.disabled = false;
        }
      } catch (e) {
        console.error(e);
        button.textContent = 'View Ticket';
        button.disabled = false;
      }
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openTicketModal(apt) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('tkt-number',   apt.ticket_number   || '—');
  setEl('tkt-category', apt.ticket_category || apt.specialization || '—');
  setEl('tkt-cost',     apt.ticket_cost     ? 'Rs. ' + Number(apt.ticket_cost).toFixed(2) : '—');
  setEl('tkt-date',     apt.ticket_generated_at ? new Date(apt.ticket_generated_at.replace(' ','T')+'+05:45').toLocaleString('en-US', {timeZone:'Asia/Kathmandu',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—');
  setEl('tkt-doctor',   apt.doctor_name     || '—');
  const modal = document.getElementById('ticketModal');
  if (!modal) return;
  // Disable iframe pointer events to prevent iframe click-through bug in Chrome
  ['bookingIframe', 'bookingModalIframe'].forEach(function(id) {
    const f = document.getElementById(id); if (f) f.style.pointerEvents = 'none';
  });
  modal.style.display = 'flex';
}

function closeTicketModal() {
  const modal = document.getElementById('ticketModal');
  if (modal) modal.style.display = 'none';
  // Re-enable iframe pointer events
  ['bookingIframe', 'bookingModalIframe'].forEach(function(id) {
    const f = document.getElementById(id); if (f) f.style.pointerEvents = '';
  });
}

function printTicket() {
  const num      = (document.getElementById('tkt-number')?.textContent   || '').trim();
  const doctor   = (document.getElementById('tkt-doctor')?.textContent   || '').trim();
  const category = (document.getElementById('tkt-category')?.textContent || '').trim();
  const cost     = (document.getElementById('tkt-cost')?.textContent     || '').trim();
  const date     = (document.getElementById('tkt-date')?.textContent     || '').trim();

  const heights  = [22,16,28,14,24,18,30,12,20,26,14,22,28,16,24,18,12,26,20,14,28,16,22,18,26,12,24,20];
  const barcode  = heights.map(function(h){ return '<span style="height:' + h + 'px"></span>'; }).join('');

  const html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Treatment Ticket</title><style>'
    + '* { margin:0;padding:0;box-sizing:border-box; }'
    + 'body { font-family:"Segoe UI",Arial,sans-serif;background:#f4f6f8;display:flex;align-items:center;justify-content:center;min-height:100vh; }'
    + '.ticket { background:#fff;width:420px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.13); }'
    + '.header { background:linear-gradient(135deg,#007E85 0%,#005f65 100%);padding:28px 28px 22px;color:#fff; }'
    + '.header-top { display:flex;align-items:center;gap:14px;margin-bottom:6px; }'
    + '.logo { width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px; }'
    + '.header h1 { font-size:20px;font-weight:700; } .header p { font-size:11px;opacity:0.75;margin-top:1px; }'
    + '.tid { margin-top:14px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;display:inline-block;font-size:13px;font-weight:600;letter-spacing:1px; }'
    + '.divider { border:none;border-top:2px dashed #e2e8f0;margin:0 24px; }'
    + '.body { padding:22px 28px; }'
    + '.row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9; }'
    + '.row:last-child { border-bottom:none; }'
    + '.lbl { font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px; }'
    + '.val { font-size:14px;font-weight:600;color:#1e293b;text-align:right; }'
    + '.cost { color:#007E85;font-size:16px;font-weight:700; }'
    + '.footer { padding:14px 28px 22px;text-align:center; }'
    + '.footer p { font-size:10px;color:#94a3b8;margin-bottom:10px; }'
    + '.barcode { display:flex;justify-content:center;gap:2px;margin:8px auto; }'
    + '.barcode span { display:inline-block;background:#1e293b;width:3px;border-radius:1px; }'
    + '@media print { body { background:none; } .ticket { box-shadow:none;width:100%; } }'
    + '</style></head><body><div class="ticket">'
    + '<div class="header"><div class="header-top"><div class="logo">🎫</div>'
    + '<div><h1>Treatment Ticket</h1><p>Healthcare Management System</p></div></div>'
    + '<div class="tid">' + num + '</div></div>'
    + '<hr class="divider">'
    + '<div class="body">'
    + '<div class="row"><span class="lbl">Doctor</span><span class="val">' + doctor + '</span></div>'
    + '<div class="row"><span class="lbl">Treatment Category</span><span class="val">' + category + '</span></div>'
    + '<div class="row"><span class="lbl">Estimated Cost</span><span class="val cost">' + cost + '</span></div>'
    + '<div class="row"><span class="lbl">Generated On</span><span class="val" style="font-size:12px;font-weight:500;color:#475569">' + date + '</span></div>'
    + '</div><hr class="divider">'
    + '<div class="footer"><p>Present this ticket at the reception counter. Prices are estimates and may vary.</p>'
    + '<div class="barcode">' + barcode + '</div></div>'
    + '</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()};};<\/script>'
    + '</body></html>';

  const win = window.open('', '_blank', 'width=520,height=680');
  if (!win) { alert('Please allow popups to print the ticket.'); return; }
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

let _fbCurrentApt = null;   // currently open appointment object

function showPanel(panel) {
  document.getElementById('fbViewPanel').classList.add('hidden');
  document.getElementById('fbWritePanel').classList.add('hidden');
  document.getElementById(panel).classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Open to VIEW existing feedback */
function openViewFeedbackModal(apt) {
  _fbCurrentApt = apt;
  document.getElementById('feedback-apt-id').value = apt.appointment_id;
  document.getElementById('fb-view-doctor').textContent = apt.doctor_name || 'Doctor';
  document.getElementById('fb-view-text').textContent = apt.feedback || '(No written feedback)';
  document.getElementById('feedbackModal').classList.remove('hidden');
  document.getElementById('feedbackModal').classList.add('flex');
  showPanel('fbViewPanel');
}

/** Open to WRITE new feedback */
function openFeedbackModal(apt) {
  _fbCurrentApt = apt;
  document.getElementById('feedback-apt-id').value = apt.appointment_id;
  document.getElementById('feedback-mode').value = 'new';
  document.getElementById('fb-write-doctor').textContent = apt.doctor_name || 'Doctor';
  document.getElementById('fb-write-title').textContent = 'Leave Feedback';
  document.getElementById('feedback-text').value = '';
  document.getElementById('fb-back-btn').classList.add('hidden');
  document.getElementById('submitFeedbackBtn').textContent = 'Submit Review';
  document.getElementById('feedbackModal').classList.remove('hidden');
  document.getElementById('feedbackModal').classList.add('flex');
  showPanel('fbWritePanel');
}

/** Switch from view → edit */
function switchToEditMode() {
  if (!_fbCurrentApt) return;
  document.getElementById('feedback-mode').value = 'edit';
  document.getElementById('fb-write-title').textContent = 'Edit Feedback';
  document.getElementById('fb-write-doctor').textContent = _fbCurrentApt.doctor_name || 'Doctor';
  document.getElementById('feedback-text').value = _fbCurrentApt.feedback || '';
  document.getElementById('fb-back-btn').classList.remove('hidden');
  document.getElementById('submitFeedbackBtn').textContent = 'Save Changes';
  showPanel('fbWritePanel');
}

/** Switch back to view */
function switchToViewMode() {
  showPanel('fbViewPanel');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.add('hidden');
  document.getElementById('feedbackModal').classList.remove('flex');
}

async function submitFeedback() {
  const aptId    = document.getElementById('feedback-apt-id').value;
  const mode     = document.getElementById('feedback-mode').value;
  const feedback = document.getElementById('feedback-text').value.trim();

  const btn = document.getElementById('submitFeedbackBtn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const isEdit = mode === 'edit';
    const url    = isEdit
      ? '../../api/patient/update_feedback.php'
      : '../../api/patient/submit_feedback.php';

    const res  = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: aptId, feedback })
    });
    const data = await res.json();
    if (data.status === 'success') {
      closeFeedbackModal();
      showSuccessToast(
        isEdit ? 'Feedback Updated' : 'Feedback Sent',
        isEdit ? 'Your review has been updated.' : 'Thank you for your rating.'
      );
      reload();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (e) {
    alert('Exception: ' + e.message);
  } finally {
    btn.textContent = mode === 'edit' ? 'Save Changes' : 'Submit Review';
    btn.disabled = false;
  }
}

function checkForPendingFeedback(rows) {
  const unrated = rows.find(a => a.status_key === "completed" && !a.feedback);
  if (unrated) {
    const key = `prompted_feedback_${unrated.appointment_id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'true');
      setTimeout(() => openFeedbackModal(unrated), 1000);
    }
  }
}


// ── HELPERS ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateTimeShort(dt) {
  if (!dt) return '';
  const d = new Date(dt.replace(' ', 'T') + '+05:45');
  return d.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── TREATMENTS ────────────────────────────────────────────────────────────────
const TREAT_CATEGORY_ICONS = {
  'General Consultation': 'stethoscope',
  'Cardiology':           'heart-pulse',
  'Orthopedics':          'bone',
  'Dermatology':          'sun',
  'Neurology':            'brain',
  'Pediatrics':           'baby',
  'Gynecology':           'venus',
  'Ophthalmology':        'eye',
  'Physiotherapy':        'activity',
  'Dentistry':            'smile',
};

function treatIconFor(name) {
  return TREAT_CATEGORY_ICONS[name] || 'circle-plus';
}

function treatSwitchTab(tab) {
  const isGenerate = tab === 'generate';
  document.getElementById('treatPanelGenerate').classList.toggle('hidden', !isGenerate);
  document.getElementById('treatPanelHistory').classList.toggle('hidden', isGenerate);
  document.getElementById('treatTabGenerate').className = isGenerate
    ? 'px-5 py-2 rounded-xl text-sm font-semibold bg-[#007E85] text-white shadow-sm transition'
    : 'px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition';
  document.getElementById('treatTabHistory').className = !isGenerate
    ? 'px-5 py-2 rounded-xl text-sm font-semibold bg-[#007E85] text-white shadow-sm transition'
    : 'px-5 py-2 rounded-xl text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition';
  if (!isGenerate) treatLoadTicketHistory();
}

async function treatLoadCategories() {
  treatCategoriesLoaded = true;
  const grid = document.getElementById('treatCategoryGrid');
  if (!grid) return;
  try {
    const r = await fetch(`${API_BASE}/patient/treatment_categories.php`, { credentials: 'include' });
    const j = await r.json();
    if (j.status !== 'success' || !j.data.length) {
      grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400 text-sm">No treatment categories available.</div>';
      return;
    }
    treatCategories = j.data;
    grid.innerHTML = '';
    treatCategories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'treat-category-card bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg';
      card.dataset.id = cat.id;
      card.innerHTML = `
        <div class="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
          <i data-lucide="${treatIconFor(cat.name)}" class="w-5 h-5 text-[#007E85]"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800">${escHtml(cat.name)}</p>
          <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">${escHtml(cat.description || '')}</p>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-slate-100">
          <span class="text-xs font-bold text-[#007E85]">Rs. ${Number(cat.estimated_cost).toFixed(2)}</span>
          <span class="text-xs text-slate-400">${cat.duration_minutes} min</span>
        </div>
      `;
      card.addEventListener('click', () => treatSelectCategory(cat));
      grid.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (e) {
    grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-400 text-sm">Failed to load categories.</div>';
  }
}

function treatSelectCategory(cat) {
  treatSelectedCategory = cat;
  document.querySelectorAll('.treat-category-card').forEach(c => {
    c.style.borderColor = '';
    c.style.background  = '';
    c.style.boxShadow   = '';
  });
  const card = document.querySelector(`.treat-category-card[data-id="${cat.id}"]`);
  if (card) {
    card.style.borderColor = '#007e85';
    card.style.background  = '#f0fdfc';
    card.style.boxShadow   = '0 0 0 2px #007e8540';
  }
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('treatSummaryName',     cat.name);
  setEl('treatSummaryCost',     `Rs. ${Number(cat.estimated_cost).toFixed(2)}`);
  setEl('treatSummaryDuration', `${cat.duration_minutes} min`);
  document.getElementById('treatSelectedSummary')?.classList.remove('hidden');
  const btn = document.getElementById('treatGenerateBtn');
  if (btn) btn.disabled = false;
}

async function treatGenerateTicket() {
  if (!treatSelectedCategory) return;
  const btn = document.getElementById('treatGenerateBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i> Generating…'; }
  if (typeof lucide !== 'undefined') lucide.createIcons();
  try {
    const r = await fetch(`${API_BASE}/patient/generate_ticket.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: treatSelectedCategory.id }),
    });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.message || 'Failed to generate ticket');
    treatShowTicketModal(j.data);
  } catch (e) {
    showTreatmentToast('error', 'Error', e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="ticket-plus" class="w-4 h-4"></i> Generate Ticket'; }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function treatShowTicketModal(ticket) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('treatTktNumber',   ticket.ticket_number);
  setEl('treatTktCategory', ticket.category);
  setEl('treatTktCost',     `Rs. ${Number(ticket.cost).toFixed(2)}`);
  setEl('treatTktDuration', `${ticket.duration_minutes} min`);
  setEl('treatTktDate',     formatDateTimeShort(ticket.generated_at));
  const modal = document.getElementById('treatTicketModal');
  if (modal) modal.style.display = 'flex';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeTreatTicketModal() {
  const modal = document.getElementById('treatTicketModal');
  if (modal) modal.style.display = 'none';
}

function treatPrintTicket() {
  const num      = (document.getElementById('treatTktNumber')?.textContent   || '').trim();
  const category = (document.getElementById('treatTktCategory')?.textContent || '').trim();
  const cost     = (document.getElementById('treatTktCost')?.textContent     || '').trim();
  const duration = (document.getElementById('treatTktDuration')?.textContent || '').trim();
  const date     = (document.getElementById('treatTktDate')?.textContent     || '').trim();
  const heights  = [22,16,28,14,24,18,30,12,20,26,14,22,28,16,24,18,12,26,20,14,28,16,22,18,26,12,24,20];
  const barcode  = heights.map(h => `<span style="height:${h}px"></span>`).join('');
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Treatment Ticket</title><style>'
    + '* {margin:0;padding:0;box-sizing:border-box;} body{font-family:"Segoe UI",Arial,sans-serif;background:#f4f6f8;display:flex;align-items:center;justify-content:center;min-height:100vh;}'
    + '.ticket{background:#fff;width:420px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.13);}'
    + '.header{background:linear-gradient(135deg,#007E85 0%,#005f65 100%);padding:28px 28px 22px;color:#fff;}'
    + '.header-top{display:flex;align-items:center;gap:14px;margin-bottom:6px;} .logo{width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;}'
    + '.header h1{font-size:20px;font-weight:700;} .header p{font-size:11px;opacity:0.75;margin-top:1px;}'
    + '.tid{margin-top:14px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;display:inline-block;font-size:13px;font-weight:600;letter-spacing:1px;}'
    + '.divider{border:none;border-top:2px dashed #e2e8f0;margin:0 24px;} .body{padding:22px 28px;}'
    + '.row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;} .row:last-child{border-bottom:none;}'
    + '.lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;} .val{font-size:14px;font-weight:600;color:#1e293b;text-align:right;}'
    + '.cost{color:#007E85;font-size:16px;font-weight:700;} .footer{padding:14px 28px 22px;text-align:center;}'
    + '.footer p{font-size:10px;color:#94a3b8;margin-bottom:10px;} .barcode{display:flex;justify-content:center;gap:2px;margin:8px auto;}'
    + '.barcode span{display:inline-block;background:#1e293b;width:3px;border-radius:1px;}'
    + '@media print{body{background:none;} .ticket{box-shadow:none;width:100%;}}'
    + '</style></head><body><div class="ticket">'
    + '<div class="header"><div class="header-top"><div class="logo">🎫</div><div><h1>Treatment Ticket</h1><p>Healthcare Management System</p></div></div>'
    + '<div class="tid">' + num + '</div></div><hr class="divider">'
    + '<div class="body">'
    + '<div class="row"><span class="lbl">Category</span><span class="val">' + category + '</span></div>'
    + '<div class="row"><span class="lbl">Estimated Cost</span><span class="val cost">' + cost + '</span></div>'
    + '<div class="row"><span class="lbl">Duration</span><span class="val">' + duration + '</span></div>'
    + '<div class="row"><span class="lbl">Generated On</span><span class="val" style="font-size:12px;font-weight:500;color:#475569">' + date + '</span></div>'
    + '</div><hr class="divider">'
    + '<div class="footer"><p>Present this ticket at the reception counter. Prices are estimates and may vary.</p>'
    + '<div class="barcode">' + barcode + '</div></div>'
    + '</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>'
    + '</body></html>';
  const win = window.open('', '_blank', 'width=520,height=680');
  if (!win) { alert('Please allow popups to print the ticket.'); return; }
  win.document.write(html);
  win.document.close();
}

async function treatLoadTicketHistory() {
  const container = document.getElementById('treatTicketHistoryList');
  if (!container) return;
  container.innerHTML = '<div class="text-center py-10 text-slate-400 text-sm">Loading…</div>';
  try {
    const r = await fetch(`${API_BASE}/patient/my_tickets.php`, { credentials: 'include' });
    const j = await r.json();
    if (j.status !== 'success') throw new Error(j.message);
    if (!j.data.length) {
      container.innerHTML = '<div class="text-center py-10 text-slate-400 text-sm">No tickets generated yet.</div>';
      return;
    }
    container.innerHTML = '';
    j.data.forEach(t => {
      const div = document.createElement('div');
      div.className = 'bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3 flex items-center justify-between gap-4';
      div.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <i data-lucide="ticket" class="w-5 h-5 text-[#007E85]"></i>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-800 truncate">${escHtml(t.category)}</p>
            <p class="text-xs text-slate-400 font-mono">${escHtml(t.ticket_number)}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-bold text-[#007E85]">Rs. ${Number(t.cost).toFixed(2)}</p>
          <p class="text-xs text-slate-400">${t.duration_minutes} min · ${formatDateTimeShort(t.generated_at)}</p>
        </div>
      `;
      container.appendChild(div);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div class="text-center py-10 text-red-400 text-sm">${escHtml(e.message)}</div>`;
  }
}

function showTreatmentToast(type, title, msg) {
  const toast   = document.getElementById('treatToast');
  const iconEl  = document.getElementById('treatToastIcon');
  const titleEl = document.getElementById('treatToastTitle');
  const msgEl   = document.getElementById('treatToastMsg');
  if (!toast) return;
  const isSuccess = type === 'success';
  iconEl.className = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`;
  iconEl.innerHTML = isSuccess
    ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
    : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
  titleEl.textContent = title;
  msgEl.textContent   = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
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
  
  // Check for follow-up reminders (for tomorrow's appointments)
  try {
    await fetch(`${API_BASE}/patient/check_followup_reminders.php`, { credentials: 'include' });
  } catch (err) {
    console.error('Error checking follow-up reminders:', err);
  }
})();
