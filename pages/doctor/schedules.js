let scheduleMonth = new Date(2026, 3); // April 2026
let selectedScheduleDate = null;
let currentEditAvailId = null;

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

 async function loadDoctorProfile() {
    const response = await fetch('../../api/doctor/get_doctor_info.php');
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
        document.getElementById('sidebar-doctor-name').textContent = result.data.full_name || 'Doctor';
    }
}

async function fetchAppointmentDates() {
    const response = await fetch('../../api/doctor/appointment_dates.php');
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
        return result.data;
    }
    return [];
}

async function fetchAvailabilityDates() {
    const response = await fetch('../../api/doctor/availability.php');
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
        // Return full dates in YYYY-MM-DD format for accurate filtering
        return result.data.map(avail => avail.available_date);
    }
    return [];
}

function renderScheduleCalendar() {
    const daysContainer = document.getElementById('schedule-calendar-days');
    daysContainer.innerHTML = '';
    
    const year = scheduleMonth.getFullYear();
    const month = scheduleMonth.getMonth();
    
    document.getElementById('schedule-calendar-month').textContent = scheduleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Fetch availability dates for this month
    fetchAvailabilityDates().then(availabilityDates => {
        // Create a Set of dates for this month/year only
        const targetYear = year;
        const targetMonth = month + 1; // Convert from 0-11 to 1-12
        
        const datesThisMonth = new Set();
        availabilityDates.forEach(dateStr => {
            const parts = dateStr.trim().split('-');
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
        
        // Previous month's grayed days
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = prevMonthDays - firstDay + 1; i <= prevMonthDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day text-gray-300 rounded-lg';
            dayDiv.textContent = i;
            daysContainer.appendChild(dayDiv);
        }
        
        // Current month dates
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day cursor-pointer hover:bg-primary-light rounded-lg';
            dayDiv.textContent = i;
            
            // Add red dot if doctor has set availability for this date in this month/year
            if (datesThisMonth.has(i)) {
                dayDiv.classList.add('has-appointment');
            }
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayDiv.onclick = () => selectScheduleDate(dateStr);
            
            daysContainer.appendChild(dayDiv);
        }
        
        // Next month's grayed days
        const remainingDays = 42 - (firstDay + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day text-gray-300 rounded-lg';
            dayDiv.textContent = i;
            daysContainer.appendChild(dayDiv);
        }
    });
}

const FIX_SLOTS = [
    { start: "09:00:00", end: "10:00:00", label: "09:00 AM - 10:00 AM", isLunch: false },
    { start: "10:00:00", end: "11:00:00", label: "10:00 AM - 11:00 AM", isLunch: false },
    { start: "11:00:00", end: "12:00:00", label: "11:00 AM - 12:00 PM", isLunch: false },
    { start: "12:00:00", end: "13:00:00", label: "12:00 PM - 01:00 PM", isLunch: false },
    { start: "13:00:00", end: "14:00:00", label: "01:00 PM - 02:00 PM", isLunch: true },
    { start: "14:00:00", end: "15:00:00", label: "02:00 PM - 03:00 PM", isLunch: false },
    { start: "15:00:00", end: "16:00:00", label: "03:00 PM - 04:00 PM", isLunch: false },
    { start: "16:00:00", end: "17:00:00", label: "04:00 PM - 05:00 PM", isLunch: false }
];

function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

async function selectScheduleDate(date) {
    selectedScheduleDate = date;
    
    // Update display
    const dateObj = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (dateObj.getTime() === today.getTime()) {
        dateDisplay = "Today, " + dateDisplay;
    }
    document.getElementById('schedule-date-display').textContent = dateDisplay;
    
    renderScheduleCalendar(); // re-render to update selected state style
    await loadScheduleForDate(date);
}

function selectToday() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    scheduleMonth = new Date(today.getFullYear(), today.getMonth());
    selectScheduleDate(dateStr);
}

let storedAppointmentsForModal = [];

async function loadScheduleForDate(date) {
    const gridContainer = document.getElementById('daily-schedule-grid');
    gridContainer.innerHTML = '<div class="text-center py-12 text-gray-400"><p>Loading slots...</p></div>';
    
    try {
        // Fetch Parallel
        const [availRes, aptRes] = await Promise.all([
            fetch(`../../api/doctor/availability.php?date=${date}`),
            fetch(`../../api/doctor/appointments_by_date.php?date=${date}`)
        ]);
        
        const availData = await availRes.json();
        const aptData = await aptRes.json();
        
        const availability = availData.status === 'success' ? availData.data : [];
        const appointments = aptData.status === 'success' ? aptData.data : [];
        storedAppointmentsForModal = appointments;

        // Compare date with today to disable past slots
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isPastDay = date < todayStr;
        const isToday = date === todayStr;
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        gridContainer.innerHTML = '';
        
        FIX_SLOTS.forEach((slot) => {
            let slotIsPast = isPastDay;
            if (isToday) {
                const [h, m] = slot.start.split(':').map(Number);
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
            const apt = appointments.find(a => a.appointment_time === slot.start);
            if (apt) {
                if (apt.status === 'Completed') {
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

            // Check Availability (OPEN vs BLOCKED)
            const avail = availability.find(a => a.start_time === slot.start);
            
            if (avail) {
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
                        <button onclick="toggleSlot('${slot.start}', '${slot.end}', ${avail.avail_id}, ${slotIsPast})" class="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${slotIsPast ? 'opacity-50 cursor-not-allowed' : ''}">
                            Block Slot
                        </button>
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
                        <button onclick="toggleSlot('${slot.start}', '${slot.end}', null, ${slotIsPast})" class="bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm ${slotIsPast ? 'opacity-50 cursor-not-allowed' : ''}">
                            Open Slot
                        </button>
                    </div>`;
            }
        });
        lucide.createIcons();
    } catch (e) {
        gridContainer.innerHTML = '<div class="text-center py-12 text-red-500"><p>Failed to load slots. Please try again.</p></div>';
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
        const response = await fetch(`../../api/doctor/availability.php?avail_id=${availId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.status === 'success') {
            loadScheduleForDate(date);
        } else {
            alert('Error blocking slot: ' + result.message);
        }
    } else {
        // POST
        const response = await fetch('../../api/doctor/availability.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                avail_date: date,
                start_time: startTime,
                end_time: endTime
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            loadScheduleForDate(date);
        } else {
            alert('Error opening slot: ' + result.message);
        }
    }
}

function toggleFollowUpVisibility() {
    const st = document.getElementById('modal-edit-status').value;
    const fSection = document.getElementById('followup-section');
    const bSection = document.getElementById('complete-consultation-btn');
    if (st === 'Completed') {
        fSection.classList.add('hidden');
        bSection.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> Complete Consultation';
    } else {
        fSection.classList.remove('hidden');
        bSection.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Save Changes';
    }
    lucide.createIcons();
}

function openAppointmentModal(aptId) {
    const apt = storedAppointmentsForModal.find(a => a.apt_id == aptId);
    if (!apt) return;

    document.getElementById('modal-patient-name').textContent = apt.patient_name || 'Unknown Patient';
    document.getElementById('modal-patient-id').textContent = apt.patient_id ? `#${apt.patient_id}` : '-';
    document.getElementById('modal-contact').textContent = apt.contact_number || '-';
    
    const timeSegment = `${formatTime12h(apt.appointment_time)}`;
    document.getElementById('modal-apt-time').textContent = timeSegment;
    
    document.getElementById('modal-blood-group').textContent = apt.blood_group || '-';
    document.getElementById('modal-status-text').textContent = apt.status;
    
    document.getElementById('modal-reason').textContent = apt.reason_for_visit || 'No reason provided.';

    // Manage Workspace Mode
    document.getElementById('consultation-workspace').classList.remove('hidden');
    
    const statusSelectWrapper = document.getElementById('edit-status-wrapper');
    const statusSelect = document.getElementById('modal-edit-status');
    const notesInput = document.getElementById('modal-doctor-notes');
    const rxInput = document.getElementById('modal-prescriptions');
    const followupInputs = document.getElementById('followup-section');
    const notesReadonly = document.getElementById('readonly-doctor-notes');
    const rxReadonly = document.getElementById('readonly-prescriptions');
    const feedbackSec = document.getElementById('feedback-section');
    const completeBtn = document.getElementById('complete-consultation-btn');
    
    completeBtn.dataset.aptId = apt.apt_id;

    if (apt.status === 'Completed') {
        // Read-only Mode
        statusSelectWrapper.classList.add('hidden');
        notesInput.classList.add('hidden');
        rxInput.classList.add('hidden');
        followupInputs.classList.add('hidden');
        completeBtn.classList.add('hidden');
        
        notesReadonly.classList.remove('hidden');
        rxReadonly.classList.remove('hidden');
        
        notesReadonly.textContent = apt.doctor_notes || 'No notes provided.';
        rxReadonly.textContent = apt.prescriptions || 'No prescriptions provided.';
        
        if (apt.rating > 0) {
            feedbackSec.classList.remove('hidden');
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<i data-lucide="star" class="w-4 h-4 ${i <= apt.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}"></i>`;
            }
            document.getElementById('readonly-rating-stars').innerHTML = starsHtml;
            document.getElementById('readonly-feedback').textContent = apt.feedback ? `"${apt.feedback}"` : "No specific comments left.";
            lucide.createIcons();
        } else {
            feedbackSec.classList.add('hidden');
        }
    } else {
        // Edit Mode (Upcoming or Missed)
        statusSelectWrapper.classList.remove('hidden');
        notesInput.classList.remove('hidden');
        rxInput.classList.remove('hidden');
        completeBtn.classList.remove('hidden');
        
        notesReadonly.classList.add('hidden');
        rxReadonly.classList.add('hidden');
        feedbackSec.classList.add('hidden');
        
        statusSelect.value = apt.status === 'Upcoming' ? 'Upcoming' : apt.status;
        notesInput.value = apt.doctor_notes || '';
        rxInput.value = apt.prescriptions || '';
        document.getElementById('modal-followup-date').value = '';
        document.getElementById('modal-followup-time').value = '';
        toggleFollowUpVisibility();
    }

    document.getElementById('appointment-modal').classList.remove('hidden');
}

async function submitConsultation() {
    const aptId = document.getElementById('complete-consultation-btn').dataset.aptId;
    const statusVal = document.getElementById('modal-edit-status').value;
    const notes = document.getElementById('modal-doctor-notes').value;
    const rx = document.getElementById('modal-prescriptions').value;
    const fDate = document.getElementById('modal-followup-date').value;
    const fTime = document.getElementById('modal-followup-time').value;

    const btn = document.getElementById('complete-consultation-btn');
    const oldText = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    try {
        const res = await fetch('../../api/doctor/complete_consultation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appointment_id: aptId,
                status: statusVal,
                doctor_notes: notes,
                prescriptions: rx,
                followup_date: fDate,
                followup_time: fTime
            })
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            closeAppointmentModal();
            loadScheduleForDate(selectedScheduleDate); 
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Exception: ' + e.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').classList.add('hidden');
}

function prevMonthSchedule() {
    scheduleMonth.setMonth(scheduleMonth.getMonth() - 1);
    renderScheduleCalendar();
}

function nextMonthSchedule() {
    scheduleMonth.setMonth(scheduleMonth.getMonth() + 1);
    renderScheduleCalendar();
}

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    loadDoctorProfile();
    renderScheduleCalendar();
    lucide.createIcons();
});
