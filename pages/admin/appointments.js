/*
  APPOINTMENTS PAGE - MANAGE APPOINTMENTS
  ======================================
  Clean reorganized version with all utilities first
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allAppointments = [];
let filteredAppointments = [];
let currentEditId = null;

console.log('✓ appointments.js file loading...');

// ==================== UTILITIES (Must be first!) ====================
function showToast(message) {
    try {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    } catch (e) {
        console.error('Toast error:', e);
    }
}

function updateCurrentDate() {
    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString('en-US', options);
        }
    } catch (e) {
        console.error('✗ Date error:', e);
    }
}

function toggleSidebar() {
    try {
        document.getElementById('sidebar').classList.toggle('-translate-x-full');
        document.getElementById('overlay').classList.toggle('hidden');
    } catch (e) {
        console.error('✗ Sidebar error:', e);
    }
}

function closeSidebar() {
    try {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('overlay').classList.add('hidden');
    } catch (e) {
        console.error('✗ Close sidebar error:', e);
    }
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

// ==================== LOAD DATA ====================
async function loadAppointments(page = 1) {
    try {
        currentPage = page;
        console.log('► Fetching appointments page:', page);
        
        const response = await fetch(`../../api/admin/appointments.php?page=${page}&limit=10`, {
            credentials: 'include'
        });
        
        console.log('✓ API Response:', response.status);
        const result = await response.json();
        console.log('✓ Data received:', result);
        
        if (result && result.status === 'success') {
            allAppointments = result.data || [];
            filteredAppointments = result.data || [];
            
            const totalPagesEl = document.getElementById('total-pages');
            if (totalPagesEl) {
                totalPagesEl.textContent = result.pages || 1;
            }
            
            displayAppointments();
        } else {
            console.warn('⚠ API returned error');
            showToast('Error loading appointments');
        }
    } catch (error) {
        console.error('✗ Fetch error:', error);
        showToast('Error loading appointments: ' + error.message);
    }
}

// ==================== DISPLAY DATA ====================
function displayAppointments() {
    try {
        console.log('► Displaying', filteredAppointments.length, 'appointments');
        
        const tbody = document.getElementById('appointments-table-body');
        if (!tbody) {
            console.warn('⚠ Table tbody not found!');
            return;
        }
        
        if (!filteredAppointments || filteredAppointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No appointments found</td></tr>';
            return;
        }
        
        let html = '';
        for (const apt of filteredAppointments) {
            const comments = (apt.doctor_comments || '').replace(/'/g, "\\'");
            
            html += `
                <tr class="border-b hover:bg-gray-50 transition-colors">
                    <td class="px-5 py-4 text-sm">${apt.patient_name}</td>
                    <td class="px-5 py-4 text-sm">${apt.doctor_name}</td>
                    <td class="px-5 py-4 text-sm">${apt.app_date} ${apt.app_time}</td>
                    <td class="px-5 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(apt.status)}">${apt.status}</span>
                    </td>
                    <td class="px-5 py-4">
                        <div class="flex gap-2">
                            <button onclick="openEditModal(${apt.appointment_id}, '${apt.status}', '${comments}')" class="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-semibold">Edit</button>
                            <button onclick="deleteAppointment(${apt.appointment_id})" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-semibold">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
        console.log('✓ Table updated');
    } catch (e) {
        console.error('✗ Display error:', e);
    }
}

// ==================== FILTER ====================
function filterAppointments() {
    const searchText = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    filteredAppointments = allAppointments.filter(apt => {
        const matchesSearch = (apt.patient_name || '').toLowerCase().includes(searchText) ||
                             (apt.doctor_name || '').toLowerCase().includes(searchText) ||
                             (apt.app_date && apt.app_date.includes(searchText));
        const matchesStatus = !statusFilter || apt.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    displayAppointments();
}

// ==================== EDIT MODAL ====================
function openEditModal(appointmentId, status, comments) {
    try {
        console.log('► Opening edit for:', appointmentId);
        currentEditId = appointmentId;
        
        const editStatus = document.getElementById('editStatus');
        const editComments = document.getElementById('editComments');
        
        if (editStatus) editStatus.value = status;
        if (editComments) editComments.value = comments;
        
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.add('active');
    } catch (e) {
        console.error('✗ Modal error:', e);
    }
}

function closeEditModal() {
    try {
        document.getElementById('editModal').classList.remove('active');
        currentEditId = null;
    } catch (e) {
        console.error('✗ Close modal error:', e);
    }
}

// ==================== FORM HANDLER ====================
function handleFormSubmit(e) {
    console.log('>>> FORM SUBMITTED');
    e.preventDefault();
    saveAppointment(e);
}

// ==================== SAVE ====================
async function saveAppointment(event) {
    event.preventDefault();
    console.log('═══ SAVE START ═══');
    console.log('ID:', currentEditId);
    
    const status = (document.getElementById('editStatus')?.value || '').trim();
    const comments = (document.getElementById('editComments')?.value || '').trim();
    
    console.log('Data:', { status, comments });
    
    if (!currentEditId || !status) {
        console.warn('⚠ Validation failed');
        showToast('Status is required');
        return;
    }
    
    try {
        console.log('► Sending to API...');
        
        const payload = {
            appointment_id: currentEditId,
            status: status,
            doctor_comments: comments
        };
        
        const response = await fetch('../../api/admin/appointments.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        
        console.log('✓ Response:', response.status);
        const result = await response.json();
        console.log('✓ Result:', result);
        
        if (result.status === 'success') {
            console.log('✓✓✓ SUCCESS ✓✓✓');
            showToast('Appointment updated!');
            closeEditModal();
            loadAppointments(currentPage);
        } else {
            console.warn('✗ API error:', result.message);
            showToast(result.message || 'Error saving');
        }
    } catch (error) {
        console.error('✗ Exception:', error);
        showToast('Error: ' + error.message);
    }
    console.log('═══ SAVE END ═══');
}

// ==================== DELETE ====================
async function deleteAppointment(appointmentId) {
    if (!confirm('Delete this appointment?')) return;
    
    try {
        const response = await fetch('../../api/admin/appointments.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ appointment_id: appointmentId })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showToast('Appointment deleted!');
            loadAppointments(currentPage);
        } else {
            showToast('Error deleting appointment');
        }
    } catch (error) {
        showToast('Error: ' + error.message);
    }
}

// ==================== PAGINATION ====================
function nextPage() {
    const totalPages = parseInt(document.getElementById('total-pages')?.textContent || '1');
    if (currentPage < totalPages) {
        currentPage++;
        document.getElementById('current-page').textContent = currentPage;
        loadAppointments(currentPage);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        document.getElementById('current-page').textContent = currentPage;
        loadAppointments(currentPage);
    }
}

// ==================== PAGE INIT ====================
document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    try {
        console.log('╔═══════════════════════════════════╗');
        console.log('║  APPOINTMENTS PAGE INITIALIZATION ║');
        console.log('╚═══════════════════════════════════╝');
        
        updateCurrentDate();
        loadAppointments();
        
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', handleFormSubmit);
            console.log('✓ Form listener attached');
        } else {
            console.warn('⚠ editForm not found');
        }
        
        console.log('✓ Page ready');
    } catch (err) {
        console.error('✗ INIT ERROR:', err);
        showToast('Page load error: ' + err.message);
    }
}
