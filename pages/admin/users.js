/*
  USERS PAGE - PATIENTS MANAGEMENT
  ================================
  Clean reorganized version with all utilities first
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allPatients = [];
let filteredPatients = [];
let currentEditId = null;

console.log('✓ users.js file loading...');

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

// ==================== LOAD DATA ====================
async function loadPatients(page = 1) {
    try {
        currentPage = page;
        console.log('► Fetching patients page:', page);
        
        const response = await fetch(`../../api/admin/patients.php?page=${page}&limit=10`, {
            credentials: 'include'
        });
        
        console.log('✓ API Response:', response.status);
        const result = await response.json();
        console.log('✓ Data received:', result);
        
        if (result && result.status === 'success') {
            allPatients = result.data || [];
            filteredPatients = result.data || [];
            
            const totalPagesEl = document.getElementById('total-pages');
            if (totalPagesEl) {
                totalPagesEl.textContent = result.pages || 1;
            }
            
            displayPatients();
        } else {
            console.warn('⚠ API returned error');
            showToast('Error loading patients');
        }
    } catch (error) {
        console.error('✗ Fetch error:', error);
        showToast('Error loading patients: ' + error.message);
    }
}

// ==================== DISPLAY DATA ====================
function displayPatients() {
    try {
        console.log('► Displaying', filteredPatients.length, 'patients');
        
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) {
            console.warn('⚠ Table tbody not found!');
            return;
        }
        
        if (!filteredPatients || filteredPatients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No patients found</td></tr>';
            return;
        }
        
        let html = '';
        for (const patient of filteredPatients) {
            const fullName = (patient.full_name || '').replace(/'/g, "\\'");
            const email = (patient.email || '').replace(/'/g, "\\'");
            
            html += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-5 py-4 text-sm font-semibold">${fullName}</td>
                    <td class="px-5 py-4 text-sm">${email}</td>
                    <td class="px-5 py-4 text-sm hidden md:table-cell">${patient.contact_number || 'N/A'}</td>
                    <td class="px-5 py-4 text-sm">${patient.total_appointments || 0}</td>
                    <td class="px-5 py-4">
                        <div class="flex gap-2">
                            <button onclick="openEditModal('${patient.user_id}', '${fullName}', '${email}')" class="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-semibold">Edit</button>
                            <button onclick="deletePatient('${patient.user_id}')" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold">Delete</button>
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
function filterPatients() {
    const searchText = (document.getElementById('searchInput')?.value || '').toLowerCase();
    filteredPatients = allPatients.filter(p =>
        (p.full_name || '').toLowerCase().includes(searchText) ||
        (p.email || '').toLowerCase().includes(searchText) ||
        (p.contact_number && p.contact_number.includes(searchText))
    );
    displayPatients();
}

// ==================== EDIT MODAL ====================
function openEditModal(patientId, name, email) {
    try {
        console.log('► Opening edit for:', patientId);
        currentEditId = patientId;
        
        const editName = document.getElementById('editName');
        const editEmail = document.getElementById('editEmail');
        
        if (editName) editName.value = name;
        if (editEmail) editEmail.value = email;
        
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
    savePatient(e);
}

// ==================== SAVE ====================
async function savePatient(event) {
    event.preventDefault();
    console.log('═══ SAVE START ═══');
    console.log('ID:', currentEditId);
    
    const name = (document.getElementById('editName')?.value || '').trim();
    const email = (document.getElementById('editEmail')?.value || '').trim();
    
    console.log('Data:', { name, email });
    
    if (!currentEditId || !name || !email) {
        console.warn('⚠ Validation failed');
        showToast('Please fill in all fields');
        return;
    }
    
    try {
        console.log('► Sending to API...');
        
        const payload = {
            patient_id: currentEditId,
            full_name: name,
            email: email
        };
        
        const response = await fetch('../../api/admin/patients.php', {
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
            showToast('Patient updated!');
            closeEditModal();
            loadPatients(currentPage);
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
async function deletePatient(patientId) {
    if (!confirm('Delete this patient?')) return;
    
    try {
        const response = await fetch('../../api/admin/patients.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ patient_id: patientId })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showToast('Patient deleted!');
            loadPatients(currentPage);
        } else {
            showToast('Error deleting patient');
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
        loadPatients(currentPage);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        document.getElementById('current-page').textContent = currentPage;
        loadPatients(currentPage);
    }
}

// ==================== PAGE INIT ====================
document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    try {
        console.log('╔═══════════════════════════════════╗');
        console.log('║   USERS PAGE INITIALIZATION       ║');
        console.log('╚═══════════════════════════════════╝');
        
        updateCurrentDate();
        loadPatients();
        
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
