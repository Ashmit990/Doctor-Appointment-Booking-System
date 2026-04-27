let scheduleMonth = new Date(2026, 3); // April 2026
let selectedScheduleDate = null;
let currentEditAvailId = null;

function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("current-date").textContent =
    new Date().toLocaleDateString("en-US", options);
}

async function loadDoctorProfile() {
  const response = await fetch("../../api/doctor/get_doctor_info.php", {
    credentials: 'include'
  });
  const result = await response.json();

  if (result.status === "success" && result.data) {
    const nameElement = document.getElementById("sidebar-doctor-name");
    if (nameElement) {
      nameElement.textContent = result.data.full_name || "Doctor";
    }
  }
}

async function fetchAppointmentDates() {
  const response = await fetch("../../api/doctor/appointment_dates.php", {
    credentials: 'include'
  });
  const result = await response.json();

  if (result.status === "success" && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

async function fetchAppointmentDatesForSchedule() {
  const response = await fetch("../../api/doctor/appointments.php", {
    credentials: 'include'
  });
  const result = await response.json();

  if (result.status === "success" && Array.isArray(result.data)) {
    // Extract unique dates from appointments
    const dates = new Set();
    result.data.forEach((apt) => {
      if (apt.app_date) dates.add(apt.app_date);
    });
    return Array.from(dates);
  }
  return [];
}

async function fetchCompletedAppointmentsForSchedule() {
  const response = await fetch("../../api/doctor/completed_appointments.php", {
    credentials: 'include'
  });
  const result = await response.json();

  if (result.status === "success") {
    return result.dates || [];
  }
  return [];
}

function renderScheduleCalendar() {
  const year = scheduleMonth.getFullYear();
  const month = scheduleMonth.getMonth();

  document.getElementById("schedule-calendar-month").textContent =
    scheduleMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fetch both appointment dates and completed appointments for this month
  Promise.all([fetchAppointmentDatesForSchedule(), fetchCompletedAppointmentsForSchedule()]).then(([appointmentDates, completedDates]) => {
    const daysContainer = document.getElementById("schedule-calendar-days");
    daysContainer.innerHTML = "";
    // Create a Set of dates for this month/year only
    const targetYear = year;
    const targetMonth = month + 1; // Convert from 0-11 to 1-12

    const datesThisMonth = new Set();
    const completedDatesThisMonth = new Set();

    appointmentDates.forEach((dateStr) => {
      const parts = dateStr.trim().split("-");
      if (parts.length === 3) {
        const dateYear = parseInt(parts[0]);
        const dateMonth = parseInt(parts[1]);
        const dateDay = parseInt(parts[2]);

        // Only add if it matches this year AND this month
        if (dateYear === targetYear && dateMonth === targetMonth) {
          datesThisMonth.add(dateDay);
        }
      }
    });

    completedDates.forEach((dateStr) => {
      const parts = dateStr.trim().split("-");
      if (parts.length === 3) {
        const dateYear = parseInt(parts[0]);
        const dateMonth = parseInt(parts[1]);
        const dateDay = parseInt(parts[2]);

        // Only add if it matches this year AND this month
        if (dateYear === targetYear && dateMonth === targetMonth) {
          completedDatesThisMonth.add(dateDay);
        }
      }
    });

    // Previous month's grayed days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = prevMonthDays - firstDay + 1; i <= prevMonthDays; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "calendar-day text-gray-300 rounded-lg";
      dayDiv.textContent = i;
      daysContainer.appendChild(dayDiv);
    }

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

    // Current month dates
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.className =
        "calendar-day cursor-pointer hover:bg-primary-light rounded-lg";
      dayDiv.textContent = i;

      // Add green checkmark if doctor has completed appointments for this date
      if (completedDatesThisMonth.has(i)) {
        dayDiv.classList.add("has-completed");
      }
      // Add red dot if doctor has set availability for this date (but not completed)
      else if (datesThisMonth.has(i)) {
        dayDiv.classList.add("has-appointment");
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      
      if (dateStr < todayStr) {
        dayDiv.style.color = "#d1d5db";
      } else if (dateStr === todayStr) {
        dayDiv.style.backgroundColor = "#007E85";
        dayDiv.style.color = "white";
      }

      dayDiv.onclick = () => selectScheduleDate(dateStr);

      daysContainer.appendChild(dayDiv);
    }

    // Next month's grayed days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "calendar-day text-gray-300 rounded-lg";
      dayDiv.textContent = i;
      daysContainer.appendChild(dayDiv);
    }
  });
}

const FIX_SLOTS = [
  {
    start: "09:00:00",
    end: "10:00:00",
    label: "09:00 AM - 10:00 AM",
    isLunch: false,
  },
  {
    start: "10:00:00",
    end: "11:00:00",
    label: "10:00 AM - 11:00 AM",
    isLunch: false,
  },
  {
    start: "11:00:00",
    end: "12:00:00",
    label: "11:00 AM - 12:00 PM",
    isLunch: false,
  },
  {
    start: "12:00:00",
    end: "13:00:00",
    label: "12:00 PM - 01:00 PM",
    isLunch: false,
  },
  {
    start: "13:00:00",
    end: "14:00:00",
    label: "01:00 PM - 02:00 PM",
    isLunch: true,
  },
  {
    start: "14:00:00",
    end: "15:00:00",
    label: "02:00 PM - 03:00 PM",
    isLunch: false,
  },
  {
    start: "15:00:00",
    end: "16:00:00",
    label: "03:00 PM - 04:00 PM",
    isLunch: false,
  },
  {
    start: "16:00:00",
    end: "17:00:00",
    label: "04:00 PM - 05:00 PM",
    isLunch: false,
  },
];

function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

async function selectScheduleDate(date) {
  selectedScheduleDate = date;

  // Update display
  const dateObj = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dateDisplay = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  document.getElementById("schedule-date-display").textContent = dateDisplay;

  renderScheduleCalendar(); // re-render to update selected state style
  await loadScheduleForDate(date);
}

function selectToday() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  scheduleMonth = new Date(today.getFullYear(), today.getMonth());
  selectScheduleDate(dateStr);
}

let storedAppointmentsForModal = [];

async function loadScheduleForDate(date) {
  const gridContainer = document.getElementById("daily-schedule-grid");
  gridContainer.style.opacity = "0.5";
  gridContainer.style.transition = "opacity 0.2s ease-in-out";

  try {
    // Fetch Parallel
    const [availRes, aptRes] = await Promise.all([
      fetch(`../../api/doctor/availability.php?date=${date}`, { credentials: 'include' }),
      fetch(`../../api/doctor/appointments_by_date.php?date=${date}`, { credentials: 'include' }),
    ]);

    const availData = await availRes.json();
    const aptData = await aptRes.json();

    const availability = availData.status === "success" ? availData.data : [];
    const appointments = aptData.status === "success" ? aptData.data : [];
    storedAppointmentsForModal = appointments;

    // Compare date with today to disable past slots
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isPastDay = date < todayStr;
    const isToday = date === todayStr;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    gridContainer.style.opacity = "1";
    gridContainer.innerHTML = "";

    FIX_SLOTS.forEach((slot) => {
      let slotIsPast = isPastDay;
      if (isToday) {
        const [h, m] = slot.start.split(":").map(Number);
        if (h < currentHour || (h === currentHour && m < currentMinute)) {
          slotIsPast = true;
        }
      }

      // Check Lunch
      if (slot.isLunch) {
        gridContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <div class="flex items-center gap-3">
                            <i data-lucide="book-open" class="text-orange-500 w-5 h-5"></i>
                            <span class="font-medium text-orange-700">${slot.label}</span>
                        </div>
                        <span class="font-semibold text-orange-600 tracking-wide uppercase text-sm">Lunch Break</span>
                    </div>`;
        return;
      }

      // Check Appointment
      const apt = appointments.find((a) => a.appointment_time === slot.start);
      if (apt) {
        if (apt.status === "Completed") {
          gridContainer.innerHTML += `
                        <div onclick="openAppointmentModal(${apt.apt_id})" class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition shadow-sm">
                            <div class="flex items-center gap-3">
                                <i data-lucide="check-circle" class="text-gray-500 w-5 h-5"></i>
                                <div>
                                    <span class="font-semibold text-gray-500 line-through">${slot.label}</span>
                                    <p class="text-xs text-gray-400 mt-0.5">Patient: ${apt.patient_name}</p>
                                </div>
                            </div>
                            <span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Completed</span>
                        </div>`;
        } else {
          gridContainer.innerHTML += `
                        <div onclick="openAppointmentModal(${apt.apt_id})" class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition shadow-sm">
                            <div class="flex items-center gap-3">
                                <i data-lucide="user" class="text-blue-600 w-5 h-5"></i>
                                <div>
                                    <span class="font-semibold text-blue-900">${slot.label}</span>
                                    <p class="text-sm font-medium text-blue-700 mt-0.5">${apt.patient_name} <span class="opacity-75 font-normal ml-1">(${apt.status})</span></p>
                                </div>
                            </div>
                            <button class="bg-white border border-blue-200 text-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">View Details</button>
                        </div>`;
        }
        return;
      }

      // Check Availability (OPEN vs BLOCKED vs CLOSED)
      const avail = availability.find((a) => a.start_time === slot.start);

      if (avail && avail.status === 'Available') {
        // OPEN slot
        gridContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border-2 border-green-400 rounded-xl shadow-sm hover:border-green-500 transition">
                        <div class="flex items-center gap-3">
                            <i data-lucide="clock" class="text-green-500 w-5 h-5"></i>
                            <div>
                                <span class="font-bold text-gray-900">${slot.label}</span>
                                <p class="text-xs text-green-600 font-medium mt-0.5">Available for booking</p>
                            </div>
                        </div>
                        <button onclick="toggleSlot('${slot.start}', '${slot.end}', ${avail.avail_id}, ${slotIsPast})" class="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${slotIsPast ? "opacity-50 cursor-not-allowed" : ""}">
                            Block Slot
                        </button>
                    </div>`;
      } else if (avail && avail.status === 'Closed') {
        // CLOSED slot (past time)
        gridContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl opacity-60">
                        <div class="flex items-center gap-3">
                            <i data-lucide="clock-off" class="text-red-400 w-5 h-5"></i>
                            <div>
                                <span class="font-medium text-red-600">${slot.label}</span>
                                <p class="text-xs text-red-500 mt-0.5">Slot closed (past time)</p>
                            </div>
                        </div>
                    </div>`;
      } else {
        // BLOCKED slot
        gridContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <div class="flex items-center gap-3">
                            <i data-lucide="lock" class="text-gray-400 w-5 h-5"></i>
                            <div>
                                <span class="font-medium text-gray-500">${slot.label}</span>
                                <p class="text-xs text-gray-400 mt-0.5">Unavailable</p>
                            </div>
                        </div>
                        <button onclick="toggleSlot('${slot.start}', '${slot.end}', null, ${slotIsPast})" class="bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm ${slotIsPast ? "opacity-50 cursor-not-allowed" : ""}">
                            Open Slot
                        </button>
                    </div>`;
      }
    });
    lucide.createIcons();
  } catch (e) {
    gridContainer.style.opacity = "1";
    gridContainer.innerHTML =
      '<div class="text-center py-12 text-red-500"><p>Failed to load slots. Please try again.</p></div>';
  }
}

async function toggleSlot(startTime, endTime, availId, isPast) {
  if (isPast) {
    alert("You cannot modify availability for past dates!");
    return;
  }
  const date = selectedScheduleDate;

  if (availId) {
    // DELETE
    const response = await fetch(
      `../../api/doctor/availability.php?avail_id=${availId}`,
      { 
        method: "DELETE",
        credentials: "include"
      },
    );
    const result = await response.json();
    if (result.status === "success") {
      loadScheduleForDate(date);
    } else {
      alert("Error blocking slot: " + result.message);
    }
  } else {
    // POST
    const response = await fetch("../../api/doctor/availability.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avail_date: date,
        start_time: startTime,
        end_time: endTime,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      loadScheduleForDate(date);
    } else {
      alert("Error opening slot: " + result.message);
    }
  }
}

function toggleFollowUpVisibility() {
  const st = document.getElementById("modal-edit-status").value;
  const bSection = document.getElementById("complete-consultation-btn");
  // Keep followup section always visible - don't hide it based on status
  if (st === "Completed") {
    bSection.innerHTML =
      '<i data-lucide="check-circle" class="w-5 h-5"></i> Complete Consultation';
  } else {
    bSection.innerHTML =
      '<i data-lucide="save" class="w-5 h-5"></i> Save Changes';
  }
  lucide.createIcons();
}

let fetchedAvailability = [];

window.updateFollowupTimes = function() {
    const dateSelect = document.getElementById("modal-followup-date");
    const timeSelect = document.getElementById("modal-followup-time");
    const selectedDate = dateSelect.value;
    
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">-- Select Date First --</option>';
        timeSelect.disabled = true;
        return;
    }
    
    timeSelect.innerHTML = '<option value="">-- Select Time Slot --</option>';
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
    
    // Filter available slots for this date
    const slotsForDate = fetchedAvailability.filter(slot => {
        if (slot.available_date !== selectedDate) return false;
        if (selectedDate === todayStr && slot.start_time <= currentTimeStr) return false;
        return true;
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    if (slotsForDate.length > 0) {
        slotsForDate.forEach(slot => {
            timeSelect.innerHTML += `<option value="${slot.start_time}">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</option>`;
        });
        timeSelect.disabled = false;
    } else {
        timeSelect.innerHTML = '<option value="">-- No Times Available --</option>';
        timeSelect.disabled = true;
    }
};

async function openAppointmentModal(aptId) {
  const apt = storedAppointmentsForModal.find((a) => a.apt_id == aptId);
  if (!apt) return;

  document.getElementById("modal-patient-name").textContent =
    apt.patient_name || "Unknown Patient";
  document.getElementById("modal-patient-id").textContent = apt.patient_id
    ? `#${apt.patient_id}`
    : "-";
  document.getElementById("modal-contact").textContent =
    apt.contact_number || "-";

  const timeSegment = `${formatTime12h(apt.appointment_time)}`;
  document.getElementById("modal-apt-time").textContent = timeSegment;

  document.getElementById("modal-blood-group").textContent =
    apt.blood_group || "-";
  document.getElementById("modal-status-text").textContent = apt.status;

  document.getElementById("modal-reason").textContent =
    apt.reason_for_visit || "No reason provided.";

  // Manage Workspace Mode
  document.getElementById("consultation-workspace").classList.remove("hidden");

  const statusSelectWrapper = document.getElementById("edit-status-wrapper");
  const statusSelect = document.getElementById("modal-edit-status");
  const notesInput = document.getElementById("modal-doctor-notes");
  const rxInput = document.getElementById("modal-prescriptions");
  const followupInputs = document.getElementById("followup-section");
  const notesReadonly = document.getElementById("readonly-doctor-notes");
  const rxReadonly = document.getElementById("readonly-prescriptions");
  const feedbackSec = document.getElementById("feedback-section");
  const completeBtn = document.getElementById("complete-consultation-btn");
  const appointmentLockMsg = document.getElementById("appointment-lock-message") || createLockMessage();

  completeBtn.dataset.aptId = apt.apt_id;

  // Check if appointment has started
  const appointmentDateTime = new Date(`${apt.app_date}T${apt.appointment_time}`);
  const now = new Date();
  const hasAppointmentStarted = now >= appointmentDateTime;

  if (apt.status === "Completed") {
    // Read-only Mode - Already Completed
    statusSelectWrapper.classList.add("hidden");
    notesInput.classList.add("hidden");
    rxInput.classList.add("hidden");
    completeBtn.classList.add("hidden");
    appointmentLockMsg.classList.add("hidden");

    notesReadonly.classList.remove("hidden");
    rxReadonly.classList.remove("hidden");

    notesReadonly.textContent = apt.doctor_comments || apt.doctor_notes || "No notes provided.";
    rxReadonly.textContent = apt.prescribed_medicines || apt.prescriptions || "No prescriptions provided.";

    if (apt.feedback && apt.feedback.trim() !== "") {
      feedbackSec.classList.remove("hidden");
      document.getElementById("readonly-feedback").textContent = `"${apt.feedback}"`;
    } else {
      feedbackSec.classList.add("hidden");
    }
  } else if (!hasAppointmentStarted) {
    // Lock Mode - Appointment hasn't started yet
    statusSelectWrapper.classList.add("hidden");
    notesInput.classList.add("hidden");
    rxInput.classList.add("hidden");
    completeBtn.classList.add("hidden");
    
    notesReadonly.classList.remove("hidden");
    rxReadonly.classList.remove("hidden");
    
    notesReadonly.textContent = "Appointment editing is locked until the appointment time starts.";
    rxReadonly.textContent = "You can edit this appointment starting from " + new Date(appointmentDateTime).toLocaleString();
    
    appointmentLockMsg.classList.remove("hidden");
    appointmentLockMsg.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        <div class="flex items-start gap-2">
          <i data-lucide="lock" class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"></i>
          <div>
            <p class="font-semibold text-amber-900 text-sm">Appointment Not Yet Started</p>
            <p class="text-amber-800 text-xs mt-1">This appointment is scheduled for <strong>${new Date(appointmentDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> at <strong>${new Date(appointmentDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>.</p>
            <p class="text-amber-800 text-xs mt-1">You can edit consultation details only after the appointment starts.</p>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    feedbackSec.classList.add("hidden");
  } else {
    // Edit Mode (Upcoming or Missed) - Appointment has started
    statusSelectWrapper.classList.remove("hidden");
    notesInput.classList.remove("hidden");
    rxInput.classList.remove("hidden");
    completeBtn.classList.remove("hidden");
    appointmentLockMsg.classList.add("hidden");

    notesReadonly.classList.add("hidden");
    rxReadonly.classList.add("hidden");
    feedbackSec.classList.add("hidden");

    statusSelect.value = apt.status === "Upcoming" ? "Upcoming" : apt.status;
    notesInput.value = apt.doctor_comments || apt.doctor_notes || "";
    rxInput.value = apt.prescribed_medicines || apt.prescriptions || "";
    document.getElementById("modal-followup-time").value = "";
    document.getElementById("followup-date-error").classList.add("hidden");
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    // Fetch doctor's configured schedules to populate follow-up date select
    try {
        const availRes = await fetch('../../api/doctor/availability.php', { credentials: 'include' });
        const availData = await availRes.json();
        
        const fDateSelect = document.getElementById("modal-followup-date");
        fDateSelect.innerHTML = '<option value="">-- Select Date --</option>';
        
        const fTimeSelect = document.getElementById("modal-followup-time");
        fTimeSelect.innerHTML = '<option value="">-- Select Date First --</option>';
        fTimeSelect.disabled = true;
        
        if (availData.status === 'success' && availData.data) {
            // Save globally for time filtering
            fetchedAvailability = availData.data.filter(slot => slot.status === 'Available');
            
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();
            const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

            // Filter out slots that are in the past
            const validSlots = fetchedAvailability.filter(slot => {
                if (slot.available_date > todayStr) return true;
                if (slot.available_date === todayStr && slot.start_time > currentTimeStr) return true;
                return false;
            });
            
            // Get unique future dates
            const uniqueDates = [...new Set(validSlots.map(slot => slot.available_date))].sort();
            
            if (uniqueDates.length > 0) {
                uniqueDates.forEach(date => {
                    const dateObj = new Date(date + "T00:00:00");
                    const dateDisplay = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                    fDateSelect.innerHTML += `<option value="${date}">${dateDisplay}</option>`;
                });
                document.getElementById("followup-section").classList.remove("hidden");
            } else {
                document.getElementById("followup-section").classList.add("hidden");
            }
        } else {
            fetchedAvailability = [];
            document.getElementById("followup-section").classList.add("hidden");
        }
    } catch (e) {
        console.error("Failed to fetch availability:", e);
        fetchedAvailability = [];
        document.getElementById("followup-section").classList.add("hidden");
    }
    
    toggleFollowUpVisibility();
  }

  document.getElementById("appointment-modal").classList.remove("hidden");
  
  // Load patient history
  loadPatientHistory(apt.patient_id);
}

// Helper function to create lock message container if it doesn't exist
function createLockMessage() {
  let lockMsg = document.getElementById("appointment-lock-message");
  if (!lockMsg) {
    lockMsg = document.createElement("div");
    lockMsg.id = "appointment-lock-message";
    const consultationWorkspace = document.getElementById("consultation-workspace");
    consultationWorkspace.insertBefore(lockMsg, consultationWorkspace.firstChild);
  }
  return lockMsg;
}

async function submitConsultation() {
  const aptId = document.getElementById("complete-consultation-btn").dataset
    .aptId;
  const statusVal = document.getElementById("modal-edit-status").value.trim();
  const notes = document.getElementById("modal-doctor-notes").value.trim();
  const rx = document.getElementById("modal-prescriptions").value.trim();
  const fDate = document.getElementById("modal-followup-date").value;
  const fTime = document.getElementById("modal-followup-time").value;

  // Clear previous error messages
  document.getElementById("status-error").classList.add("hidden");
  document.getElementById("notes-error").classList.add("hidden");
  document.getElementById("prescriptions-error").classList.add("hidden");
  document.getElementById("followup-date-error").classList.add("hidden");

  // Validation
  let hasErrors = false;

  if (!statusVal) {
    document.getElementById("status-error").classList.remove("hidden");
    hasErrors = true;
  }

  if (!notes) {
    document.getElementById("notes-error").classList.remove("hidden");
    hasErrors = true;
  }

  if (!rx) {
    document.getElementById("prescriptions-error").classList.remove("hidden");
    hasErrors = true;
  }

  // Validate follow-up date (if provided, must not be in the past)
  if (fDate) {
    const selectedDate = new Date(fDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      document.getElementById("followup-date-error").classList.remove("hidden");
      hasErrors = true;
    }
  }

  if (hasErrors) {
    alert("Please fill in all required fields (marked with *) and ensure follow-up date is not in the past");
    return;
  }

  const btn = document.getElementById("complete-consultation-btn");
  const oldText = btn.innerHTML;
  btn.innerHTML = "Saving...";
  btn.disabled = true;

  try {
    const res = await fetch("../../api/doctor/complete_consultation.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointment_id: aptId,
        status: statusVal,
        doctor_notes: notes,
        prescriptions: rx,
        followup_date: fDate,
        followup_time: fTime,
      }),
    });

    const data = await res.json();
    if (data.status === "success") {
      closeAppointmentModal();
      loadScheduleForDate(selectedScheduleDate);
    } else {
      alert("Error: " + data.message);
    }
  } catch (e) {
    alert("Exception: " + e.message);
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}

function closeAppointmentModal() {
  document.getElementById("appointment-modal").classList.add("hidden");
}

// Load patient medical history
async function loadPatientHistory(patientId) {
  const historyContent = document.getElementById("history-timeline");
  historyContent.innerHTML = '<p class="text-gray-500 text-center py-4">Loading history...</p>';

  try {
    const res = await fetch(`../../api/doctor/patient_history.php?patient_id=${encodeURIComponent(patientId)}`);
    const data = await res.json();

    if (data.status === 'success' && data.data.length > 0) {
      historyContent.innerHTML = data.data.map(apt => `
        <div class="relative pl-6 border-l-2 border-primary pb-4">
          <div class="absolute w-3 h-3 bg-primary rounded-full -left-1.5 top-1"></div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-semibold text-gray-900 text-xs">${apt.doctor_name || '-'}</p>
                <p class="text-[10px] text-gray-500">${apt.specialization || 'Consultation'}</p>
              </div>
              <span class="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
            </div>
            <p class="text-[10px] text-gray-600 mb-2">📅 ${new Date(apt.app_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${apt.app_time}</p>
            ${apt.reason_for_visit ? `<p class="text-[10px] text-gray-600 mb-2"><strong>Visit:</strong> ${apt.reason_for_visit}</p>` : ''}
            ${apt.doctor_comments ? `<p class="text-[10px] text-gray-700 mb-2 p-2 bg-white rounded border-l-2 border-blue-400"><strong>Notes:</strong> ${apt.doctor_comments}</p>` : ''}
            ${apt.prescribed_medicines ? `<p class="text-[10px] text-gray-700 p-2 bg-white rounded border-l-2 border-green-400"><strong>Medicines:</strong> ${apt.prescribed_medicines}</p>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      historyContent.innerHTML = '<p class="text-gray-500 text-center py-4 text-xs">No completed appointments found</p>';
    }
    
    lucide.createIcons();
  } catch (e) {
    historyContent.innerHTML = '<p class="text-red-500 text-center py-4 text-xs">Error loading history</p>';
  }
}

// Toggle patient history section
function togglePatientHistory() {
  const content = document.getElementById('patient-history-content');
  const icon = document.getElementById('history-toggle-icon');
  
  content.classList.toggle('hidden');
  
  if (content.classList.contains('hidden')) {
    icon.setAttribute('data-lucide', 'chevron-down');
  } else {
    icon.setAttribute('data-lucide', 'chevron-up');
  }
  
  lucide.createIcons();
}


function prevMonthSchedule() {
  scheduleMonth.setMonth(scheduleMonth.getMonth() - 1);
  renderScheduleCalendar();
}

function nextMonthSchedule() {
  scheduleMonth.setMonth(scheduleMonth.getMonth() + 1);
  renderScheduleCalendar();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  loadDoctorProfile();
  renderScheduleCalendar();
  lucide.createIcons();
});

// Check session when page becomes visible (e.g., on back button)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Verify session by checking if user is still logged in
    const response = await fetch('../../api/auth/session_info.php', { credentials: 'include' });
    const data = await response.json();
    if (!data.logged_in || data.role !== 'Doctor') {
      window.location.href = '../auth/login.html';
    }
  }
});
