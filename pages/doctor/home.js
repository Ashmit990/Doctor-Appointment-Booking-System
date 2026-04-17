let currentMonth = new Date(2026, 3); // April 2026
let currentAppointmentID = null;

const DOCTOR_API_BASE = '../../api';

function doctorNotificationIcon(title) {
    if (!title) return { icon: 'bell', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' };
    const t = title.toLowerCase();
    if (t.includes('account') || t.includes('admin'))
        return { icon: 'user-round-cog', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' };
    if (t.includes('reminder') || t.includes('appointment'))
        return { icon: 'calendar-clock', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
    return { icon: 'circle-alert', iconBg: 'bg-red-100', iconColor: 'text-red-600' };
}

function updateDoctorNotificationBadge(count) {
    const badge = document.getElementById('doctorNotificationCount');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

function updateDoctorNotificationPanelPosition() {
    const btn = document.getElementById('doctorNotificationBtn');
    const panel = document.getElementById('doctorNotificationPanel');
    if (!btn || !panel || panel.classList.contains('hidden')) return;
    const rect = btn.getBoundingClientRect();
    const panelWidth = Math.min(window.innerWidth - 32, 390);
    let left = rect.right - panelWidth;
    if (left < 16) left = 16;
    panel.style.width = `${panelWidth}px`;
    panel.style.top = `${Math.round(rect.bottom + 8)}px`;
    panel.style.left = `${Math.round(left)}px`;
}

async function loadDoctorNotifications() {
    const r = await fetch(`${DOCTOR_API_BASE}/doctor/notifications.php`, { credentials: 'include' });
    const j = await r.json();
    if (j.status !== 'success') return [];
    return j.data || [];
}

function renderDoctorNotificationList(rows) {
    const listEl = document.getElementById('doctorNotificationList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const unread = rows.filter((item) => parseInt(item.is_read, 10) === 0).length;
    updateDoctorNotificationBadge(unread);

    if (!rows.length) {
        listEl.innerHTML = '<div class="p-6 text-center text-gray-400">No notifications</div>';
        return;
    }

    rows.forEach((item) => {
        const meta = doctorNotificationIcon(item.title);
        const isUnread = parseInt(item.is_read, 10) === 0;
        const wrap = document.createElement('div');
        wrap.className = `px-5 py-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${isUnread ? 'bg-primary-light' : ''}`;
        wrap.innerHTML = `
            <div class="flex gap-4">
                <div class="relative">
                    <div class="w-10 h-10 rounded-full ${meta.iconBg} ${meta.iconColor} flex items-center justify-center">
                        <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
                    </div>
                    ${isUnread ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>` : ''}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-gray-800">${item.title}</p>
                    <p class="text-xs text-gray-600">${item.message}</p>
                    <p class="text-[10px] text-gray-400 mt-1">${new Date(item.created_at).toLocaleString()}</p>
                </div>
            </div>`;
        wrap.onclick = async () => {
            if (isUnread) {
                await fetch(`${DOCTOR_API_BASE}/doctor/notifications.php`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notification_id: item.notification_id }),
                    credentials: 'include',
                });
                const updated = await loadDoctorNotifications();
                renderDoctorNotificationList(updated);
                const statsR = await fetch(`${DOCTOR_API_BASE}/doctor/get_dashboard_stats.php`, { credentials: 'include' });
                const statsJ = await statsR.json();
                if (statsJ.status === 'success' && statsJ.data?.stats) {
                    updateDoctorNotificationBadge(statsJ.data.stats.unread_notifications || 0);
                }
            }
        };
        listEl.appendChild(wrap);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

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

async function loadDoctorProfile() {
    try {
        const response = await fetch('../../api/doctor/get_doctor_info.php');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            const doctorName = result.data.full_name || 'Doctor';
            const greetingElement = document.getElementById('greeting-message');
            if (greetingElement) {
                greetingElement.textContent = `Hello, ${doctorName}`;
            }
        }
    } catch (error) {
        console.error('Error loading doctor profile:', error);
    }
}

async function loadHomePageData() {
    const response = await fetch('../../api/doctor/get_dashboard_stats.php');
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
        const data = result.data;
        const stats = data.stats || {};
        
        document.getElementById('stat-today-visits').textContent = stats.today_appointments || 0;
        document.getElementById('stat-total-patients').textContent = data.today_appointments?.length || 0;
        document.getElementById('stat-completed').textContent = stats.completed_total || 0;
        updateDoctorNotificationBadge(stats.unread_notifications || 0);
    }
    
    renderCalendar();
    await loadAppointmentsForToday();
    await loadCompletedAppointmentsPanel();
}

async function fetchAppointmentDates() {
    const response = await fetch('../../api/doctor/appointment_dates.php?t=' + new Date().getTime());
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
        return result.data;
    }
    return [];
}

async function fetchCompletedAppointments() {
    const response = await fetch('../../api/doctor/completed_appointments.php?t=' + new Date().getTime());
    const result = await response.json();
    
    if (result.status === 'success') {
        return {
            appointments: result.data || [],
            dates: result.dates || []
        };
    }
    return { appointments: [], dates: [] };
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
    
    // Fetch both availability dates and completed appointments
    Promise.all([fetchAppointmentDates(), fetchCompletedAppointments()]).then(([appointmentDates, completedData]) => {
        // Create a Set of dates for this month only for faster lookup
        const targetYear = year;
        const targetMonth = month + 1;
        
        const datesThisMonth = new Set();
        const completedDatesThisMonth = new Set();
        
        // Process availability dates (red dots)
        appointmentDates.forEach(dateStr => {
            const parts = dateStr.trim().split('-');
            if (parts.length === 3) {
                const dateYear = parseInt(parts[0]);
                const dateMonth = parseInt(parts[1]);
                const dateDay = parseInt(parts[2]);
                
                if (dateYear === targetYear && dateMonth === targetMonth) {
                    datesThisMonth.add(dateDay);
                }
            }
        });
        
        // Process completed appointments (green checkmarks)
        completedData.dates.forEach(dateStr => {
            const parts = dateStr.trim().split('-');
            if (parts.length === 3) {
                const dateYear = parseInt(parts[0]);
                const dateMonth = parseInt(parts[1]);
                const dateDay = parseInt(parts[2]);
                
                if (dateYear === targetYear && dateMonth === targetMonth) {
                    completedDatesThisMonth.add(dateDay);
                }
            }
        });
        
        // Previous month's days
        let prevMonthDayCounter = daysInPrevMonth - firstDay + 1;
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
            
            // Mark completed appointments with checkmark
            if (completedDatesThisMonth.has(i)) {
                dayDiv.classList.add('has-completed');
            }
            // Mark availability dates with red dot
            else if (datesThisMonth.has(i)) {
                dayDiv.classList.add('has-appointment');
            }
            
            // Add click handler
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayDiv.onclick = () => loadAppointmentsForDate(dateStr);
            
            daysContainer.appendChild(dayDiv);
        }
        
        // Next month's days
        const totalCells = daysContainer.children.length;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day text-center p-2 rounded-lg text-gray-400';
            dayDiv.textContent = i;
            daysContainer.appendChild(dayDiv);
        }
    });
}

async function loadAppointmentsForToday() {
    const today = new Date().toISOString().split('T')[0];
    await loadAppointmentsForDate(today, true);
}

async function loadAppointmentsForDate(date, isToday = false) {
    const response = await fetch(`../../api/doctor/appointments_by_date.php?date=${date}`);
    const result = await response.json();
    
    const container = document.getElementById('appointments-container');
    
    if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        container.innerHTML = result.data.map(apt => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer" onclick="openAppointmentModal(${apt.apt_id})">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${apt.patient_name}</p>
                        <p class="text-sm text-gray-600">${apt.appointment_time}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                        ${apt.status}
                    </span>
                </div>
                <p class="text-sm text-gray-600">Reason: ${apt.reason_for_visit}</p>
                <p class="text-sm text-gray-600">Room: ${apt.room_number}</p>
            </div>
        `).join('');
        
        const dateObj = new Date(date);
        const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        document.getElementById('selected-date-display').textContent = isToday ? 'Today' : dateDisplay;
    } else {
        container.innerHTML = '<div class="text-center py-8 text-gray-400"><p>No appointments for this date</p></div>';
        const dateObj = new Date(date);
        const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        document.getElementById('selected-date-display').textContent = isToday ? 'Today' : dateDisplay;
    }
}

async function openAppointmentModal(appointmentID) {
    currentAppointmentID = appointmentID;
    const response = await fetch(`../../api/doctor/appointment_detail.php?apt_id=${appointmentID}`);
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
        const apt = result.data;
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('modal-patient-name').textContent = apt.patient_name;
        document.getElementById('modal-patient-id').textContent = apt.patient_id;
        document.getElementById('modal-apt-date').textContent = new Date(apt.app_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('modal-apt-time').textContent = apt.appointment_time;
        document.getElementById('modal-room-num').textContent = apt.room_number;
        document.getElementById('modal-blood-group').textContent = apt.blood_group || '-';
        document.getElementById('modal-contact').textContent = apt.contact_number || '-';
        document.getElementById('modal-reason').textContent = apt.reason_for_visit;
        
        const editSection = document.getElementById('edit-section');
        const viewSection = document.getElementById('view-section');
        
        if (apt.app_date === today) {
            editSection.classList.remove('hidden');
            viewSection.classList.add('hidden');
            document.getElementById('modal-status').value = apt.status || 'Upcoming';
            document.getElementById('modal-comments').value = apt.doctor_comments || '';
            document.getElementById('modal-medicines').value = apt.prescribed_medicines || '';
        } else {
            editSection.classList.add('hidden');
            viewSection.classList.remove('hidden');
            const status = apt.status || 'Not set';
            document.getElementById('view-status').textContent = status;
            document.getElementById('view-status').className = `font-semibold mt-1 px-3 py-1 rounded-full text-sm inline-block ${getStatusBadgeClass(status)}`;
            document.getElementById('view-comments').textContent = apt.doctor_comments || 'No comments added';
            document.getElementById('view-medicines').textContent = apt.prescribed_medicines || 'No medicines prescribed';
        }
        
        document.getElementById('appointment-modal').classList.remove('hidden');
    }
}

async function updateAppointment() {
    const status = document.getElementById('modal-status').value;
    const comments = document.getElementById('modal-comments').value;
    const medicines = document.getElementById('modal-medicines').value;
    
    const response = await fetch(`../../api/doctor/appointment_detail.php`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            appointment_id: currentAppointmentID,
            status: status,
            doctor_comments: comments, 
            prescribed_medicines: medicines 
        })
    });
    
    const result = await response.json();
    if (result.status === 'success') {
        alert('Appointment updated successfully');
        closeAppointmentModal();
        loadAppointmentsForToday();
    } else {
        alert('Error updating appointment: ' + (result.message || 'Unknown error'));
    }
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').classList.add('hidden');
    currentAppointmentID = null;
}

function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

async function loadCompletedAppointmentsPanel() {
    const completedData = await fetchCompletedAppointments();
    const container = document.getElementById('completed-appointments-container');
    
    document.getElementById('completed-count').textContent = completedData.appointments.length;
    
    if (completedData.appointments.length > 0) {
        container.innerHTML = completedData.appointments.map(apt => `
            <div class="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition cursor-pointer" onclick="openAppointmentModal(${apt.appointment_id})">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${apt.patient_name}</p>
                        <p class="text-xs text-gray-600">${new Date(apt.app_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${apt.app_time}</p>
                    </div>
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
                </div>
                <p class="text-sm text-gray-700 mb-2">${apt.reason_for_visit}</p>
                <div class="flex gap-2 flex-wrap">
                    <span class="text-xs bg-green-600 text-white px-2 py-1 rounded">Completed</span>
                    <span class="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">Room ${apt.room_num}</span>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="col-span-1 md:col-span-2 text-center py-8 text-gray-400"><p>No completed appointments</p></div>';
    }
    
    // Reinitialize lucide icons for newly added elements
    lucide.createIcons();
}

let allAppointments = [];

async function performDoctorSearch() {
    const searchTerm = document.getElementById('doctorSearchInput').value.toLowerCase().trim();
    const container = document.getElementById('appointments-container');
    
    if (searchTerm === '') {
        // Reset to today's appointments if search is cleared
        await loadAppointmentsForToday();
        return;
    }
    
    // Filter all appointments based on search term
    const filtered = allAppointments.filter(apt => 
        apt.patient_name.toLowerCase().includes(searchTerm) ||
        apt.contact_number?.toLowerCase().includes(searchTerm) ||
        apt.patient_id?.toString().includes(searchTerm)
    );
    
    if (filtered.length > 0) {
        container.innerHTML = filtered.map(apt => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer" onclick="openAppointmentModal(${apt.apt_id})">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${apt.patient_name}</p>
                        <p class="text-sm text-gray-600">${apt.appointment_time}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                        ${apt.status}
                    </span>
                </div>
                <p class="text-sm text-gray-600">Reason: ${apt.reason_for_visit}</p>
                <p class="text-sm text-gray-600">Room: ${apt.room_number}</p>
            </div>
        `).join('');
        document.getElementById('selected-date-display').textContent = `Search Results (${filtered.length})`;
    } else {
        container.innerHTML = '<div class="text-center py-8 text-gray-400"><p>No appointments match your search</p></div>';
        document.getElementById('selected-date-display').textContent = 'No Results';
    }
}

async function loadAllAppointmentsForSearch() {
    try {
        const response = await fetch('../../api/doctor/appointments.php');
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
            allAppointments = result.data;
        }
    } catch (error) {
        console.error('Error loading appointments for search:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('doctorNotificationBtn');
    const panel = document.getElementById('doctorNotificationPanel');
    const searchInput = document.getElementById('doctorSearchInput');
    const searchBtn = document.getElementById('doctorSearchBtn');

    function doctorNotificationBarToggle(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!panel) return;
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            requestAnimationFrame(() => {
                updateDoctorNotificationPanelPosition();
                loadDoctorNotifications().then((rows) => renderDoctorNotificationList(rows));
            });
        }
    }

    if (btn && panel) {
        window.__doctorNotificationBarToggle = doctorNotificationBarToggle;
    }

    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', performDoctorSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performDoctorSearch();
            }
        });
    }

    updateCurrentDate();
    loadDoctorProfile();
    loadAllAppointmentsForSearch();
    loadHomePageData();
    loadDoctorNotifications().then((rows) => renderDoctorNotificationList(rows));

    window.addEventListener('resize', () => updateDoctorNotificationPanelPosition());
    window.addEventListener('orientationchange', () => {
        requestAnimationFrame(() => updateDoctorNotificationPanelPosition());
    });

    document.addEventListener(
        'click',
        (e) => {
            setTimeout(() => {
                if (
                    !panel ||
                    !btn ||
                    panel.classList.contains('hidden') ||
                    btn.contains(e.target) ||
                    panel.contains(e.target)
                ) {
                    return;
                }
                panel.classList.add('hidden');
            }, 0);
        },
        false,
    );

    document.getElementById('doctorMarkAllReadBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await fetch(`${DOCTOR_API_BASE}/doctor/notifications.php`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' }),
        });
        updateDoctorNotificationBadge(0);
        const updated = await loadDoctorNotifications();
        renderDoctorNotificationList(updated);
    });

    lucide.createIcons();
});

// Check session when page becomes visible (e.g., on back button)
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Verify session by checking if user is still logged in
    const response = await fetch(`${DOCTOR_API_BASE}/auth/session_info.php`, { credentials: 'include' });
    const data = await response.json();
    if (!data.logged_in || data.role !== 'Doctor') {
      window.location.href = '../auth/login.html';
    }
  }
});
