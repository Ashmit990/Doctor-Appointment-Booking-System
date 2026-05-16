let doctorsList = [];
let selectedDoctor = null;
let rescheduleAppointmentId = null;
let pendingBookingRequest = null;
let _pendingRescheduleId = null;

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

function getSelectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "khalti";
}

function setPaymentStatusMessage(message, variant = "info") {
  const box = document.getElementById("paymentStatusMessage");
  if (!box) return;
  box.textContent = message;
  box.className = "mt-3 rounded-xl px-3 py-2 text-xs";
  if (variant === "error") {
    box.classList.add("bg-red-50", "text-red-700", "border", "border-red-200");
  } else if (variant === "success") {
    box.classList.add(
      "bg-emerald-50",
      "text-emerald-700",
      "border",
      "border-emerald-200",
    );
  } else {
    box.classList.add(
      "bg-slate-50",
      "text-slate-500",
      "border",
      "border-slate-100",
    );
  }
}

function openPaymentPanel() {
  const doctorId = document.getElementById("doctor").value;
  const availId = document.getElementById("availId").value;
  const reason = document.getElementById("description").value;
  const doctorName = selectedDoctor
    ? selectedDoctor.full_name
    : document.getElementById("doctor").selectedOptions?.[0]?.textContent ||
      "—";
  const specialization = selectedDoctor
    ? selectedDoctor.specialization
    : "Consultation";
  const dateValue = document.getElementById("date").value || "—";
  const timeValue =
    document.getElementById("time").selectedOptions?.[0]?.textContent || "—";

  const paymentUrl = `payment.html?doctor_id=${encodeURIComponent(doctorId)}&avail_id=${encodeURIComponent(availId)}&reason=${encodeURIComponent(reason)}&doctor_name=${encodeURIComponent(doctorName)}&specialization=${encodeURIComponent(specialization)}&date=${encodeURIComponent(dateValue)}&time=${encodeURIComponent(timeValue)}`;

  window.location.href = paymentUrl;
}

function closePaymentPanel() {
  const panel = document.getElementById("paymentPanel");
  if (panel) panel.classList.add("hidden");
  notifyParentResize();
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

async function getSameDayBookingConflict(dateStr, excludeAppointmentId = null) {
  if (!dateStr) return null;
  try {
    const r = await fetch(
      `${API_BASE}/patient/appointments_by_day.php?date=${encodeURIComponent(dateStr)}`,
      { credentials: "include" },
    );
    const j = await r.json();
    if (j.status !== "success" || !Array.isArray(j.data)) return null;

    const conflict = j.data.find((apt) => {
      const status = String(apt.status || "").toLowerCase();
      const isCancelled = status === "cancelled";
      const sameAsEdited =
        excludeAppointmentId != null &&
        Number(apt.appointment_id) === Number(excludeAppointmentId);
      return !isCancelled && !sameAsEdited;
    });
    return conflict || null;
  } catch (err) {
    console.error("Conflict check failed:", err);
    return null;
  }
}

async function startKhaltiPayment() {
  if (!pendingBookingRequest) {
    setPaymentStatusMessage(
      "No booking data found. Please submit the form again.",
      "error",
    );
    return;
  }

  const proceedBtn = document.getElementById("proceedPaymentBtn");
  if (proceedBtn) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Redirecting to Khalti...";
  }

  setPaymentStatusMessage("Creating a secure payment request...", "info");

  // Open the new tab IMMEDIATELY to bypass popup blockers (user activation context)
  const khaltiWindow = window.open('about:blank', '_blank');

  try {
    const r = await fetch(`${API_BASE}/patient/khalti_payment_init.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: String(pendingBookingRequest.doctorId).trim(),
        avail_id: parseInt(pendingBookingRequest.availId) || 0,
        reason_for_visit: String(pendingBookingRequest.description).trim(),
      }),
    });

    if (r.status === 504 || r.status === 502) {
      throw new Error("Khalti server timeout (Maintenance). Please try again in a moment.");
    }

    if (!r.ok) {
      throw new Error("Payment server error (" + r.status + ").");
    }

    const j = await r.json();

    if (j.status !== "success") {
      setPaymentStatusMessage(
        j.message || "Could not start Khalti payment.",
        "error",
      );
      if (
        /already have an appointment|same day/i.test(String(j.message || ""))
      ) {
        setBookingConflictMessage(j.message);
      }
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent = "Continue to Khalti";
      }
      if (khaltiWindow) khaltiWindow.close();
      return;
    }

    setPaymentStatusMessage(
      "Redirecting to Khalti for payment verification...",
      "success",
    );

    // Redirect the already-opened new tab to Khalti
    if (khaltiWindow) {
      khaltiWindow.location.href = j.payment_url;
    } else {
      window.open(j.payment_url, "_blank");
    }

    if (!khaltiWindow) {
      setPaymentStatusMessage(
        "Could not open payment tab. Please check popup blocker.",
        "error",
      );
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.textContent = "Continue to Khalti";
      }
      return;
    }

    // Poll to check if payment was completed
    // Callback page will postMessage back to us, but we also check periodically
    let checkCount = 0;
    const checkInterval = setInterval(async () => {
      checkCount++;
      // Check if payment tab was closed by user
      if (khaltiWindow.closed) {
        clearInterval(checkInterval);
        setPaymentStatusMessage(
          "Payment tab closed. Checking payment status...",
          "info",
        );
        // Wait a bit longer for backend to update payment status
        setTimeout(() => {
          parent.postMessage(
            {
              type: "payment-result",
              status: "checking", // Will reload appointments on parent side
            },
            "*",
          );
        }, 2000); // Increased delay to 2 seconds for reliability
        return;
      }
      // Stop checking after 5 minutes
      if (checkCount > 300) {
        clearInterval(checkInterval);
      }
    }, 1000);
  } catch (err) {
    console.error(err);
    setPaymentStatusMessage(
      "Something went wrong while starting the payment.",
      "error",
    );
    if (proceedBtn) {
      proceedBtn.disabled = false;
      proceedBtn.textContent = "Continue to Khalti";
    }
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
  const doctorSel = document.getElementById("doctor");

  // Reset
  doctorSel.value = "";
  selectedDoctor = null;
  document.getElementById("totalPrice").textContent = "—";
  document.getElementById("date").innerHTML = '<option value="">Select doctor first</option>';
  document.getElementById("time").innerHTML = '<option value="">Select date first</option>';

  if (!spec) { wrap.classList.add("hidden"); return; }

  const filtered = doctorsList.filter((d) => (d.specialization || "General") === spec);
  doctorSel.innerHTML = '<option value="">Select doctor</option>';
  filtered.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.doctor_id;
    opt.textContent = d.full_name;
    doctorSel.appendChild(opt);
  });

  wrap.classList.remove("hidden");
  notifyParentResize();
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
  const doctorSel = document.getElementById("doctor");
  doctorSel.value = String(a.doctor_id);
  doctorSel.disabled = true;
  doctorSel.style.opacity = "0.7";
  doctorSel.style.cursor = "not-allowed";
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
const backToFormBtn = document.getElementById("backToFormBtn");
const proceedPaymentBtn = document.getElementById("proceedPaymentBtn");

window.addEventListener("message", (event) => {
  if (!event.data) return;

  // Handle reschedule context from parent dashboard
  if (event.data.type === "START_RESCHEDULE" && event.data.appointment_id) {
    const sel = document.getElementById("doctor");
    if (sel && sel.options.length > 1) {
      loadRescheduleContext(event.data.appointment_id);
    } else {
      _pendingRescheduleId = event.data.appointment_id;
    }
  }

  // Forward payment result from Khalti callback to parent dashboard
  if (event.data.type === "payment-result") {
    console.log(
      "Payment result received in booking iframe, forwarding to parent:",
      event.data,
    );
    window.parent.postMessage(
      {
        type: "payment-result",
        status: event.data.status,
        title: event.data.title,
        message: event.data.message,
        success: event.data.success,
        appointment_id: event.data.appointment_id,
      },
      "*",
    );
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

backToFormBtn?.addEventListener("click", () => {
  pendingBookingRequest = null;
  closePaymentPanel();
  setPaymentStatusMessage(
    "The payment will be confirmed by Khalti before the appointment is created.",
  );
});

proceedPaymentBtn?.addEventListener("click", startKhaltiPayment);

document.getElementById("specialization").addEventListener("change", () => {
  onSpecializationChange();
});

document.getElementById("doctor").addEventListener("change", async () => {
  const doctorSel = document.getElementById("doctor");
  const doctorId = doctorSel.value;
  if (doctorId) {
    const placeholder = doctorSel.querySelector('option[value=""]');
    if (placeholder) placeholder.remove();
  }
  selectedDoctor = doctorsList.find((d) => d.doctor_id === doctorId) || null;
  document.getElementById("totalPrice").textContent = selectedDoctor
    ? formatMoney(selectedDoctor.consultation_fee)
    : "—";
  await loadDates(doctorId);
  setBookingConflictMessage("");
});

document.getElementById("date").addEventListener("change", async () => {
  const doctorId = document.getElementById("doctor").value;
  const dateStr = document.getElementById("date").value;
  await loadSlots(doctorId, dateStr);

  const confirmBtn = document.getElementById("confirmBtn");
  if (!confirmBtn || !dateStr) {
    setBookingConflictMessage("");
    return;
  }

  const conflict = await getSameDayBookingConflict(
    dateStr,
    rescheduleAppointmentId,
  );
  if (conflict) {
    const doctorName = conflict.doctor_name || "another doctor";
    confirmBtn.disabled = true;
    confirmBtn.classList.add("opacity-60", "cursor-not-allowed");
    confirmBtn.title = `You already have an appointment with ${doctorName} on this date.`;
    setBookingConflictMessage(
      `You already have an appointment with ${doctorName} on this date. Please choose a different date.`,
    );
  } else {
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("opacity-60", "cursor-not-allowed");
    confirmBtn.title = "";
    setBookingConflictMessage("");
  }
});

document.getElementById("time").addEventListener("change", () => {
  const v = document.getElementById("time").value;
  document.getElementById("availId").value = v || "";
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
    pendingBookingRequest = {
      doctorId,
      availId,
      description,
    };
    openPaymentPanel();
    return;
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
      const j = await r.json();
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
    closePaymentPanel();

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
