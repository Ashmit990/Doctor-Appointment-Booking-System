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

function selectScheduleDate(date) {
    selectedScheduleDate = date;
    document.getElementById('schedule-selected-date').value = date;
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    
    const dateObj = new Date(date + 'T00:00:00');
    const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('schedule-date-display').textContent = dateDisplay;
    
    loadScheduleForDate(date);
}

async function loadScheduleForDate(date) {
    const response = await fetch(`../../api/doctor/availability.php?date=${date}`);
    const result = await response.json();
    
    const container = document.getElementById('existing-availability');
    
    if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        container.innerHTML = result.data.map(avail => `
            <div class="flex justify-between items-center p-4 border-2 border-primary border-opacity-30 rounded-lg hover:bg-blue-50 transition">
                <div>
                    <p class="font-semibold text-gray-900">${avail.start_time} - ${avail.end_time}</p>
                    <p class="text-sm text-gray-600">Click to edit</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="openEditModal(${avail.avail_id}, '${avail.start_time}', '${avail.end_time}', '${date}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600">
                        Edit
                    </button>
                    <button onclick="deleteSchedule(${avail.avail_id})" class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="text-center py-8 text-gray-400"><p>No schedules for this date</p></div>';
    }
}

async function saveAvailability() {
    const date = selectedScheduleDate;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (!date || !startTime || !endTime) {
        alert('Please fill all fields');
        return;
    }
    
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
        alert('Schedule saved successfully');
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
        loadScheduleForDate(date);
    } else {
        alert('Error saving schedule: ' + result.message);
    }
}

async function deleteSchedule(availId) {
    if (confirm('Are you sure you want to delete this schedule?')) {
        const response = await fetch(`../../api/doctor/availability.php?avail_id=${availId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('Schedule deleted successfully');
            loadScheduleForDate(selectedScheduleDate);
        } else {
            alert('Error deleting schedule');
        }
    }
}

function openEditModal(availId, startTime, endTime, date) {
    currentEditAvailId = availId;
    document.getElementById('edit-schedule-date').value = date;
    document.getElementById('edit-start-time').value = startTime;
    document.getElementById('edit-end-time').value = endTime;
    document.getElementById('edit-schedule-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-schedule-modal').classList.add('hidden');
    currentEditAvailId = null;
}

async function updateSchedule() {
    const startTime = document.getElementById('edit-start-time').value;
    const endTime = document.getElementById('edit-end-time').value;
    
    if (!startTime || !endTime) {
        alert('Please fill all fields');
        return;
    }
    
    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }
    
    const response = await fetch('../../api/doctor/availability.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            avail_id: currentEditAvailId,
            start_time: startTime,
            end_time: endTime
        })
    });
    
    const result = await response.json();
    if (result.status === 'success') {
        alert('Schedule updated successfully');
        closeEditModal();
        loadScheduleForDate(selectedScheduleDate);
    } else {
        alert('Error updating schedule: ' + result.message);
    }
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
