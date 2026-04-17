let currentMonth = new Date();
let appointmentDates = [];

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Missed': return 'bg-red-100 text-red-800';
        case 'Cancelled': return 'bg-gray-100 text-gray-800';
        case 'Upcoming': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

async function loadAdminInfo() {
    try {
        const response = await fetch('../../api/admin/get_admin_info.php', {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            const admin = result.data;
            document.getElementById('admin-avatar').textContent = admin.full_name.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch('../../api/admin/dashboard_stats.php', {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            const data = result.data;
            
            document.getElementById('stat-patients').textContent = data.total_patients;
            document.getElementById('stat-doctors').textContent = data.total_doctors;
            document.getElementById('stat-upcoming').textContent = data.total_upcoming;
            document.getElementById('stat-completed').textContent = data.total_completed;
            
            appointmentDates = data.appointment_dates || [];
            renderCalendar();
            displayRecentAppointments(data.recent_appointments);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('calendar-month').textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let dayCounter = 1;
    let prevMonthDayCounter = daysInPrevMonth - firstDay + 1;
    
    // Previous month's days
    for (let i = 0; i < firstDay; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day text-center p-2 rounded-lg text-gray-400';
        dayDiv.textContent = prevMonthDayCounter;
        daysContainer.appendChild(dayDiv);
        prevMonthDayCounter++;
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day text-center p-2 rounded-lg cursor-pointer hover:bg-blue-100 transition text-gray-900 font-medium';
        dayDiv.textContent = i;
        
        const appointmentForDay = appointmentDates.find(a => a.day == i);
        if (appointmentForDay) {
            if (appointmentForDay.status === 'Completed') {
                dayDiv.classList.add('has-completed');
            } else if (appointmentForDay.status === 'Upcoming') {
                dayDiv.classList.add('has-appointment');
            }
        }
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dayDiv.onclick = () => loadAppointmentsForDate(dateStr);
        
        daysContainer.appendChild(dayDiv);
    }
    
    // Next month's days
    let nextMonthDay = 1;
    const totalCells = daysContainer.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day text-center p-2 rounded-lg text-gray-400';
        dayDiv.textContent = nextMonthDay;
        daysContainer.appendChild(dayDiv);
        nextMonthDay++;
    }
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

async function loadAppointmentsForDate(dateStr) {
    try {
        const response = await fetch(`../../api/admin/appointment_details.php?date=${dateStr}`, {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            displayAppointmentModal(result.data, dateStr);
        } else {
            showToast('No appointments found for this date');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showToast('Error loading appointments');
    }
}

function displayAppointmentModal(appointments, dateStr) {
    const modal = document.getElementById('appointment-modal');
    const content = document.getElementById('appointment-modal-content');
    
    if (appointments.length === 0) {
        content.innerHTML = `
            <h2 class="text-xl font-bold mb-4">Appointments for ${dateStr}</h2>
            <p class="text-gray-500">No appointments scheduled for this date</p>
        `;
    } else {
        let html = `<h2 class="text-xl font-bold mb-4">Appointments for ${dateStr}</h2>
                    <div class="space-y-3">`;
        
        for (const apt of appointments) {
            html += `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-semibold text-gray-800">${apt.patient_name} <span class="text-gray-500 font-normal">→</span> ${apt.doctor_name}</p>
                            <p class="text-sm text-gray-600">${apt.specialization || 'N/A'}</p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(apt.status)}">${apt.status}</span>
                    </div>
                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>Time:</strong> ${apt.app_time}</p>
                        <p><strong>Room:</strong> ${apt.room_num}</p>
                        <p><strong>Reason:</strong> ${apt.reason_for_visit}</p>
                        ${apt.doctor_comments ? `<p><strong>Comments:</strong> ${apt.doctor_comments}</p>` : ''}
                    </div>
                </div>
            `;
        }
        html += '</div>';
        content.innerHTML = html;
    }
    
    modal.classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').classList.remove('active');
}

function displayRecentAppointments(appointments) {
    const container = document.getElementById('recent-appointments-list');
    
    if (appointments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No appointments yet</p>';
        return;
    }
    
    let html = '';
    for (const apt of appointments.slice(0, 5)) {
        html += `
            <div class="border-b border-gray-100 pb-2 last:border-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate">${apt.patient_name}</p>
                        <p class="text-xs text-gray-500">with ${apt.doctor_name} • ${apt.app_date} ${apt.app_time}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getStatusBadgeClass(apt.status)}">${apt.status}</span>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../../api/auth/logout.php';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    loadAdminInfo();
    loadDashboardStats();
    
    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
});
// Check session when page becomes visible (e.g., on back button)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Verify session by checking if user is still logged in
    const response = await fetch('../../api/auth/session_info.php', { credentials: 'include' });
    const data = await response.json();
    if (!data.logged_in || data.role !== 'Admin') {
      window.location.href = '../auth/login.html';
    }
  }
});