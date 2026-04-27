let currentRequests = [];
let pendingAction = null; // { action: 'approve' or 'reject', approvalId: number, doctorName: string }

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  loadApprovals();
  setupModal();
});

function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateElem = document.getElementById("current-date");
  if (dateElem)
    dateElem.textContent = new Date().toLocaleDateString("en-US", options);
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("overlay").classList.toggle("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("overlay").classList.add("hidden");
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  if (isError) toast.style.background = "#ef4444";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function loadApprovals() {
  const tbody = document.getElementById("approvals-table-body");
  tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500">Loading...</td></tr>`;

  try {
    const response = await fetch("../../api/admin/doctor_approvals.php");
    const result = await response.json();

    if (result.status === "success") {
      currentRequests = result.data || [];
      renderApprovals();
    } else {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">${result.message || "Error loading requests"}</td></tr>`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">Failed to connect to the server</td></tr>`;
    console.error("Error fetching approvals:", error);
  }
}

function renderApprovals() {
  const tbody = document.getElementById("approvals-table-body");

  if (currentRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500 font-medium">No pending approval requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentRequests
    .map((req) => {
      const initial = req.full_name
        ? req.full_name.charAt(0).toUpperCase()
        : "?";
      const submittedDate = new Date(req.submitted_at).toLocaleDateString();
      const fee = parseFloat(req.consultation_fee).toFixed(2);
      const bioText = req.bio || "No bio provided.";

      return `
      <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold shrink-0">
              ${initial}
            </div>
            <div>
              <p class="font-semibold text-gray-800">${escapeHtml(req.full_name)}</p>
              <p class="text-xs text-gray-500">${escapeHtml(req.email)}</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <p class="font-medium text-gray-700">${escapeHtml(req.specialization)}</p>
          <p class="text-xs text-gray-500 mt-1">Fee: $${fee}</p>
        </td>
        <td class="px-5 py-4 hidden md:table-cell max-w-xs">
          <p class="text-sm text-gray-600 truncate" title="${escapeHtml(bioText)}">${escapeHtml(bioText.substring(0, 80))}${bioText.length > 80 ? "..." : ""}</p>
          <p class="text-xs text-gray-400 mt-1">Submitted: ${submittedDate}</p>
        </td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-2">
            <button onclick="openConfirmModal('approve', ${req.approval_id}, '${escapeHtml(req.full_name)}')" 
                    class="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Approve
            </button>
            <button onclick="openConfirmModal('reject', ${req.approval_id}, '${escapeHtml(req.full_name)}')" 
                    class="text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Simple escape to prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    })
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
      return c;
    });
}

// Setup modal event listeners
function setupModal() {
  const modal = document.getElementById("confirmModal");
  const cancelBtn = document.getElementById("modalCancelBtn");
  const confirmBtn = document.getElementById("modalConfirmBtn");

  // Close modal when clicking outside content (on backdrop)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  cancelBtn.addEventListener("click", () => {
    closeModal();
  });

  confirmBtn.addEventListener("click", async () => {
    if (!pendingAction) return;
    closeModal();
    await executeAction(pendingAction.action, pendingAction.approvalId);
    pendingAction = null;
  });
}

// Open centered popup modal (NO browser confirm)
function openConfirmModal(action, approvalId, doctorName) {
  const modal = document.getElementById("confirmModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const actionText = action === "approve" ? "Approve" : "Reject";
  const actionColor = action === "approve" ? "teal" : "rose";

  modalTitle.textContent = `${actionText} Doctor`;
  modalMessage.textContent = `Are you sure you want to ${action.toLowerCase()} Dr. ${doctorName}?`;

  // Style confirm button based on action
  if (action === "approve") {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark transition-colors shadow-sm cursor-pointer";
  } else {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-sm cursor-pointer";
  }

  // Store pending action
  pendingAction = { action, approvalId, doctorName };

  // Show modal with animation
  modal.classList.remove("hidden");
  const modalContent = document.getElementById("modalContent");
  modalContent.style.opacity = "0";
  modalContent.style.transform = "scale(0.95)";
  setTimeout(() => {
    modalContent.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    modalContent.style.opacity = "1";
    modalContent.style.transform = "scale(1)";
  }, 10);
}

function closeModal() {
  const modal = document.getElementById("confirmModal");
  const modalContent = document.getElementById("modalContent");
  if (modalContent) {
    modalContent.style.opacity = "0";
    modalContent.style.transform = "scale(0.95)";
  }
  setTimeout(() => {
    modal.classList.add("hidden");
    pendingAction = null;
  }, 150);
}

// Execute the actual API call
async function executeAction(action, approvalId) {
  try {
    const response = await fetch("../../api/admin/doctor_approvals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, approval_id: approvalId }),
    });

    const result = await response.json();

    if (result.status === "success") {
      showToast(result.message);
      loadApprovals(); // Refresh the list
    } else {
      showToast(result.message || "Error processing request", true);
    }
  } catch (error) {
    showToast("Failed to connect to the server", true);
    console.error("Error action:", error);
  }
}
