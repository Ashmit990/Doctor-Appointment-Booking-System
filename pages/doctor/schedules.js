const _now = new Date();
let scheduleMonth = new Date(_now.getFullYear(), _now.getMonth(), 1);
let selectedScheduleDate = null;
let currentEditAvailId = null;
let pendingDeleteAction = null;

// Toast notification helper
function showToast(message, type = 'info', duration = 2000) {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(container);
    return container;
  })();

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#007E85' : type === 'error' ? '#ef4444' : '#3b82f6';
  const slideOutDelay = (duration - 300) / 1000;
  toast.style.cssText = `background-color: ${bgColor}; color: white; padding: 12px 16px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease, slideOut 0.3s ease ${slideOutDelay}s forwards; min-width: 250px;`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toastContainer.contains(toast)) {
      toastContainer.removeChild(toast);
    }
  }, duration);
}

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

  // Fetch appointment dates with completion status
  fetch("../../api/doctor/appointment_dates_completion_status.php?t=" + new Date().getTime())
    .then(response => response.json())
    .then(result => {
      const daysContainer = document.getElementById("schedule-calendar-days");
      daysContainer.innerHTML = "";
      // Create a Set of dates for this month/year only
      const targetYear = year;
      const targetMonth = month + 1; // Convert from 0-11 to 1-12

      const allCompletedDatesThisMonth = new Set();
      const hasPendingDatesThisMonth = new Set();

      // Process all_completed dates (where ALL appointments are completed)
      if (result.status === 'success' && result.data && Array.isArray(result.data.all_completed)) {
        result.data.all_completed.forEach((dateStr) => {
          const parts = dateStr.trim().split("-");
          if (parts.length === 3) {
            const dateYear = parseInt(parts[0]);
            const dateMonth = parseInt(parts[1]);
            const dateDay = parseInt(parts[2]);

            // Only add if it matches this year AND this month
            if (dateYear === targetYear && dateMonth === targetMonth) {
              allCompletedDatesThisMonth.add(dateDay);
            }
          }
        });
      }

      // Process has_pending dates (where there are any pending appointments)
      if (result.status === 'success' && result.data && Array.isArray(result.data.has_pending)) {
        result.data.has_pending.forEach((dateStr) => {
          const parts = dateStr.trim().split("-");
          if (parts.length === 3) {
            const dateYear = parseInt(parts[0]);
            const dateMonth = parseInt(parts[1]);
            const dateDay = parseInt(parts[2]);

            // Only add if it matches this year AND this month
            if (dateYear === targetYear && dateMonth === targetMonth) {
              hasPendingDatesThisMonth.add(dateDay);
            }
          }
        });
      }

      // Previous month's grayed days
      const prevMonthDays = new Date(year, month, 0).getDate();
      for (let i = prevMonthDays - firstDay + 1; i <= prevMonthDays; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day text-gray-300 rounded-md";
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
      }

      const todayObj = new Date();
      const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

      // Current month dates
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day cursor-pointer rounded-md";
        dayDiv.textContent = i;

        // Add green checkmark if ALL appointments for this date are completed
        if (allCompletedDatesThisMonth.has(i)) {
          dayDiv.classList.add("has-completed");
        }
        // Add red dot if there are any pending appointments for this date
        else if (hasPendingDatesThisMonth.has(i)) {
          dayDiv.classList.add("has-appointment");
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        
        // Mark selected date and today's date
        if (dateStr === todayStr) {
          dayDiv.classList.add('selected');
          dayDiv.style.backgroundColor = "#007E85";
          dayDiv.style.color = "white";
          dayDiv.style.fontWeight = "bold";
          dayDiv.style.borderRadius = "10px";
        } else if (dateStr === selectedScheduleDate) {
          dayDiv.classList.add('selected');
          dayDiv.style.backgroundColor = "#0a9db5";
          dayDiv.style.color = "white";
          dayDiv.style.fontWeight = "bold";
          dayDiv.style.borderRadius = "10px";
          dayDiv.style.boxShadow = "0 4px 12px rgba(0, 126, 133, 0.25)";
        } else if (dateStr < todayStr) {
          dayDiv.style.color = "#d1d5db";
        }

        dayDiv.onclick = () => selectScheduleDate(dateStr);

        daysContainer.appendChild(dayDiv);
      }

      // Next month's grayed days
      const remainingDays = 42 - (firstDay + daysInMonth);
      for (let i = 1; i <= remainingDays; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day text-gray-300 rounded-md";
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
      }

      updateScheduleInsights(selectedScheduleDate, [], []);
    });
}

function updateScheduleInsights(date, availability = [], appointments = []) {
  const titleEl = document.getElementById("schedule-insight-title");
  const copyEl = document.getElementById("schedule-insight-copy");
  const openEl = document.getElementById("insight-open-slots");
  const bookedEl = document.getElementById("insight-booked-slots");
  const fillEl = document.getElementById("insight-fill-rate");

  if (!titleEl || !copyEl || !openEl || !bookedEl || !fillEl) return;

  if (!date) {
    titleEl.textContent = "Select a date to see your flow";
    copyEl.textContent = "Your daily schedule summary will appear here.";
    openEl.textContent = "--";
    bookedEl.textContent = "--";
    fillEl.textContent = "--%";
    return;
  }

  const openCount = availability.filter((slot) => slot.status === "Available").length;
  const bookedCount = appointments.filter((apt) => apt.status !== "Completed").length;
  const completedCount = appointments.filter((apt) => apt.status === "Completed").length;
  const totalCount = availability.length || (bookedCount + completedCount);
  const fillRate = totalCount > 0 ? Math.round((bookedCount / totalCount) * 100) : 0;

  titleEl.textContent = `${bookedCount} booked appointment${bookedCount === 1 ? "" : "s"} on this day`;
  copyEl.textContent = totalCount > 0
    ? `${openCount} open slot${openCount === 1 ? "" : "s"} remain, with ${completedCount} completed consultation${completedCount === 1 ? "" : "s"}.`
    : "No schedule data was found for this date yet.";
  openEl.textContent = String(openCount);
  bookedEl.textContent = String(bookedCount);
  fillEl.textContent = `${fillRate}%`;
}

function jumpToTodaySchedule() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  scheduleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectScheduleDate(dateStr);
}



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

  // Calculate and display week info
  const startOfWeek = new Date(dateObj);
  const dayOfWeek = dateObj.getDay();
  startOfWeek.setDate(dateObj.getDate() - dayOfWeek); // Start from Sunday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
  
  const weekDisplay = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  
  document.getElementById("schedule-date-display").textContent = `${dateDisplay}`;

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
    fetchedAvailability = availData.status === "success" ? (availData.data || []) : [];
    updateScheduleInsights(date, availability, appointments);

    // Compare date with today to disable past slots
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isPastDay = date < todayStr;
    const isToday = date === todayStr;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

    const manageBtn = document.getElementById("manage-day-btn");
    if (manageBtn) {
      manageBtn.style.display = "inline-flex";
        if (isPastDay || (isToday && currentHour >= 17)) {
            manageBtn.disabled = true;
            manageBtn.classList.add("opacity-50", "cursor-not-allowed");
            manageBtn.title = "Cannot manage schedule for past dates or after 5 PM";
        } else {
            manageBtn.disabled = false;
            manageBtn.classList.remove("opacity-50", "cursor-not-allowed");
            manageBtn.title = "";
        }
    }

    gridContainer.style.opacity = "1";
    gridContainer.innerHTML = "";

    // Check if there are any custom availability slots (from schedule setup)
    const hasCustomSlots = availability && availability.length > 0;

    if (hasCustomSlots) {
      // Display ALL availability slots from database (including schedule setup slots)
      availability.forEach((slot) => {
        let slotIsPast = isPastDay;
        if (isToday) {
          if (slot.end_time <= currentTimeStr) {
            slotIsPast = true;
          }
        }

        // Check Appointment for this slot
        const apt = appointments.find((a) => a.appointment_time === slot.start_time);
        
        if (apt) {
          // Slot has an appointment
          if (apt.status === "Completed") {
            gridContainer.innerHTML += `
              <div onclick="openAppointmentModal(${apt.apt_id})" class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition shadow-sm text-sm">
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="text-gray-500 w-4 h-4"></i>
                  <div>
                    <span class="font-semibold text-gray-500 line-through text-sm">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
                    <p class="text-[10px] text-gray-400 mt-0.5">Patient: ${apt.patient_name}</p>
                  </div>
                </div>
                <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider">Completed</span>
              </div>`;
          } else {
            gridContainer.innerHTML += `
              <div onclick="openAppointmentModal(${apt.apt_id})" class="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-md cursor-pointer hover:border-blue-200 hover:shadow-md transition shadow-sm text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <i data-lucide="user" class="text-blue-700 w-4 h-4"></i>
                  </div>
                  <div>
                    <span class="font-bold text-blue-900 text-sm">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
                    <p class="text-xs font-semibold text-blue-800 mt-0.5">${apt.patient_name} <span class="opacity-80 font-normal ml-1 bg-blue-200 px-1.5 py-0.5 rounded-full text-[9px]">${apt.status}</span></p>
                  </div>
                </div>
                <button class="bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-none whitespace-nowrap ml-2">View Details</button>
              </div>`;
          }
        } else if (slot.status === 'Available') {
          // Available slot (no appointment)
          gridContainer.innerHTML += `
            <div class="flex items-center justify-between p-3 bg-[#007E85]/10 border border-[#007E85]/15 rounded-md shadow-sm hover:border-[#007E85]/20 hover:shadow-md transition text-sm\">
              <div class="flex items-center gap-2\">
                <div class=\"w-8 h-8 bg-[#007E85]/20 rounded-full flex items-center justify-center flex-shrink-0\">
                  <i data-lucide=\"clock\" class=\"text-[#007E85] w-4 h-4\"></i>
                </div>
                <div>
                  <span class=\"font-bold text-gray-900 text-sm\">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
                  <p class=\"text-[10px] text-[#007E85] font-semibold mt-0.5 flex items-center gap-1\"><i data-lucide=\"check\" class=\"w-3 h-3\"></i>Available for booking</p>
                </div>
              </div>
              <button ${slotIsPast ? "disabled" : `onclick="openEditSlotModal('${slot.start_time}', '${slot.end_time}', ${slot.avail_id}, '${slot.status}', ${slotIsPast})"`} class="bg-[#007E85]/15 hover:bg-[#007E85]/20 text-[#007E85] border border-[#007E85]/20 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-none whitespace-nowrap ml-2 ${slotIsPast ? "opacity-50 cursor-not-allowed" : ""}\">
                Edit Slot
              </button>
            </div>`;
        } else if (slot.status === 'Blocked') {
          // Blocked slot
          gridContainer.innerHTML += `
            <div class="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-md hover:border-amber-200 hover:shadow-md transition shadow-sm text-sm\">
              <div class=\"flex items-center gap-2\">
                <div class=\"w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0\">
                  <i data-lucide=\"lock\" class=\"text-yellow-700 w-4 h-4\"></i>
                </div>
                <div>
                  <span class=\"font-bold text-yellow-800 text-sm\">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
                  <p class=\"text-[10px] text-yellow-700 font-semibold mt-0.5 flex items-center gap-1\"><i data-lucide=\"alert-circle\" class=\"w-3 h-3\"></i>Blocked</p>
                </div>
              </div>
              <button ${slotIsPast ? "disabled" : `onclick="openEditSlotModal('${slot.start_time}', '${slot.end_time}', ${slot.avail_id}, '${slot.status}', ${slotIsPast})"`} class="bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-none whitespace-nowrap ml-2 ${slotIsPast ? "opacity-50 cursor-not-allowed" : ""}\">
                Edit Slot
              </button>
            </div>`;
        } else if (slot.status === 'Closed') {
          // Closed slot (past time)
          gridContainer.innerHTML += `
            <div class="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-md opacity-60 text-sm\">
              <div class=\"flex items-center gap-2\">
                <i data-lucide=\"clock-off\" class=\"text-red-400 w-4 h-4\"></i>
                <div>
                  <span class=\"font-medium text-red-600 text-sm\">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
                  <p class=\"text-[10px] text-red-500 mt-0.5\">Slot closed (past time)</p>
                </div>
              </div>
            </div>`;
        }
      });
    } else {
      // No custom slots set - show empty state message
      gridContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-6 text-center">
          <i data-lucide="calendar-x" class="text-gray-400 w-10 h-10 mb-3"></i>
          <p class="text-gray-600 text-base font-medium">No schedule set for this date</p>
          <p class="text-gray-400 text-xs mt-1.5">Please set your weekly schedule from the Home page first</p>
        </div>
      `;
      updateScheduleInsights(date, [], appointments);
    }
    lucide.createIcons();
  } catch (e) {
    console.error('Error loading schedule:', e);
    gridContainer.style.opacity = "1";
    updateScheduleInsights(selectedScheduleDate, [], []);
  }
}

function openEditSlotModal(start, end, availId, status, isPast) {
  if (isPast) {
    alert("You cannot modify availability for past dates!");
    return;
  }
  
  document.getElementById("edit-slot-id").value = availId;
  document.getElementById("edit-slot-start").value = start;
  updateEndTimeOptions("edit-slot-start", "edit-slot-end");
  // ensure end time is set correctly from the option
  
  const statusEl = document.getElementById("edit-slot-status");
  const toggleBtn = document.getElementById("toggle-slot-status-btn");
  
  if (status === 'Available') {
    statusEl.textContent = "Available";
    statusEl.className = "inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#007E85]/15 text-[#007E85]";
    toggleBtn.textContent = "Block Slot";
    toggleBtn.className = "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-4 py-2 rounded-md text-sm font-semibold transition";
  } else {
    statusEl.textContent = "Blocked";
    statusEl.className = "inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800";
    toggleBtn.textContent = "Unblock Slot";
    toggleBtn.className = "bg-[#007E85]/10 text-[#007E85] border border-[#007E85]/20 hover:bg-[#007E85]/15 px-4 py-2 rounded-md text-sm font-semibold transition";
  }
  
  const modal = document.getElementById("edit-slot-modal");
  modal.classList.remove("hidden");
  // Force reflow to trigger animation
  void modal.offsetWidth;
}

function closeEditSlotModal() {
  const modal = document.getElementById("edit-slot-modal");
  modal.classList.add("modal-closing");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-closing");
  }, 300);
}

async function toggleSlotStatusFromModal() {
  const availId = document.getElementById("edit-slot-id").value;
  if (!availId) return;
  
  const response = await fetch(
    `../../api/doctor/availability.php?avail_id=${availId}`,
    { 
      method: "DELETE",
      credentials: "include"
    }
  );
  const result = await response.json();
  if (result.status === "success") {
    closeEditSlotModal();
    loadScheduleForDate(selectedScheduleDate);
    showToast(`Slot status changed to ${result.new_status}`, 'success');
  } else {
    showToast("Error toggling slot: " + result.message, 'error');
  }
}

async function deleteSlotFromModal() {
  const availId = document.getElementById("edit-slot-id").value;
  if (!availId) return;
  
  openDeleteConfirmModal(async () => {
      const response = await fetch(
        `../../api/doctor/availability.php?avail_id=${availId}&action=remove`,
        { 
          method: "DELETE",
          credentials: "include"
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        closeEditSlotModal();
        loadScheduleForDate(selectedScheduleDate);
        showToast('Slot removed successfully', 'success');
      } else {
        showToast("Error deleting slot: " + result.message, 'error');
      }
  });
}

async function saveSlotChanges() {
  const availId = document.getElementById("edit-slot-id").value;
  const start = document.getElementById("edit-slot-start").value;
  const end = document.getElementById("edit-slot-end").value;
  
  if (!availId || !start || !end) {
    showToast("Please provide both start and end times.", 'error');
    return;
  }
  
  if (start < "09:00:00" || end > "17:00:00" || start > "17:00:00" || end < "09:00:00") {
    showToast("Time slots must be between 09:00 AM and 05:00 PM.", 'error');
    return;
  }
  
  if (start >= end) {
    showToast("Start time must be before end time.", 'error');
    return;
  }
  
  for (const slot of fetchedAvailability) {
    if (String(slot.avail_id) === String(availId)) continue;
    
    if (
      (start >= slot.start_time && start < slot.end_time) ||
      (end > slot.start_time && end <= slot.end_time) ||
      (start <= slot.start_time && end >= slot.end_time)
    ) {
      showToast("This time overlaps with another existing slot.", 'error');
      return;
    }
  }
  
  const payload = {
    avail_id: availId,
    start_time: start,
    end_time: end
  };
  
  const response = await fetch(
    `../../api/doctor/availability.php`,
    { 
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  
  const result = await response.json();
  if (result.status === "success") {
    closeEditSlotModal();
    loadScheduleForDate(selectedScheduleDate);
    showToast('Slot updated successfully', 'success');
  } else {
    showToast("Error updating slot: " + result.message, 'error');
  }
}

function openManageDayModal() {
  if (!selectedScheduleDate) return;
  
  const dateObj = new Date(selectedScheduleDate + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  
  const manageDayDateDisplay = document.getElementById("manage-day-date-display");
  if (manageDayDateDisplay) {
    manageDayDateDisplay.textContent = `Slots for ${dateDisplay}`;
  }

  const newSlotStart = document.getElementById("new-slot-start");
  const newSlotEnd = document.getElementById("new-slot-end");
  if (newSlotStart) newSlotStart.value = "";
  if (newSlotEnd) newSlotEnd.value = "";
  
  // Disable past time slots if managing today's schedule
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  if (selectedScheduleDate === todayStr) {
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
    
    // Disable start times for slots that would already be past
    Array.from(newSlotStart.options).forEach(opt => {
      if (opt.value === "") return; // Don't disable the placeholder
      
      // Calculate end time (30 minutes after start)
      const [hours, mins] = opt.value.split(':');
      const endMinutes = parseInt(mins) + 30;
      const endHours = parseInt(hours) + Math.floor(endMinutes / 60);
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}:00`;
      
      // If slot end time has passed, disable this option
      if (endTimeStr <= currentTimeStr) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });
    
    // Also disable past times in end time select
    Array.from(newSlotEnd.options).forEach(opt => {
      if (opt.value === "") return;
      
      // If end time has passed, disable this option
      if (opt.value <= currentTimeStr) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });
  } else {
    // For future dates, enable all times
    Array.from(newSlotStart.options).forEach(opt => opt.disabled = (opt.value === ""));
    Array.from(newSlotEnd.options).forEach(opt => opt.disabled = (opt.value === ""));
  }
  
  renderManageDaySlots();
  const modal = document.getElementById("manage-day-modal");
  modal.classList.remove("hidden");
  // Force reflow to trigger animation
  void modal.offsetWidth;
}

function closeManageDayModal() {
  const modal = document.getElementById("manage-day-modal");
  modal.classList.add("modal-closing");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-closing");
  }, 300);
}

function renderManageDaySlots() {
  const listContainer = document.getElementById("manage-day-slots-list");
  listContainer.innerHTML = "";
  
  if (!fetchedAvailability || fetchedAvailability.length === 0) {
    listContainer.innerHTML = `<p class="text-xs text-gray-500 italic py-2">No slots added yet.</p>`;
    return;
  }
  
    fetchedAvailability.forEach(slot => {
    let statusBadge = '';
    if (slot.status === 'Available') {
      statusBadge = `<span class="bg-[#007E85]/100 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm">Available</span>`;
    } else if (slot.status === 'Blocked') {
      statusBadge = `<span class="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm">Blocked</span>`;
    } else if (slot.status === 'Booked' || slot.status === 'Completed') {
      statusBadge = `<span class="bg-cyan-500 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm">${slot.status}</span>`;
    } else {
      statusBadge = `<span class="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-bold shadow-sm">${slot.status}</span>`;
    }

    const disableDelete = slot.status === 'Booked' || slot.status === 'Completed';

    listContainer.innerHTML += `
      <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-md hover:border-gray-200 transition shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0">
          <i data-lucide="clock" class="w-4 h-4 text-gray-600"></i>
          </div>
          <div>
            <span class="font-bold text-gray-900 text-sm">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</span>
            <div class="mt-1">${statusBadge}</div>
          </div>
        </div>
        <button onclick="removeSlotFromManageModal(${slot.avail_id})" ${disableDelete ? 'disabled class="text-gray-400 cursor-not-allowed p-1.5 hover:bg-gray-100 rounded-md transition"' : 'class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition" title="Delete Slot"'}>
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  });
  
  lucide.createIcons();
}

async function removeSlotFromManageModal(availId) {
  openDeleteConfirmModal(async () => {
      const response = await fetch(
        `../../api/doctor/availability.php?avail_id=${availId}&action=remove`,
        { 
          method: "DELETE",
          credentials: "include"
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        await loadScheduleForDate(selectedScheduleDate);
        renderManageDaySlots();
        showToast('Slot removed', 'success');
      } else {
        showToast("Error deleting slot: " + result.message, 'error');
      }
  });
}

async function addNewSlotToDay() {
  const start = document.getElementById("new-slot-start").value;
  const end = document.getElementById("new-slot-end").value;
  
  if (!start || !end) {
    showToast("Please provide both start and end times.", 'error');
    return;
  }
  
  if (start < "09:00:00" || end > "17:00:00" || start > "17:00:00" || end < "09:00:00") {
    showToast("Time slots must be between 09:00 AM and 05:00 PM.", 'error');
    return;
  }
  
  if (start >= end) {
    showToast("Start time must be before end time.", 'error');
    return;
  }
  
  // Check if slot is in the past (for today only)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  if (selectedScheduleDate === todayStr) {
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
    
    // end time must be after current time
    if (end <= currentTimeStr) {
      showToast("Cannot add slots for past times.", 'error');
      return;
    }
  }
  
  for (const slot of fetchedAvailability) {
    if (
      (start >= slot.start_time && start < slot.end_time) ||
      (end > slot.start_time && end <= slot.end_time) ||
      (start <= slot.start_time && end >= slot.end_time)
    ) {
      showToast("This time overlaps with an existing slot.", 'error');
      return;
    }
  }

  const payload = {
    avail_date: selectedScheduleDate,
    start_time: start,
    end_time: end
  };
  
  const response = await fetch(
    `../../api/doctor/availability.php`,
    { 
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  
  const result = await response.json();
  if (result.status === "success") {
    document.getElementById("new-slot-start").value = "";
    document.getElementById("new-slot-end").value = "";
    await loadScheduleForDate(selectedScheduleDate);
    renderManageDaySlots();
    showToast('New slot added', 'success');
  } else {
    showToast("Error adding slot: " + result.message, 'error');
  }
}

function updateEndTimeOptions(startId, endId) {
    const startSelect = document.getElementById(startId);
    const endSelect = document.getElementById(endId);
    
    if (!startSelect.value) return;
    
    const timeValues = [
        "09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "11:30:00",
        "12:00:00", "12:30:00", "13:00:00", "13:30:00", "14:00:00", "14:30:00",
        "15:00:00", "15:30:00", "16:00:00", "16:30:00", "17:00:00"
    ];
    
    const timeIndex = timeValues.indexOf(startSelect.value);
    
    // Check if we're managing today's schedule
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isToday = selectedScheduleDate === todayStr;
    
    let currentTimeStr = "";
    if (isToday) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
    }
    
    if (timeIndex !== -1 && timeIndex < timeValues.length - 1) {
        const expectedEndValue = timeValues[timeIndex + 1];
        
        Array.from(endSelect.options).forEach(opt => {
            if (opt.value === "") return;
            
            if (opt.value === expectedEndValue) {
                // Check if this end time is in the past (for today only)
                if (isToday && opt.value <= currentTimeStr) {
                  opt.disabled = true;
                } else {
                  opt.disabled = false;
                }
                endSelect.value = expectedEndValue;
            } else {
                opt.disabled = true;
            }
        });
    }
}

function openDeleteConfirmModal(actionCallback) {
  pendingDeleteAction = actionCallback;
  const modal = document.getElementById("delete-confirm-modal");
  modal.classList.remove("hidden");
  // Force reflow to trigger animation
  void modal.offsetWidth;
}

function closeDeleteConfirmModal() {
  const modal = document.getElementById("delete-confirm-modal");
  modal.classList.add("modal-closing");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-closing");
    pendingDeleteAction = null;
  }, 300);
}

function executeDelete() {
  if (pendingDeleteAction) {
    pendingDeleteAction();
  }
  closeDeleteConfirmModal();
}

function toggleFollowUpVisibility() {
  const st = document.getElementById("modal-edit-status").value;
  const bSection = document.getElementById("complete-consultation-btn");

  if (followupLocked) {
    bSection.innerHTML =
      '<i data-lucide="save" class="w-5 h-5"></i> Save Changes';
  } else if (st === "Completed") {
    bSection.innerHTML =
      '<i data-lucide="check-circle" class="w-5 h-5"></i> Complete Consultation';
  } else {
    bSection.innerHTML =
      '<i data-lucide="save" class="w-5 h-5"></i> Save Changes';
  }
  lucide.createIcons();
}

let fetchedAvailability = [];
let followupLocked = false;

window.updateFollowupTimes = function() {
    const dateSelect = document.getElementById("modal-followup-date");
    const timeSelect = document.getElementById("modal-followup-time");
    const selectedDate = dateSelect.value;
    const apt = storedAppointmentsForModal.find((a) => a.apt_id == document.getElementById("complete-consultation-btn").dataset.aptId);
    
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
        if (selectedDate === todayStr && slot.start_time < currentTimeStr) return false;
        return true;
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    // Track added times to avoid duplicates
    const addedTimes = new Set();
    
    if (slotsForDate.length > 0) {
        slotsForDate.forEach(slot => {
            timeSelect.innerHTML += `<option value="${slot.start_time}">${formatTime12h(slot.start_time)} - ${formatTime12h(slot.end_time)}</option>`;
            addedTimes.add(slot.start_time);
        });
        timeSelect.disabled = false;
    } else {
        timeSelect.disabled = true;
    }
    
    // If this is the previously scheduled followup date, include the previous time even if not available
    if (apt && apt.next_followup_date === selectedDate && apt.next_followup_time && !addedTimes.has(apt.next_followup_time)) {
        const timeLabel = `${formatTime12h(apt.next_followup_time)} (Previously Scheduled)`;
        timeSelect.innerHTML += `<option value="${apt.next_followup_time}">${timeLabel}</option>`;
        timeSelect.disabled = false;
    }
    
    // If no slots at all
    if (slotsForDate.length === 0 && (!apt || apt.next_followup_date !== selectedDate || !apt.next_followup_time)) {
        timeSelect.innerHTML = '<option value="">-- No Times Available --</option>';
        timeSelect.disabled = true;
    }
};

async function openAppointmentModal(aptId) {
  const apt = storedAppointmentsForModal.find((a) => a.apt_id == aptId);
  if (!apt) return;

  // Set current appointment for medical report generation
  currentAppointmentForReport = apt;

  console.log("=== OPENING APPOINTMENT MODAL ===");
  console.log("Appointment data:", apt);
  console.log("Next Followup Date:", apt.next_followup_date);
  console.log("Next Followup Time:", apt.next_followup_time);

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
  const notesEditWrapper = document.getElementById("notes-edit-wrapper");
  const rxEditWrapper = document.getElementById("rx-edit-wrapper");
  const notesReadonlyWrapper = document.getElementById("readonly-notes-wrapper");
  const rxReadonlyWrapper = document.getElementById("readonly-rx-wrapper");
  const notesReadonly = document.getElementById("readonly-doctor-notes");
  const rxReadonly = document.getElementById("readonly-prescriptions");
  const followupInputs = document.getElementById("followup-section");
  const feedbackSec = document.getElementById("feedback-section");
  const completeBtn = document.getElementById("complete-consultation-btn");
  const appointmentLockMsg = document.getElementById("appointment-lock-message") || createLockMessage();

  completeBtn.dataset.aptId = apt.apt_id;
  followupLocked = apt.status === "Completed";

  // Check if appointment has started
  const appointmentDateTime = new Date(`${apt.app_date}T${apt.appointment_time}`);
  const now = new Date();
  const hasAppointmentStarted = now >= appointmentDateTime;

  if (apt.status === "Completed") {
    // Completed appointments can still be updated, but follow-up stays locked.
    statusSelectWrapper.classList.remove("hidden");
    notesEditWrapper.classList.remove("hidden");
    rxEditWrapper.classList.remove("hidden");
    completeBtn.classList.remove("hidden");
    appointmentLockMsg.classList.add("hidden");
    
    // Show medical report button for completed appointments
    const medicalReportBtn = document.getElementById("medical-report-btn");
    if (medicalReportBtn) {
      medicalReportBtn.classList.remove("hidden");
    }
    
    // Ensure inputs are enabled
    statusSelect.disabled = false;
    completeBtn.disabled = false;
    completeBtn.classList.remove("opacity-50", "cursor-not-allowed");
    statusSelect.classList.remove("opacity-50", "cursor-not-allowed");

    notesReadonlyWrapper.classList.add("hidden");
    rxReadonlyWrapper.classList.add("hidden");

    statusSelect.value = apt.status || "Completed";
    notesInput.value = apt.doctor_comments || apt.doctor_notes || "";
    rxInput.value = apt.prescribed_medicines || apt.prescriptions || "";

    followupInputs.classList.add("hidden");
    document.getElementById("modal-followup-date").value = "";
    document.getElementById("modal-followup-time").value = "";
    document.getElementById("modal-followup-time").disabled = true;

    if (apt.feedback && apt.feedback.trim() !== "") {
      feedbackSec.classList.remove("hidden");
      document.getElementById("readonly-feedback").textContent = `"${apt.feedback}"`;
    } else {
      feedbackSec.classList.add("hidden");
    }

    toggleFollowUpVisibility();
  } else if (!hasAppointmentStarted) {
    // Lock Mode - Appointment hasn't started yet
    statusSelectWrapper.classList.remove("hidden");
    notesEditWrapper.classList.add("hidden");
    rxEditWrapper.classList.add("hidden");
    completeBtn.classList.remove("hidden");
    
    // Disable medical report button for upcoming appointments (cannot generate report before appointment starts)
    const medicalReportBtn = document.getElementById("medical-report-btn");
    if (medicalReportBtn) {
      medicalReportBtn.classList.remove("hidden");
      medicalReportBtn.disabled = true;
      medicalReportBtn.classList.add("opacity-50", "cursor-not-allowed");
      medicalReportBtn.title = "Report generation is disabled until the appointment time starts";
    }
    
    // Disable dropdown and button completely
    statusSelect.disabled = true;
    completeBtn.disabled = true;
    completeBtn.classList.add("opacity-50", "cursor-not-allowed");
    statusSelect.classList.add("opacity-50", "cursor-not-allowed");

    notesReadonlyWrapper.classList.remove("hidden");
    rxReadonlyWrapper.classList.remove("hidden");
    
    notesReadonly.textContent = "Appointment editing is locked until the appointment time starts.";
    rxReadonly.textContent = "You can edit this appointment starting from " + new Date(appointmentDateTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    
    appointmentLockMsg.classList.remove("hidden");
    appointmentLockMsg.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
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
    notesEditWrapper.classList.remove("hidden");
    rxEditWrapper.classList.remove("hidden");
    completeBtn.classList.remove("hidden");
    appointmentLockMsg.classList.add("hidden");
    
    // Show medical report button for all appointments in edit mode
    const medicalReportBtn = document.getElementById("medical-report-btn");
    if (medicalReportBtn) {
      medicalReportBtn.classList.remove("hidden");
    }
    
    // Ensure inputs are enabled
    statusSelect.disabled = false;
    completeBtn.disabled = false;
    completeBtn.classList.remove("opacity-50", "cursor-not-allowed");
    statusSelect.classList.remove("opacity-50", "cursor-not-allowed");

    notesReadonlyWrapper.classList.add("hidden");
    rxReadonlyWrapper.classList.add("hidden");
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
            
            // Get patient's existing appointments to exclude conflicting dates
            let patientAppointmentDates = [];
            if (apt && apt.patient_id) {
                try {
                    const allAptRes = await fetch('../../api/doctor/appointments.php', { credentials: 'include' });
                    const allAptData = await allAptRes.json();
                    if (allAptData.status === 'success' && allAptData.data) {
                        // Get dates of all appointments for this patient (excluding current appointment)
                        patientAppointmentDates = allAptData.data
                            .filter(a => a.patient_id === apt.patient_id && a.apt_id !== apt.apt_id) // Filter by patient, exclude current appointment
                            .map(a => a.app_date)
                            .filter(date => date); // Remove any null/empty dates
                    }
                } catch (e) {
                    console.error("Failed to fetch patient appointments:", e);
                }
            }
            
            console.log("Patient appointment dates (conflicts):", patientAppointmentDates);
            console.log("Unique dates available:", uniqueDates);
            console.log("Appointment next_followup_date:", apt.next_followup_date);
            
            // Filter out dates that conflict with patient's existing appointments
            const availableDatesForFollowup = uniqueDates.filter(date => {
                // Allow if it's the previously scheduled followup date
                if (apt && apt.next_followup_date === date) return true;
                // Allow if patient doesn't have an appointment on this date
                return !patientAppointmentDates.includes(date);
            });
            
            // Show conflict info message if some dates were filtered out
            const conflictInfo = document.getElementById("followup-conflict-info");
            if (uniqueDates.length > availableDatesForFollowup.length) {
                conflictInfo.classList.remove("hidden");
            } else {
                conflictInfo.classList.add("hidden");
            }
            
            // Also include existing followup date if it exists (even if not in current availability)
            if (apt.next_followup_date && !availableDatesForFollowup.includes(apt.next_followup_date)) {
                console.log("Adding existing followup date to options");
                availableDatesForFollowup.push(apt.next_followup_date);
                availableDatesForFollowup.sort();
            }
            
            if (availableDatesForFollowup.length > 0) {
                availableDatesForFollowup.forEach(date => {
                    const dateObj = new Date(date + "T00:00:00");
                    const dateDisplay = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                    const isExistingDate = date === apt.next_followup_date ? " (Previously Scheduled)" : "";
                    fDateSelect.innerHTML += `<option value="${date}">${dateDisplay}${isExistingDate}</option>`;
                });
                document.getElementById("followup-section").classList.remove("hidden");
                
                // Pre-populate existing followup date and time if available
                if (apt.next_followup_date) {
                    console.log("Setting followup date to:", apt.next_followup_date);
                    fDateSelect.value = apt.next_followup_date;
                    // Trigger updateFollowupTimes to populate the time options
                    updateFollowupTimes();
                    // Set the previously saved time if it exists
                    if (apt.next_followup_time) {
                        console.log("Setting followup time to:", apt.next_followup_time);
                        setTimeout(() => {
                            fTimeSelect.value = apt.next_followup_time;
                            console.log("Followup time set, current value:", fTimeSelect.value);
                        }, 100); // Small delay to ensure time options are populated
                    }
                }
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

  const modal = document.getElementById("appointment-modal");
  modal.classList.remove("hidden");
  // Force reflow to trigger animation
  void modal.offsetWidth;
  
  // Check if report exists and show/hide buttons
  checkAndShowReportButtons(apt.apt_id);
  
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
  const notesInput = document.getElementById("modal-doctor-notes");
  const rxInput = document.getElementById("modal-prescriptions");
  const rawNotes = notesInput.value.trim();
  const rawRx = rxInput.value.trim();
  const notes = sanitizeMedicalReportText(rawNotes);
  const rx = sanitizeMedicalReportText(rawRx);
  let fDate = document.getElementById("modal-followup-date").value;
  let fTime = document.getElementById("modal-followup-time").value;

  notesInput.value = notes;
  rxInput.value = rx;

  if (followupLocked) {
    fDate = "";
    fTime = "";
  }

  console.log("=== SUBMITTING CONSULTATION ===");
  console.log("Appointment ID:", aptId);
  console.log("Status:", statusVal);
  console.log("Followup Date:", fDate);
  console.log("Followup Time:", fTime);

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

  if (rawNotes !== notes) {
    const notesError = document.getElementById("notes-error");
    notesError.textContent = "Special characters are not allowed in doctor's notes";
    notesError.classList.remove("hidden");
    hasErrors = true;
  }

  if (rawRx !== rx) {
    const prescriptionsError = document.getElementById("prescriptions-error");
    prescriptionsError.textContent = "Special characters are not allowed in prescriptions";
    prescriptionsError.classList.remove("hidden");
    hasErrors = true;
  }

  // Only require notes and prescriptions if the status is Completed
  if (statusVal === 'Completed') {
    if (!notes) {
      const notesError = document.getElementById("notes-error");
      notesError.textContent = "Doctor's notes are required";
      notesError.classList.remove("hidden");
      hasErrors = true;
    }

    if (!rx) {
      const prescriptionsError = document.getElementById("prescriptions-error");
      prescriptionsError.textContent = "Prescriptions are required";
      prescriptionsError.classList.remove("hidden");
      hasErrors = true;
    }
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
    return;
  }

  // Check for appointment conflicts on the followup date
  if (fDate && fTime) {
    const apt = storedAppointmentsForModal.find((a) => a.apt_id == aptId);
    if (apt && apt.patient_id) {
      const conflictResponse = await fetch("../../api/doctor/check_patient_date_conflicts.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: apt.patient_id,
          check_date: fDate
        })
      });
      
      const conflictData = await conflictResponse.json();
      console.log("Appointment Conflict Check:", conflictData);
      
      if (conflictData.has_conflict) {
        console.error("❌ APPOINTMENT CONFLICT DETECTED");
        console.error(`Patient already has ${conflictData.appointments.length} appointment(s) on ${fDate}:`);
        conflictData.appointments.forEach((apt, idx) => {
          console.error(`  ${idx + 1}. Time: ${apt.app_time}, Status: ${apt.status}, Doctor: ${apt.doctor_id}`);
        });
        
        const followupError = document.getElementById("followup-date-error");
        followupError.textContent = "Patient already has appointment on this date. Please choose another followup date.";
        followupError.classList.remove("hidden");
        return;
      }
    }
  }

  const btn = document.getElementById("complete-consultation-btn");
  const oldText = btn.innerHTML;
  btn.innerHTML = "Saving...";
  btn.disabled = true;

  try {
    const payload = {
      appointment_id: aptId,
      status: statusVal,
      doctor_notes: notes,
      prescriptions: rx,
      followup_date: fDate,
      followup_time: fTime,
    };
    
    console.log("Sending payload:", payload);

    const res = await fetch("../../api/doctor/complete_consultation.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("API Response:", data);
    
    if (data.status === "success") {
      // Show success message with followup info if applicable
      if (fDate && fTime) {
        const dateObj = new Date(fDate + "T00:00:00");
        const dateDisplay = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const timeDisplay = formatTime12h(fTime);
        showToast(`✓ Consultation saved! Follow-up scheduled for ${dateDisplay} at ${timeDisplay}`, "success");
      } else {
        showToast("✓ Consultation saved successfully!", "success");
      }
      
      closeAppointmentModal();
      loadScheduleForDate(selectedScheduleDate);
    } else {
      alert("Error: " + data.message);
      showToast("Error: " + data.message, "error");
    }
  } catch (e) {
    console.error("Submission error:", e);
    alert("Exception: " + e.message);
    showToast("Error: " + e.message, "error");
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}

function closeAppointmentModal() {
  const modal = document.getElementById("appointment-modal");
  modal.classList.add("modal-closing");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("modal-closing");
  }, 300);
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
          <div class="bg-gray-50 p-3 rounded-md border border-gray-100">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-semibold text-gray-900 text-xs">${apt.doctor_name || '-'}</p>
                <p class="text-[10px] text-gray-500">${apt.specialization || 'Consultation'}</p>
              </div>
              <span class="text-[10px] bg-[#007E85]/15 text-[#007E85] px-2 py-1 rounded">Completed</span>
            </div>
            <p class="text-[10px] text-gray-600 mb-2">📅 ${new Date(apt.app_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${apt.app_time}</p>
            ${apt.reason_for_visit ? `<p class="text-[10px] text-gray-600 mb-2"><strong>Visit:</strong> ${apt.reason_for_visit}</p>` : ''}
            ${apt.doctor_comments ? `<p class="text-[10px] text-gray-700 mb-2 p-2 bg-white rounded border-l-2 border-blue-400"><strong>Notes:</strong> ${apt.doctor_comments}</p>` : ''}
            ${apt.prescribed_medicines ? `<p class="text-[10px] text-gray-700 p-2 bg-white rounded border-l-2 border-[#007E85]/30"><strong>Medicines:</strong> ${apt.prescribed_medicines}</p>` : ''}
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

document.addEventListener("DOMContentLoaded", async () => {
  updateCurrentDate();
  await loadDoctorProfile();
  renderScheduleCalendar();
  lucide.createIcons();
  
  // Check if a date parameter was passed from the pending appointments popup
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const aptIdParam = urlParams.get('apt_id');
  
  if (dateParam) {
    // Validate date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      // Set the calendar to show the month of the date
      const [year, month, day] = dateParam.split('-');
      scheduleMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Load and select the specific date
      await selectScheduleDate(dateParam);
      
      // If apt_id parameter is present, automatically open that appointment
      if (aptIdParam) {
        setTimeout(() => {
          // Directly call openAppointmentModal with the appointment ID
          openAppointmentModal(parseInt(aptIdParam));
        }, 800);
      }
      
      // Clear the URL parameter to avoid reloading the same date on refresh
      window.history.replaceState({}, document.title, 'schedules.html');
    }
  } else {
    // Load today's appointments by default if no date specified
    selectToday();
  }
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

// ===== MEDICAL REPORT FUNCTIONS =====
let medicineFieldCount = 0;
let currentAppointmentForReport = null;
const MEDICAL_REPORT_TEXT_SANITIZE_PATTERN = /[^A-Za-z0-9\s]/g;
const MEDICAL_REPORT_BP_SANITIZE_PATTERN = /[^0-9/]/g;
const MEDICAL_REPORT_WEIGHT_SANITIZE_PATTERN = /[^0-9.]/g;

function sanitizeMedicalReportText(value) {
  return (value || '').replace(MEDICAL_REPORT_TEXT_SANITIZE_PATTERN, '');
}

function sanitizeMedicalReportBloodPressure(value) {
  return (value || '').replace(MEDICAL_REPORT_BP_SANITIZE_PATTERN, '');
}

function sanitizeMedicalReportWeight(value) {
  const cleaned = (value || '').replace(MEDICAL_REPORT_WEIGHT_SANITIZE_PATTERN, '');
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex === -1) {
    return cleaned;
  }
  return cleaned.slice(0, firstDotIndex + 1) + cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
}

function bindMedicalReportSanitizer(element, sanitizeFn, errorId, errorMessage) {
  if (!element || element.dataset.forbiddenFilterBound === 'true') {
    return;
  }

  element.dataset.forbiddenFilterBound = 'true';
  element.addEventListener('input', () => {
    const originalValue = element.value;
    const cleanedValue = sanitizeFn(originalValue);

    if (cleanedValue !== originalValue) {
      element.value = cleanedValue;
      setMedicalReportFieldError(errorId, errorMessage);
      return;
    }

    const errorEl = document.getElementById(errorId);
    if (errorEl && errorEl.textContent === errorMessage) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  });
}

function bindMedicalReportFieldFilters() {
  bindMedicalReportSanitizer(
    document.getElementById('report-symptoms'),
    sanitizeMedicalReportText,
    'report-symptoms-error',
    'Special characters are not allowed in symptoms.'
  );
  bindMedicalReportSanitizer(
    document.getElementById('report-diagnosis'),
    sanitizeMedicalReportText,
    'report-diagnosis-error',
    'Special characters are not allowed in diagnosis.'
  );
  bindMedicalReportSanitizer(
    document.getElementById('report-notes'),
    sanitizeMedicalReportText,
    'report-notes-error',
    'Special characters are not allowed in additional notes.'
  );
  bindMedicalReportSanitizer(
    document.getElementById('report-bp'),
    sanitizeMedicalReportBloodPressure,
    'report-bp-error',
    'Blood pressure allows only digits and /.'
  );
  bindMedicalReportSanitizer(
    document.getElementById('report-weight'),
    sanitizeMedicalReportWeight,
    'report-weight-error',
    'Weight allows only numbers and one decimal point.'
  );

  document.querySelectorAll('.medicine-name, .medicine-dosage, .medicine-frequency').forEach((field) => {
    bindMedicalReportSanitizer(
      field,
      sanitizeMedicalReportText,
      'report-medicines-error',
      'Special characters are not allowed in medicine fields.'
    );
  });
}

function clearMedicalReportErrors() {
  const errorIds = [
    'report-symptoms-error',
    'report-diagnosis-error',
    'report-bp-error',
    'report-weight-error',
    'report-medicines-error',
    'report-notes-error',
    'report-form-error',
  ];

  errorIds.forEach((id) => {
    const errorEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  });
}

function setMedicalReportFieldError(errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (!errorEl) {
    return;
  }

  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function generateReportForCurrentAppointment() {
  if (!currentAppointmentForReport) {
    alert('No appointment selected');
    return;
  }
  
  // Check if appointment time has started
  const appointmentDateTime = new Date(currentAppointmentForReport.app_date + ' ' + currentAppointmentForReport.appointment_time);
  const now = new Date();
  
  if (now < appointmentDateTime) {
    alert('Report generation is disabled until the appointment time starts. Appointment is scheduled for ' + appointmentDateTime.toLocaleString());
    return;
  }
  
  // Close appointment modal
  closeAppointmentModal();
  
  // Open medical report modal
  openMedicalReportModal(currentAppointmentForReport);
}

function openMedicalReportModal(appointmentData) {
  currentAppointmentForReport = appointmentData;
  
  // Populate patient info
  document.getElementById('report-apt-id').value = appointmentData.apt_id;
  document.getElementById('report-patient-name').textContent = appointmentData.patient_name;
  document.getElementById('report-apt-datetime').textContent = 
    new Date(appointmentData.app_date + ' ' + appointmentData.appointment_time).toLocaleString();
  document.getElementById('report-chief-complaint').textContent = appointmentData.reason_for_visit;

  // Clear form
  document.getElementById('medical-report-form').reset();
  document.getElementById('medicines-list').innerHTML = '';
  medicineFieldCount = 0;
  clearMedicalReportErrors();
  bindMedicalReportFieldFilters();

  // Check if report already exists
  loadExistingReport(appointmentData.apt_id);

  // Show modal
  const modal = document.getElementById('medical-report-modal');
  modal.classList.remove('hidden');
  
  // Trigger animation
  setTimeout(() => {
    const backdrop = document.querySelector('.medical-report-modal-backdrop');
    const content = document.querySelector('.medical-report-modal-content');
    if (backdrop && content) {
      backdrop.style.opacity = '1';
      backdrop.style.pointerEvents = 'auto';
      content.style.transform = 'scale(1)';
    }
  }, 10);
  
  lucide.createIcons();
}

function closeMedicalReportModal() {
  const modal = document.getElementById('medical-report-modal');
  const backdrop = document.querySelector('.medical-report-modal-backdrop');
  const content = document.querySelector('.medical-report-modal-content');
  if (backdrop && content) {
    backdrop.style.opacity = '0';
    content.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  } else {
    modal.classList.add('hidden');
  }
}

// Check if report exists and show/hide view/edit buttons
async function checkAndShowReportButtons(appointmentId) {
  const viewBtn = document.getElementById('view-report-btn');
  const editBtn = document.getElementById('edit-report-btn');
  const generateBtn = document.getElementById('medical-report-btn');
  
  try {
    const response = await fetch(
      `../../api/doctor/medical_report.php?appointment_id=${appointmentId}`,
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      // Report doesn't exist
      if (viewBtn) viewBtn.classList.add('hidden');
      if (editBtn) editBtn.classList.add('hidden');
      if (generateBtn) generateBtn.classList.remove('hidden');
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // Report exists - show view/edit buttons, hide generate button
      if (viewBtn) viewBtn.classList.remove('hidden');
      if (editBtn) editBtn.classList.remove('hidden');
      if (generateBtn) generateBtn.classList.add('hidden');
    } else {
      // Report doesn't exist
      if (viewBtn) viewBtn.classList.add('hidden');
      if (editBtn) editBtn.classList.add('hidden');
      if (generateBtn) generateBtn.classList.remove('hidden');
    }
  } catch (error) {
    console.warn('Could not check report status');
    if (generateBtn) generateBtn.classList.remove('hidden');
  }
}

// View the saved report in full-screen modal
async function viewDoctorReport() {
  if (!currentAppointmentForReport) {
    alert('No appointment selected');
    return;
  }
  
  // Close appointment modal
  closeAppointmentModal();
  
  document.getElementById('view-report-apt-id').value = currentAppointmentForReport.apt_id;
  await loadDoctorViewReport(currentAppointmentForReport.apt_id);
  
  const modal = document.getElementById('doctor-view-report-modal');
  modal.classList.remove('hidden');
  
  // Trigger animation
  setTimeout(() => {
    const backdrop = document.querySelector('.doctor-report-modal-backdrop');
    const content = document.querySelector('.doctor-report-modal-content');
    if (backdrop && content) {
      backdrop.style.opacity = '1';
      backdrop.style.pointerEvents = 'auto';
      content.style.transform = 'scale(1)';
    }
  }, 10);
  
  lucide.createIcons();
}

// Load report data for viewing
async function loadDoctorViewReport(appointmentId) {
  try {
    const response = await fetch(
      `../../api/doctor/medical_report.php?appointment_id=${appointmentId}`,
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      alert('Could not load report');
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      const report = result.data;
      
      // Hospital Information
      document.getElementById('view-report-hospital-name').textContent = 'Health Care';
      document.getElementById('view-report-hospital-address').textContent = 'Address: 123 Medical Street, Healthcare City';
      document.getElementById('view-report-hospital-contact').textContent = 'Phone: +1-800-HOSPITAL | Email: info@healthcare.com';
      
      // Patient Information
      document.getElementById('view-report-patient-name').textContent = currentAppointmentForReport.patient_name;
      document.getElementById('view-report-patient-id').textContent = currentAppointmentForReport.patient_id;
      document.getElementById('view-report-patient-age').textContent = '35 years';
      
      // Doctor & Appointment Information
      document.getElementById('view-report-doctor-name').textContent = `Dr. ${report.doctor_name}`;
      document.getElementById('view-report-doctor-id').textContent = report.doctor_id;
      document.getElementById('view-report-apt-datetime').textContent = 
        new Date(currentAppointmentForReport.app_date + ' ' + currentAppointmentForReport.appointment_time).toLocaleString();
      
      // Chief Complaint
      document.getElementById('view-report-chief-complaint').textContent = currentAppointmentForReport.reason_for_visit;
      
      // Medical Findings
      document.getElementById('view-report-symptoms').textContent = sanitizeMedicalReportText(report.symptoms || '');
      document.getElementById('view-report-diagnosis').textContent = sanitizeMedicalReportText(report.diagnosis || '');
      document.getElementById('view-report-bp').textContent = sanitizeMedicalReportBloodPressure(report.blood_pressure || '') || 'Not recorded';
      document.getElementById('view-report-weight').textContent = report.weight ? `${report.weight} kg` : 'Not recorded';
      document.getElementById('view-report-room-no').textContent = report.room_num || '--';
      
      // Report Metadata
      document.getElementById('view-report-id').textContent = report.report_id;
      document.getElementById('view-report-generated-date').textContent = 
        new Date(report.created_at).toLocaleString();
      
      // Medicines
      if (report.prescribed_medicines && Array.isArray(report.prescribed_medicines) && report.prescribed_medicines.length > 0) {
        const medicinesList = document.getElementById('view-report-medicines');
        medicinesList.innerHTML = '';
        report.prescribed_medicines.forEach((medicine, idx) => {
          const row = document.createElement('tr');
          row.className = idx % 2 === 0 ? 'bg-gray-50' : 'bg-white';
          row.innerHTML = `
            <td class="p-3 border-b border-gray-200 text-gray-900 font-medium">${sanitizeMedicalReportText(medicine.name || 'N/A')}</td>
            <td class="p-3 border-b border-gray-200 text-gray-700">${sanitizeMedicalReportText(medicine.dosage || 'N/A')}</td>
            <td class="p-3 border-b border-gray-200 text-gray-700">${sanitizeMedicalReportText(medicine.frequency || 'N/A')}</td>
          `;
          medicinesList.appendChild(row);
        });
        document.getElementById('view-medicines-section').classList.remove('hidden');
      } else {
        document.getElementById('view-medicines-section').classList.add('hidden');
      }
      
      // Notes
      if (report.additional_notes) {
        document.getElementById('view-report-notes').textContent = sanitizeMedicalReportText(report.additional_notes);
        document.getElementById('view-notes-section').classList.remove('hidden');
      } else {
        document.getElementById('view-notes-section').classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error loading report:', error);
    alert('Error loading report');
  }
}

// Close view report modal
function closeDoctorViewReportModal() {
  const modal = document.getElementById('doctor-view-report-modal');
  const backdrop = document.querySelector('.doctor-report-modal-backdrop');
  const content = document.querySelector('.doctor-report-modal-content');
  if (backdrop && content) {
    backdrop.style.opacity = '0';
    content.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  } else {
    modal.classList.add('hidden');
  }
}

// Edit report - opens the form
function editDoctorReport() {
  closeDoctorViewReportModal();
  if (typeof closeAppointmentModal === 'function') {
    closeAppointmentModal();
  }
  openMedicalReportModal(currentAppointmentForReport);
}

// Download report as PDF
async function downloadDoctorReportPDF() {
  const appointmentId = document.getElementById('view-report-apt-id').value;
  
  try {
    const response = await fetch(
      `../../api/doctor/generate_medical_report_pdf.php?appointment_id=${appointmentId}`,
      { credentials: 'include' }
    );
    
    const reportData = await response.json();
    
    if (reportData.status !== 'success') {
      alert('Error generating PDF');
      return;
    }
    
    const data = reportData.data;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Helper functions
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
    };
    
    const addText = (x, y, text, size = 11, weight = 'normal', color = '#000000', align = 'left', maxWidth = 180) => {
      doc.setFontSize(size);
      doc.setTextColor(...hexToRgb(color));
      doc.setFont(undefined, weight);
      if (text && text.toString().length > 0) {
        const lines = doc.splitTextToSize(text.toString(), maxWidth);
        doc.text(lines, x, y, { align });
        return lines.length;
      }
      return 0;
    };
    
    const addLine = (x1, y1, x2, y2, color = '#007E85', width = 0.5) => {
      doc.setDrawColor(...hexToRgb(color));
      doc.setLineWidth(width);
      doc.line(x1, y1, x2, y2);
    };
    
    let yPos = 15;
    
    // ===== HEADER =====
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('HEALTH CARE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#666666'));
    doc.setFont(undefined, 'normal');
    doc.text('Address: 123 Medical Street, Healthcare City', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Phone: +1-800-HOSPITAL | Email: info@healthcare.com', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    addLine(10, yPos, pageWidth - 10, yPos, '#007E85', 1);
    yPos += 8;
    
    // Title
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('MEDICAL REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    
    // Report ID and Date
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.setFont(undefined, 'normal');
    doc.text(`Report ID: ${data.report.report_id} | Date: ${new Date(data.report.created_at).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // ===== PATIENT & DOCTOR SECTION =====
    const sectionStartY = yPos;
    
    // Left Column - Patient Info
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('PATIENT INFORMATION', 12, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${data.patient.patient_name}`, 12, yPos);
    yPos += 4;
    doc.text(`Patient ID: ${data.patient.patient_id}`, 12, yPos);
    yPos += 4;
    doc.text(`Age: 35 years`, 12, yPos);
    yPos += 6;
    
    // Right Column - Doctor Info
    yPos = sectionStartY;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('CONSULTATION DETAILS', pageWidth / 2 + 10, yPos);
    yPos = sectionStartY + 6;
    
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.setFont(undefined, 'normal');
    doc.text(`Doctor: Dr. ${data.doctor.doctor_name}`, pageWidth / 2 + 10, yPos);
    yPos += 4;
    doc.text(`Doctor ID: ${data.doctor.doctor_id}`, pageWidth / 2 + 10, yPos);
    yPos += 4;
    doc.text(`Date & Time: ${new Date(data.appointment.appointment_datetime).toLocaleString()}`, pageWidth / 2 + 10, yPos);
    yPos += 8;
    
    yPos = Math.max(sectionStartY + 20, yPos);
    addLine(10, yPos, pageWidth - 10, yPos, '#CCCCCC');
    yPos += 7;
    
    // ===== CHIEF COMPLAINT =====
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('CHIEF COMPLAINT', 12, yPos);
    yPos += 5;
    
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.setFont(undefined, 'normal');
    const ccLines = doc.splitTextToSize(data.appointment.reason_for_visit || 'N/A', 180);
    doc.text(ccLines, 12, yPos);
    yPos += ccLines.length * 4 + 5;
    
    // ===== CLINICAL FINDINGS =====
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb('#007E85'));
    doc.text('CLINICAL FINDINGS', 12, yPos);
    yPos += 6;
    
    // Symptoms
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#EF7300'));
    doc.text('Symptoms:', 12, yPos);
    yPos += 4;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb('#333333'));
    const symptomsLines = doc.splitTextToSize(data.report.symptoms || 'N/A', 180);
    doc.text(symptomsLines, 12, yPos);
    yPos += symptomsLines.length * 3.5 + 3;
    
    // Diagnosis
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#DC2626'));
    doc.text('Diagnosis:', 12, yPos);
    yPos += 4;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb('#333333'));
    const diagnosisLines = doc.splitTextToSize(data.report.diagnosis || 'N/A', 180);
    doc.text(diagnosisLines, 12, yPos);
    yPos += diagnosisLines.length * 3.5 + 5;
    
    // Vital Signs
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#16A34A'));
    doc.text('Vital Signs:', 12, yPos);
    yPos += 4;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.text(`BP: ${data.report.blood_pressure || 'N/A'}  |  Weight: ${data.report.weight || 'N/A'} kg`, 12, yPos);
    yPos += 6;
    
    // Check if page is getting full
    if (yPos > 240) {
      doc.addPage();
      yPos = 15;
    }
    
    // ===== PRESCRIBED MEDICINES =====
    if (data.report.medicines && data.report.medicines.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...hexToRgb('#007E85'));
      doc.text('PRESCRIBED MEDICINES', 12, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb('#FFFFFF'));
      doc.setFillColor(...hexToRgb('#007E85'));
      doc.rect(12, yPos - 2, 180, 5, 'F');
      doc.text('Medicine Name', 14, yPos + 1);
      doc.text('Dosage', 85, yPos + 1);
      doc.text('Frequency', 140, yPos + 1);
      yPos += 7;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb('#333333'));
      data.report.medicines.forEach((med, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(...hexToRgb('#F3F4F6'));
          doc.rect(12, yPos - 2, 180, 4, 'F');
        }
        doc.text(med.name || 'N/A', 14, yPos);
        doc.text(med.dosage || 'N/A', 85, yPos);
        doc.text(med.frequency || 'N/A', 140, yPos);
        yPos += 4;
      });
      yPos += 3;
    }
    
    // Check page again
    if (yPos > 240) {
      doc.addPage();
      yPos = 15;
    }
    
    // ===== ADDITIONAL NOTES =====
    if (data.report.notes) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...hexToRgb('#007E85'));
      doc.text('ADDITIONAL NOTES', 12, yPos);
      yPos += 5;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...hexToRgb('#333333'));
      const notesLines = doc.splitTextToSize(data.report.notes, 180);
      doc.text(notesLines, 12, yPos);
      yPos += notesLines.length * 3.5 + 5;
    }
    
    // ===== FOOTER =====
    yPos = Math.max(yPos + 5, pageHeight - 40);
    addLine(10, yPos, pageWidth - 10, yPos, '#CCCCCC');
    yPos += 6;
    
    // Signature lines
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb('#333333'));
    doc.text('Doctor\'s Signature', 20, yPos + 15);
    doc.text('Date & Seal', pageWidth - 40, yPos + 15, { align: 'right' });
    
    // Disclaimer
    yPos = pageHeight - 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb('#666666'));
    doc.text('This is a computer-generated report and is valid without a signature.', pageWidth / 2, yPos, { align: 'center' });
    doc.text('For more information, please contact the hospital directly.', pageWidth / 2, yPos + 3, { align: 'center' });
    
    // Download
    const fileName = `Medical_Report_${data.patient.patient_name}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showToast('✓ PDF downloaded successfully!', 'success');
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Error generating PDF: ' + error.message);
  }
}

function addMedicineField() {
  medicineFieldCount++;
  const medicinesList = document.getElementById('medicines-list');
  const medicineDiv = document.createElement('div');
  medicineDiv.className = 'flex gap-2 medicine-field';
  medicineDiv.id = `medicine-${medicineFieldCount}`;
  medicineDiv.innerHTML = `
    <input
      type="text"
      placeholder="Medicine name"
      oninput="this.value = sanitizeMedicalReportText(this.value)"
      class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007E85] outline-none medicine-name"
    />
    <input
      type="text"
      placeholder="Dosage (e.g., 500mg)"
      oninput="this.value = sanitizeMedicalReportText(this.value)"
      class="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007E85] outline-none medicine-dosage"
    />
    <input
      type="text"
      placeholder="Frequency (e.g., 2x daily)"
      oninput="this.value = sanitizeMedicalReportText(this.value)"
      class="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#007E85] outline-none medicine-frequency"
    />
    <button
      type="button"
      onclick="removeMedicineField('medicine-${medicineFieldCount}')"
      class="text-red-500 hover:text-red-700 transition"
    >
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>
  `;
  medicinesList.appendChild(medicineDiv);
  bindMedicalReportSanitizer(
    medicineDiv.querySelector('.medicine-name'),
    sanitizeMedicalReportText,
    'report-medicines-error',
    'Special characters are not allowed in medicine fields.'
  );
  bindMedicalReportSanitizer(
    medicineDiv.querySelector('.medicine-dosage'),
    sanitizeMedicalReportText,
    'report-medicines-error',
    'Special characters are not allowed in medicine fields.'
  );
  bindMedicalReportSanitizer(
    medicineDiv.querySelector('.medicine-frequency'),
    sanitizeMedicalReportText,
    'report-medicines-error',
    'Special characters are not allowed in medicine fields.'
  );
  lucide.createIcons();
}

function removeMedicineField(id) {
  const field = document.getElementById(id);
  if (field) {
    field.remove();
  }
}

async function loadExistingReport(appointmentId) {
  try {
    const response = await fetch(
      `../../api/doctor/medical_report.php?appointment_id=${appointmentId}`,
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      console.warn('API returned status:', response.status);
      return;
    }
    
    const result = await response.json();

    if (result.status === 'success' && result.data) {
      const report = result.data;
      document.getElementById('report-symptoms').value = sanitizeMedicalReportText(report.symptoms || '');
      document.getElementById('report-diagnosis').value = sanitizeMedicalReportText(report.diagnosis || '');
      document.getElementById('report-bp').value = sanitizeMedicalReportBloodPressure(report.blood_pressure || '');
      document.getElementById('report-weight').value = sanitizeMedicalReportWeight(String(report.weight || ''));
      document.getElementById('report-notes').value = sanitizeMedicalReportText(report.additional_notes || '');

      // Load medicines
      if (report.prescribed_medicines && Array.isArray(report.prescribed_medicines)) {
        report.prescribed_medicines.forEach(medicine => {
          addMedicineField();
          const lastIndex = medicineFieldCount;
          const medicineField = document.querySelector(`#medicine-${lastIndex}`);
          if (medicineField) {
            medicineField.querySelector('.medicine-name').value = sanitizeMedicalReportText(medicine.name || '');
            medicineField.querySelector('.medicine-dosage').value = sanitizeMedicalReportText(medicine.dosage || '');
            medicineField.querySelector('.medicine-frequency').value = sanitizeMedicalReportText(medicine.frequency || '');
          }
        });
      }
    }
    // If report not found, form stays empty (which is expected for new reports)
  } catch (error) {
    console.warn('Note: No existing report found (this is normal for new appointments)');
  }
}

async function saveMedicalReport() {
  clearMedicalReportErrors();

  const appointmentId = document.getElementById('report-apt-id').value;
  const symptoms = sanitizeMedicalReportText(document.getElementById('report-symptoms').value.trim());
  const diagnosis = sanitizeMedicalReportText(document.getElementById('report-diagnosis').value.trim());
  const bloodPressure = sanitizeMedicalReportBloodPressure(document.getElementById('report-bp').value.trim());
  const weight = sanitizeMedicalReportWeight(document.getElementById('report-weight').value.trim());
  const additionalNotes = sanitizeMedicalReportText(document.getElementById('report-notes').value.trim());

  // Validate ALL required fields with specific error messages
  if (!symptoms) {
    setMedicalReportFieldError('report-symptoms-error', 'Symptoms field is required');
    document.getElementById('report-symptoms').focus();
    return;
  }
  if (!diagnosis) {
    setMedicalReportFieldError('report-diagnosis-error', 'Diagnosis field is required');
    document.getElementById('report-diagnosis').focus();
    return;
  }
  if (!bloodPressure) {
    setMedicalReportFieldError('report-bp-error', 'Blood pressure field is required');
    document.getElementById('report-bp').focus();
    return;
  }
  if (!weight) {
    setMedicalReportFieldError('report-weight-error', 'Weight field is required');
    document.getElementById('report-weight').focus();
    return;
  }
  if (!additionalNotes) {
    setMedicalReportFieldError('report-notes-error', 'Additional notes field is required');
    document.getElementById('report-notes').focus();
    return;
  }

  // Collect medicines
  const medicines = [];
  document.querySelectorAll('.medicine-field').forEach(field => {
    const name = sanitizeMedicalReportText(field.querySelector('.medicine-name').value.trim());
    const dosage = sanitizeMedicalReportText(field.querySelector('.medicine-dosage').value.trim());
    const frequency = sanitizeMedicalReportText(field.querySelector('.medicine-frequency').value.trim());
    if (name) {
      medicines.push({ name, dosage, frequency });
    }
  });
  if (medicines.length === 0) {
    setMedicalReportFieldError('report-medicines-error', 'Please add at least one medicine');
    return;
  }

  try {
    const response = await fetch('../../api/doctor/medical_report.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_id: parseInt(appointmentId),
        symptoms,
        diagnosis,
        blood_pressure: bloodPressure,
        weight: weight ? parseFloat(weight) : null,
        prescribed_medicines: medicines,
        additional_notes: additionalNotes
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      showToast('✓ Medical report saved successfully!', 'success');
      closeMedicalReportModal();
      // Update button visibility for the appointment
      checkAndShowReportButtons(parseInt(appointmentId));
      // Reload the schedule
      if (selectedScheduleDate) loadScheduleForDate(selectedScheduleDate);
    } else {
      setMedicalReportFieldError('report-form-error', result.message || 'Unable to save medical report.');
    }
  } catch (error) {
    setMedicalReportFieldError('report-form-error', 'Error saving report: ' + error.message);
  }
}
