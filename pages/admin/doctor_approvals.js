let currentRequests = [];

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    loadApprovals();
});

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('overlay').classList.toggle('hidden');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('overlay').classList.add('hidden');
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (isError) {
        toast.style.background = '#ef4444'; // Red for error
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function loadApprovals() {
    const tbody = document.getElementById('approvals-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">Loading...</td></tr>';
    
    try {
        const response = await fetch('../../api/admin/doctor_approvals.php');
        const result = await response.json();
        
        if (result.status === 'success') {
            currentRequests = result.data || [];
            renderApprovals();
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">${result.message || 'Error loading requests'}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-500">Failed to connect to the server</td></tr>';
        console.error('Error fetching approvals:', error);
    }
}

function renderApprovals() {
    const tbody = document.getElementById('approvals-table-body');
    
    if (currentRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500 font-medium">No pending approval requests.</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentRequests.map(req => {
        // Prepare initials
        const initial = req.full_name ? req.full_name.charAt(0).toUpperCase() : '?';
        
        return `
        <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold shrink-0">
                        ${initial}
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">${req.full_name}</p>
                        <p class="text-xs text-gray-500">${req.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-5 py-4 hidden md:table-cell">
                <p class="font-medium text-gray-700">${req.specialization}</p>
                <p class="text-xs text-gray-500 mt-1">Fee: $${parseFloat(req.consultation_fee).toFixed(2)}</p>
            </td>
            <td class="px-5 py-4 hidden sm:table-cell max-w-xs">
                <p class="text-sm text-gray-600 truncate" title="${req.bio || ''}">${req.bio || 'No bio provided.'}</p>
                <p class="text-xs text-gray-400 mt-1">Submitted: ${new Date(req.submitted_at).toLocaleDateString()}</p>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                    <button onclick="handleAction('approve', ${req.approval_id})" class="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        Approve
                    </button>
                    <button onclick="handleAction('reject', ${req.approval_id})" class="text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        Reject
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

async function handleAction(action, approvalId) {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${actionText} this doctor?`)) return;
    
    try {
        const response = await fetch('../../api/admin/doctor_approvals.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: action, approval_id: approvalId })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showToast(result.message);
            // Reload the list
            loadApprovals();
        } else {
            showToast(result.message || 'Error processing request', true);
        }
    } catch (error) {
        showToast('Failed to connect to the server', true);
        console.error('Error action:', error);
    }
}
