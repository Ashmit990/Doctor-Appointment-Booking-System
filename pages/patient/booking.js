let doctorsList = [];
let selectedDoctor = null;
let rescheduleAppointmentId = null;

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

async function loadDoctors() {
  const r = await fetch(`${API_BASE}/patient/doctors.php`, {
    credentials: "include",
  });
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.message || "Doctors failed");
  doctorsList = j.data || [];
  const sel = document.getElementById("doctor");
  sel.innerHTML = '<option value="">Select doctor</option>';
  doctorsList.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.doctor_id;
    opt.textContent = `${d.full_name} (${d.specialization})`;
    sel.appendChild(opt);
  });
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
    opt.textContent = `${formatTime12h(slot.start_time)} – ${formatTime12h(slot.end_time)}`;
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
  document.getElementById("doctor").value = a.doctor_id;
  updatePrice();
  await loadDates(a.doctor_id);
  document.getElementById("date").value = "";
  document.getElementById("time").innerHTML =
    '<option value="">Select date first</option>';
  document.getElementById("availId").value = "";
  document.getElementById("description").value = a.reason_for_visit || "";
  const btn = document.getElementById("confirmBtn");
  btn.textContent = "Confirm reschedule";
}

const bookingForm = document.getElementById("bookingForm");
const cancelBooking = document.getElementById("cancelBooking");

window.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "START_RESCHEDULE" && event.data.appointment_id) {
    loadRescheduleContext(event.data.appointment_id);
  }
});

cancelBooking.addEventListener("click", () => {
  const patientName = document.getElementById("patientName").value;
  bookingForm.reset();
  document.getElementById("patientName").value = patientName;
  rescheduleAppointmentId = null;
  document.getElementById("confirmBtn").textContent = "Confirm Booking";
  window.parent.postMessage({ type: "booking:close" }, "*");
});

document.getElementById("doctor").addEventListener("change", async () => {
  updatePrice();
  const doctorId = document.getElementById("doctor").value;
  await loadDates(doctorId);
});

document.getElementById("date").addEventListener("change", async () => {
  const doctorId = document.getElementById("doctor").value;
  const dateStr = document.getElementById("date").value;
  await loadSlots(doctorId, dateStr);
});

document.getElementById("time").addEventListener("change", () => {
  const v = document.getElementById("time").value;
  document.getElementById("availId").value = v || "";
});

// Close success modal
document.getElementById("closeSuccessModal").addEventListener("click", () => {
  document.getElementById("successModal").classList.add("hidden");
  window.parent.postMessage({ type: "patient-booking-done" }, "*");
});

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // --- Profile completion check ---
  try {
    const profileRes = await fetch(`${API_BASE}/patient/profile.php`, { credentials: "include" });
    const profileJson = await profileRes.json();
    if (profileJson.status === "success" && profileJson.data) {
      const p = profileJson.data;
      const fields = [
        p.full_name, p.email, p.contact_number,
        p.age, p.gender, p.blood_group, p.address,
        p.emergency_contact_name, p.emergency_contact_phone
      ];
      const complete = fields.every(f => f !== null && f !== undefined && String(f).trim() !== "");
      if (!complete) {
        // Notify parent dashboard to show popup and redirect
        if (window.self !== window.top) {
          window.parent.postMessage({ type: "profile-incomplete-redirect" }, "*");
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

  if (!doctorId || !availId) {
    alert("Please choose doctor, date, and an available time slot.");
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
        alert("Booking did not save correctly (no appointment id). Check the server log or try again.");
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
      document.getElementById("patientName").value = me.data.full_name || "";
    }
    await loadDoctors();
    updatePrice();
  } catch (e) {
    console.error(e);
    document.getElementById("doctor").innerHTML =
      '<option value="">Could not load doctors</option>';
  }
})();
