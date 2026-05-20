let doctorsList = [];
let selectedDoctor = null;
let rescheduleAppointmentId = null;
let pendingBookingRequest = null;
let _pendingRescheduleId = null;
let patientEmail = null;

function notifyParentResize() {
  try {
    setTimeout(() => {
      const height =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage(
        { type: "booking:height", height: height },
        "*",
      );
      window.parent.postMessage({ type: "booking:resize" }, "*");
    }, 60);
  } catch (err) {
    console.warn(err);
  }
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `Rs. ${x.toFixed(2)}`;
}

function updatePrice() {
  const sel = document.getElementById("doctor").value;
  const doc = doctorsList.find((d) => d.doctor_id === sel);
  selectedDoctor = doc || null;
  document.getElementById("totalPrice").textContent = doc
    ? formatMoney(doc.consultation_fee)
    : "—";
}

async function showEmailVerificationModal() {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden">
        <div class="p-8">
          <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2 text-center">Verify Your Email</h3>
          <p class="text-slate-600 text-sm mb-6 text-center">Please enter your email to confirm this booking.</p>
          <input type="email" id="verifyEmailInput" placeholder="Enter your email" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50 focus:bg-white mb-4" />
          <div id="emailError" class="hidden text-red-600 text-xs mb-4 text-center"></div>
          <div class="flex gap-3">
            <button type="button" id="cancelEmailBtn" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="button" id="confirmEmailBtn" class="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
              Confirm
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const emailInput = modal.querySelector("#verifyEmailInput");
    const confirmBtn = modal.querySelector("#confirmEmailBtn");
    const cancelBtn = modal.querySelector("#cancelEmailBtn");
    const errorDiv = modal.querySelector("#emailError");
    
    emailInput.focus();
    
    confirmBtn.addEventListener("click", () => {
      const enteredEmail = emailInput.value.trim().toLowerCase();
      if (!enteredEmail) {
        errorDiv.textContent = "Please enter an email address";
        errorDiv.classList.remove("hidden");
        return;
      }
      
      if (enteredEmail !== patientEmail.toLowerCase()) {
        errorDiv.textContent = "Email does not match your account";
        errorDiv.classList.remove("hidden");
        return;
      }
      
      modal.remove();
      resolve(true);
    });
    
    cancelBtn.addEventListener("click", () => {
      modal.remove();
      resolve(false);
    });
    
    emailInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        confirmBtn.click();
      }
    });
  });
}

function getSelectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "esewa";
}

function setBookingConflictMessage(message = "") {
  const msgEl = document.getElementById("bookingConflictMessage");
  if (!msgEl) return;
  const text = String(message || "").trim();
  if (!text) {
    msgEl.textContent = "";
    msgEl.classList.add("hidden");
    notifyParentResize();
    return;
  }
  msgEl.textContent = text;
  msgEl.classList.remove("hidden");
  notifyParentResize();
}

async function getSameDayBookingConflict(dateStr, timeStr, doctorId, excludeAppointmentId = null) {
  if (!dateStr || !timeStr || !doctorId) return null;
  try {
    const r = await fetch(
      `${API_BASE}/patient/appointments_by_day.php?date=${encodeURIComponent(dateStr)}`,
      { credentials: "include" },
    );
    const j = await r.json();
    if (j.status !== "success" || !Array.isArray(j.data)) return null;

    const targetTime = String(timeStr).substring(0, 5);
    const targetDocId = String(doctorId);

    const conflict = j.data.find((apt) => {
      const status = String(apt.status || "").toLowerCase();
      const isCancelled = status === "cancelled";
      const sameAsEdited =
        excludeAppointmentId != null &&
        Number(apt.appointment_id) === Number(excludeAppointmentId);
      
      if (isCancelled || sameAsEdited) return false;

      const aptTime = String(apt.app_time).substring(0, 5);
      const aptDocId = String(apt.doctor_id);

      // Conflict if same doctor OR same time
      return aptDocId === targetDocId || aptTime === targetTime;
    });
    return conflict || null;
  } catch (err) {
    console.error("Conflict check failed:", err);
    return null;
  }
}

async function loadDoctors() {
  const r = await fetch(`${API_BASE}/patient/doctors.php`, {
    credentials: "include",
  });
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.message || "Doctors failed");
  doctorsList = j.data || [];

  // Build unique specializations (preserving appointment-count order)
  const specs = [];
  const seen = new Set();
  doctorsList.forEach((d) => {
    const s = d.specialization || "General";
    if (!seen.has(s)) { seen.add(s); specs.push(s); }
  });

  const specSel = document.getElementById("specialization");
  specSel.innerHTML = '<option value="">Select specialization</option>';
  specs.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    specSel.appendChild(opt);
  });
}

function onSpecializationChange() {
  const spec = document.getElementById("specialization").value;
  const wrap = document.getElementById("doctorSelectWrap");

  // Reset
  selectedDoctor = null;
  document.getElementById("totalPrice").textContent = "—";
  document.getElementById("date").innerHTML = '<option value="">Select doctor first</option>';
  document.getElementById("time").innerHTML = '<option value="">Select date first</option>';

  if (!spec) { wrap.classList.add("hidden"); return; }

  const filtered = doctorsList.filter((d) => (d.specialization || "General") === spec);

  // Reset custom dropdown
  const hiddenInput = document.getElementById("doctor");
  hiddenInput.value = "";
  selectedDoctor = null;
  document.getElementById("doctorDropdownLabel").textContent = "Select doctor";
  document.getElementById("doctorDropdownLabel").classList.add("text-slate-400");
  document.getElementById("doctorDropdownLabel").classList.remove("text-slate-700");

  const list = document.getElementById("doctorDropdownList");
  list.innerHTML = "";
  filtered.forEach((d) => {
    const fee = d.consultation_fee ? `Rs. ${Number(d.consultation_fee).toFixed(0)}` : "Rs. 500";
    const item = document.createElement("button");
    item.type = "button";
    item.className = "w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0";
    item.dataset.id = d.doctor_id;
    item.innerHTML = `<span class="font-medium text-slate-700">${d.full_name}</span><span class="text-teal-700 font-semibold ml-4 shrink-0">${fee}</span>`;
    item.addEventListener("click", () => selectDoctor(d.doctor_id, d.full_name));
    list.appendChild(item);
  });

  wrap.classList.remove("hidden");
  notifyParentResize();
}

function selectDoctor(doctorId, doctorName) {
  document.getElementById("doctor").value = doctorId;
  const label = document.getElementById("doctorDropdownLabel");
  label.textContent = doctorName;
  label.classList.remove("text-slate-400");
  label.classList.add("text-slate-700");
  document.getElementById("doctorDropdownPanel").classList.add("hidden");
  selectedDoctor = doctorsList.find((d) => d.doctor_id === doctorId) || null;
  document.getElementById("totalPrice").textContent = selectedDoctor
    ? formatMoney(selectedDoctor.consultation_fee)
    : "—";
  loadDates(doctorId).then(() => checkBookingConflicts());
}

async function loadDates(doctorId) {
  const dateSel = document.getElementById("date");
  const timeSel = document.getElementById("time");
  dateSel.innerHTML = '<option value="">Loading…</option>';
  timeSel.innerHTML = '<option value="">Select date first</option>';
  document.getElementById("availId").value = "";

  if (!doctorId) {
    dateSel.innerHTML = '<option value="">Select doctor first</option>';
    return;
  }

  const r = await fetch(
    `${API_BASE}/patient/availability.php?action=dates&doctor_id=${encodeURIComponent(doctorId)}`,
    { credentials: "include" },
  );
  const j = await r.json();
  dateSel.innerHTML = '<option value="">Select date</option>';
  if (j.status !== "success" || !j.data || !j.data.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No open dates for this doctor";
    opt.disabled = true;
    dateSel.appendChild(opt);
    return;
  }
  j.data.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    dateSel.appendChild(opt);
  });
}

async function loadSlots(doctorId, dateStr) {
  const timeSel = document.getElementById("time");
  timeSel.innerHTML = '<option value="">Loading…</option>';
  document.getElementById("availId").value = "";

  if (!doctorId || !dateStr) {
    timeSel.innerHTML = '<option value="">Select date first</option>';
    return;
  }

  const r = await fetch(
    `${API_BASE}/patient/availability.php?action=slots&doctor_id=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(dateStr)}`,
    { credentials: "include" },
  );
  const j = await r.json();
  timeSel.innerHTML = '<option value="">Select time</option>';
  if (j.status !== "success" || !j.data || !j.data.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No slots left";
    opt.disabled = true;
    timeSel.appendChild(opt);
    return;
  }
  j.data.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = String(slot.avail_id);
    opt.dataset.start = slot.start_time;
    opt.textContent = `${formatTime12h(slot.start_time)} \u2013 ${formatTime12h(slot.end_time)}`;
    timeSel.appendChild(opt);
  });
}

async function loadRescheduleContext(appointmentId) {
  rescheduleAppointmentId = appointmentId;
  const r = await fetch(
    `${API_BASE}/patient/appointment_detail.php?id=${appointmentId}`,
    { credentials: "include" },
  );
  const j = await r.json();
  if (j.status !== "success" || !j.data) {
    alert(j.message || "Could not load appointment");
    return;
  }
  const a = j.data;

  // ── Lock doctor (hidden input) ────────────────────────────────────────────
  const doctorSel = document.getElementById("doctor");
  doctorSel.value = String(a.doctor_id);
  doctorSel.disabled = true;
  doctorSel.style.opacity = "0.7";
  doctorSel.style.cursor = "not-allowed";

  // ── Pre-fill specialization dropdown and show the doctor row ─────────────
  const doc = doctorsList.find((d) => String(d.doctor_id) === String(a.doctor_id));
  const specSel = document.getElementById("specialization");
  if (doc && doc.specialization) {
    specSel.value = doc.specialization;
  }
  specSel.disabled = true;
  specSel.style.opacity = "0.7";
  specSel.style.cursor = "not-allowed";
  specSel.style.pointerEvents = "none";

  // ── Update and lock the custom doctor dropdown UI ─────────────────────────
  const doctorLabel = document.getElementById("doctorDropdownLabel");
  if (doctorLabel) {
    doctorLabel.textContent = a.doctor_name || doc?.full_name || "Doctor";
    doctorLabel.classList.remove("text-slate-400");
    doctorLabel.classList.add("text-slate-700");
  }
  const doctorDropBtn = document.getElementById("doctorDropdownBtn");
  if (doctorDropBtn) {
    doctorDropBtn.disabled = true;
    doctorDropBtn.style.opacity = "0.7";
    doctorDropBtn.style.cursor = "not-allowed";
    doctorDropBtn.style.pointerEvents = "none";
  }
  const doctorDropContainer = document.getElementById("doctorDropdownContainer");
  if (doctorDropContainer) {
    doctorDropContainer.style.pointerEvents = "none";
  }
  document.getElementById("doctorSelectWrap")?.classList.remove("hidden");

  selectedDoctor = doc || null;
  updatePrice();
  await loadDates(a.doctor_id);
  if (a.app_date) {
    document.getElementById("date").value = a.app_date;
    await loadSlots(a.doctor_id, a.app_date);
    if (a.app_time) {
      const timeSel = document.getElementById("time");
      const appTimeNorm = String(a.app_time).trim().substring(0, 5);
      let matched = null;
      for (const opt of timeSel.options) {
        if (
          opt.dataset.start &&
          opt.dataset.start.trim().substring(0, 5) === appTimeNorm
        ) {
          matched = opt;
          break;
        }
      }
      if (matched) {
        timeSel.value = matched.value;
        document.getElementById("availId").value = matched.value;
      }
    }
  } else {
    document.getElementById("date").value = "";
    document.getElementById("time").innerHTML =
      '<option value="">Select date first</option>';
    document.getElementById("availId").value = "";
  }
  document.getElementById("description").value = a.reason_for_visit || "";
  const btn = document.getElementById("confirmBtn");
  btn.textContent = "Confirm reschedule";
  notifyParentResize();
}

const bookingForm = document.getElementById("bookingForm");
const cancelBooking = document.getElementById("cancelBooking");

window.addEventListener("message", (event) => {
  if (!event.data) return;

  // Handle reschedule context from parent dashboard
  if (event.data.type === "START_RESCHEDULE" && event.data.appointment_id) {
    if (doctorsList.length > 0) {
      loadRescheduleContext(event.data.appointment_id);
    } else {
      _pendingRescheduleId = event.data.appointment_id;
    }
  }
});

cancelBooking?.addEventListener("click", () => {
  const patientName = document.getElementById("patientName").value;
  bookingForm.reset();
  document.getElementById("patientName").value = patientName;
  rescheduleAppointmentId = null;
  document.getElementById("confirmBtn").textContent = "Confirm Booking";
  const ds = document.getElementById("doctor");
  ds.disabled = false;
  ds.style.opacity = "";
  ds.style.cursor = "";
  window.parent.postMessage({ type: "booking:close" }, "*");
});

document.getElementById("specialization").addEventListener("change", () => {
  onSpecializationChange();
});

// Toggle custom doctor dropdown open/close
document.getElementById("doctorDropdownBtn").addEventListener("click", () => {
  const panel = document.getElementById("doctorDropdownPanel");
  panel.classList.toggle("hidden");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const container = document.getElementById("doctorDropdownContainer");
  if (container && !container.contains(e.target)) {
    document.getElementById("doctorDropdownPanel")?.classList.add("hidden");
  }
});

async function checkBookingConflicts() {
  const doctorId = document.getElementById("doctor").value;
  const dateStr = document.getElementById("date").value;
  const timeSel = document.getElementById("time");
  
  const confirmBtn = document.getElementById("confirmBtn");
  if (!confirmBtn) return;

  if (!dateStr || !doctorId) {
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("opacity-60", "cursor-not-allowed");
    setBookingConflictMessage("");
    return;
  }

  // Fetch all appointments for that day to check for both doctor and time conflicts
  try {
    const r = await fetch(
      `${API_BASE}/patient/appointments_by_day.php?date=${encodeURIComponent(dateStr)}`,
      { credentials: "include" },
    );
    const j = await r.json();
    if (j.status !== "success" || !Array.isArray(j.data)) return;

    const targetDocId = String(doctorId);
    const selectedOpt = timeSel.selectedOptions[0];
    const timeStr = (selectedOpt && selectedOpt.value) ? selectedOpt.dataset.start : null;
    const targetTime = timeStr ? String(timeStr).substring(0, 5) : null;

    const conflict = j.data.find((apt) => {
      const status = String(apt.status || "").toLowerCase();
      if (status === "cancelled") return false;
      if (rescheduleAppointmentId && Number(apt.appointment_id) === Number(rescheduleAppointmentId)) return false;

      const aptDocId = String(apt.doctor_id);
      const aptTime = String(apt.app_time).substring(0, 5);

      // 1. Same Doctor Check (Always blocks)
      if (aptDocId === targetDocId) return true;

      // 2. Same Time Check (Blocks if time is selected)
      if (targetTime && aptTime === targetTime) return true;

      return false;
    });

    if (conflict) {
      const doctorName = conflict.doctor_name || "another doctor";
      confirmBtn.disabled = true;
      confirmBtn.classList.add("opacity-60", "cursor-not-allowed");
      
      if (String(conflict.doctor_id) === targetDocId) {
          confirmBtn.title = `You already have an appointment with ${doctorName} on this date.`;
          setBookingConflictMessage(
            `You already have an appointment with ${doctorName} on this date. Multiple bookings with the same doctor on the same day are not allowed.`
          );
      } else {
          const formattedTime = formatTime12h(conflict.app_time);
          confirmBtn.title = `You already have an appointment at ${formattedTime} with ${doctorName}.`;
          setBookingConflictMessage(
            `You already have an appointment at ${formattedTime} with ${doctorName}. Please choose a different time.`
          );
      }
    } else {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove("opacity-60", "cursor-not-allowed");
      confirmBtn.title = "";
      setBookingConflictMessage("");
    }
  } catch (err) {
    console.error("Conflict check failed:", err);
  }
}

document.getElementById("date").addEventListener("change", async () => {
  const doctorId = document.getElementById("doctor").value;
  const dateStr = document.getElementById("date").value;
  await loadSlots(doctorId, dateStr);
  await checkBookingConflicts();
});

document.getElementById("time").addEventListener("change", async () => {
  const v = document.getElementById("time").value;
  document.getElementById("availId").value = v || "";
  await checkBookingConflicts();
});

// Close success modal
document.getElementById("closeSuccessModal").addEventListener("click", () => {
  if (typeof smoothCloseModal === "function") {
    smoothCloseModal("successModal", { mode: "class" });
  } else {
    document.getElementById("successModal").classList.add("hidden");
  }
  window.parent.postMessage({ type: "patient-booking-done" }, "*");
});

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // --- Profile completion check ---
  try {
    const profileRes = await fetch(`${API_BASE}/patient/profile.php`, {
      credentials: "include",
    });
    const profileJson = await profileRes.json();
    if (profileJson.status === "success" && profileJson.data) {
      const p = profileJson.data;
      const fields = [
        p.full_name,
        p.email,
        p.contact_number,
        p.age,
        p.gender,
        p.blood_group,
        p.address,
        p.emergency_contact_name,
        p.emergency_contact_phone,
      ];
      const complete = fields.every(
        (f) => f !== null && f !== undefined && String(f).trim() !== "",
      );
      if (!complete) {
        // Notify parent dashboard to show popup and redirect
        if (window.self !== window.top) {
          window.parent.postMessage(
            { type: "profile-incomplete-redirect" },
            "*",
          );
        } else {
          window.location.href = "profile.html";
        }
        return;
      }
    }
  } catch (err) {
    console.error("Profile check error:", err);
  }
  // --- End profile check ---

  const doctorId = document.getElementById("doctor").value;
  const availId = parseInt(document.getElementById("availId").value, 10);
  const description = document.getElementById("description").value.trim();
  const selectedDate = document.getElementById("date").value;

  if (!doctorId || !availId) {
    alert("Please choose doctor, date, and an available time slot.");
    return;
  }

  const conflict = await getSameDayBookingConflict(
    selectedDate,
    rescheduleAppointmentId,
  );
  if (conflict) {
    const doctorName = conflict.doctor_name || "another doctor";
    setBookingConflictMessage(
      `You already have an appointment with ${doctorName} on this date. Multiple appointments on the same day are not allowed.`,
    );
    return;
  }
  setBookingConflictMessage("");

  if (!rescheduleAppointmentId) {
    // Show email verification modal
    const verified = await showEmailVerificationModal();
    if (!verified) {
      return;
    }
    
    // Email verified, create appointment
    try {
      const r = await fetch(`${API_BASE}/patient/book.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          avail_id: availId,
          reason_for_visit: description,
        }),
      });
      const j = await r.json();
      if (j.status !== "success") {
        alert(j.message || "Booking failed");
        return;
      }
      if (!j.appointment_id || j.appointment_id < 1) {
        alert(
          "Booking did not save correctly (no appointment id). Check the server log or try again.",
        );
        return;
      }
      // Auto-generate treatment ticket (silent — errors don't block booking)
      try {
        await fetch(`${API_BASE}/patient/generate_ticket.php`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointment_id: j.appointment_id }),
        });
      } catch (ticketErr) {
        console.warn("Ticket generation failed:", ticketErr);
      }
      
      const patientName = document.getElementById("patientName").value;
      bookingForm.reset();
      document.getElementById("patientName").value = patientName;
      rescheduleAppointmentId = null;
      document.getElementById("confirmBtn").textContent = "Confirm Booking";
      pendingBookingRequest = null;
      setBookingConflictMessage("");

      // Notify parent
      window.parent.postMessage({ type: "patient-booking-done" }, "*");
      return;
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
      return;
    }
  }

  try {
    if (rescheduleAppointmentId) {
      const r = await fetch(`${API_BASE}/patient/reschedule.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: rescheduleAppointmentId,
          avail_id: availId,
        }),
      });
      let j;
      try { j = await r.json(); } catch (_) { j = { status: "error", message: await r.text().catch(() => "Server error") }; }
      if (j.status !== "success") {
        alert(j.message || "Reschedule failed");
        return;
      }
    } else {
      const r = await fetch(`${API_BASE}/patient/book.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          avail_id: availId,
          reason_for_visit: description,
        }),
      });
      const j = await r.json();
      if (j.status !== "success") {
        alert(j.message || "Booking failed");
        return;
      }
      if (!j.appointment_id || j.appointment_id < 1) {
        alert(
          "Booking did not save correctly (no appointment id). Check the server log or try again.",
        );
        return;
      }
      // Auto-generate treatment ticket (silent — errors don't block booking)
      try {
        await fetch(`${API_BASE}/patient/generate_ticket.php`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointment_id: j.appointment_id }),
        });
      } catch (ticketErr) {
        console.warn("Ticket generation failed:", ticketErr);
      }
    }

    const patientName = document.getElementById("patientName").value;
    bookingForm.reset();
    document.getElementById("patientName").value = patientName;
    rescheduleAppointmentId = null;
    document.getElementById("confirmBtn").textContent = "Confirm Booking";
    pendingBookingRequest = null;
    setBookingConflictMessage("");
    if (typeof closePaymentPanel === "function") closePaymentPanel();

    // Notify parent — parent handles the single success popup
    window.parent.postMessage({ type: "patient-booking-done" }, "*");
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
});

(async function initBooking() {
  const ok = await requirePatientSession();
  if (!ok) return;

  try {
    const me = await fetch(`${API_BASE}/patient/me.php`, {
      credentials: "include",
    }).then((r) => r.json());
    if (me.status === "success" && me.data) {
      const nameField = document.getElementById("patientName");
      nameField.value = me.data.full_name || "";
      nameField.readOnly = true;
      nameField.style.cssText += "background:#f8fafc;cursor:default;color:#475569;";
      
      // Store patient email for verification
      patientEmail = me.data.email || "";
      if (!patientEmail) {
        console.error("Patient email not found - email verification will fail");
      }
    }
    await loadDoctors();
    updatePrice();
    if (_pendingRescheduleId) {
      const id = _pendingRescheduleId;
      _pendingRescheduleId = null;
      await loadRescheduleContext(id);
    }
    notifyParentResize();
  } catch (e) {
    console.error(e);
    document.getElementById("doctor").innerHTML =
      '<option value="">Could not load doctors</option>';
    notifyParentResize();
  }
})();
