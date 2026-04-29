let currentRequests = [];
let pendingAction = null; // { action: 'approve' or 'reject', approvalId: number, doctorName: string }

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  loadApprovals();
  setupModal();
  setupDoctorDetailsModal(); // Initialize the doctor details popup
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

      // Get a short preview of bio
      const bioPreview = req.bio
        ? req.bio.length > 60
          ? req.bio.substring(0, 60) + "..."
          : req.bio
        : "No bio provided";

      return `
      <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold shrink-0 cursor-pointer" onclick='showDoctorDetails(${JSON.stringify(req).replace(/'/g, "&#39;")})'>
              ${initial}
            </div>
            <div>
              <p class="font-semibold text-gray-800 cursor-pointer hover:text-teal" onclick='showDoctorDetails(${JSON.stringify(req).replace(/'/g, "&#39;")})'>${escapeHtml(req.full_name)}</p>
              <p class="text-xs text-gray-500">${escapeHtml(req.email)}</p>
            </div>
          </div>
         </td>
        <td class="px-5 py-4">
          <p class="font-medium text-gray-700">${escapeHtml(req.specialization)}</p>
          <p class="text-xs text-gray-500 mt-1">Fee: $${fee}</p>
         </td>
        <td class="px-5 py-4 hidden md:table-cell max-w-xs">
          <p class="text-sm text-gray-600 truncate" title="${escapeHtml(req.bio || "")}">${escapeHtml(bioPreview)}</p>
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

// Setup modal event listeners for confirmation modal
function setupModal() {
  const modal = document.getElementById("confirmModal");
  const cancelBtn = document.getElementById("modalCancelBtn");
  const confirmBtn = document.getElementById("modalConfirmBtn");

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

function openConfirmModal(action, approvalId, doctorName) {
  const modal = document.getElementById("confirmModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  const actionText = action === "approve" ? "Approve" : "Reject";

  modalTitle.textContent = `${actionText} Doctor`;
  modalMessage.textContent = `Are you sure you want to ${action.toLowerCase()} Dr. ${doctorName}?`;

  if (action === "approve") {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark transition-colors shadow-sm cursor-pointer";
  } else {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-sm cursor-pointer";
  }

  pendingAction = { action, approvalId, doctorName };

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
      loadApprovals();
    } else {
      showToast(result.message || "Error processing request", true);
    }
  } catch (error) {
    showToast("Failed to connect to the server", true);
    console.error("Error action:", error);
  }
}

// ---------- DOCTOR DETAILS POPUP MODAL ----------
function setupDoctorDetailsModal() {
  if (!document.getElementById("doctorDetailsModal")) {
    const modalHTML = `
      <div id="doctorDetailsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden" style="backdrop-filter: blur(3px);">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-200">
          <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold text-teal-dark">Doctor Profile Details</h3>
            <button onclick="closeDoctorDetailsModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6" id="doctorDetailsContent">
            <!-- Dynamic content will be inserted here -->
          </div>
          <div class="sticky bottom-0 bg-gray-50 px-6 py-3 flex justify-end border-t">
            <button onclick="closeDoctorDetailsModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("doctorDetailsModal");
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDoctorDetailsModal();
    });
  }
}

function showDoctorDetails(doctor) {
  // Get all fields from the database table
  const fullName = doctor.full_name || "N/A";
  const email = doctor.email || "N/A";
  const specialization = doctor.specialization || "N/A";
  const consultationFee = doctor.consultation_fee
    ? `$${parseFloat(doctor.consultation_fee).toFixed(2)}`
    : "N/A";
  const bio = doctor.bio || "No bio provided.";
  const status = doctor.status || "N/A";
  const submittedAt = doctor.submitted_at
    ? new Date(doctor.submitted_at).toLocaleString()
    : "N/A";
  const reviewedAt = doctor.reviewed_at
    ? new Date(doctor.reviewed_at).toLocaleString()
    : "Not reviewed yet";

  // For password_hash - don't show actual hash, just show that it exists
  const hasPassword = doctor.password_hash
    ? "Yes (secured)"
    : "No password set";

  // The bio might contain additional information like experience, qualifications
  // Let's try to extract any structured info from bio if it contains key phrases
  let experience = "N/A";
  let qualification = "N/A";
  let phone = "N/A";
  let age = "N/A";
  let address = "N/A";

  // Parse bio for additional information if it contains certain patterns
  if (bio && bio !== "No bio provided.") {
    // Look for experience patterns (e.g., "10+ years", "5 years experience")
    const expMatch = bio.match(
      /(\d+[\+]?\s*(?:years?|yrs?)(?:\s+of\s+experience)?)/i,
    );
    if (expMatch) experience = expMatch[1];

    // Look for qualification patterns
    const qualKeywords = [
      "MD",
      "MBBS",
      "PhD",
      "Bachelor",
      "Master",
      "Degree",
      "Diploma",
      "Certified",
      "Board Certified",
    ];
    for (const keyword of qualKeywords) {
      if (bio.includes(keyword)) {
        // Extract the part containing the keyword
        const parts = bio.split(/[.,;]/);
        for (const part of parts) {
          if (part.includes(keyword) && part.length < 100) {
            qualification = part.trim();
            break;
          }
        }
        if (qualification !== "N/A") break;
      }
    }

    // Look for phone numbers
    const phoneMatch = bio.match(
      /(?:phone|contact|mobile|tel|call)[:\s]*[\+]?[\d\s\-\(\)]{8,}/i,
    );
    if (phoneMatch)
      phone = phoneMatch[0].replace(
        /^(phone|contact|mobile|tel|call)[:\s]*/i,
        "",
      );

    // Look for age
    const ageMatch = bio.match(/age[:\s]*(\d{1,3})/i);
    if (ageMatch) age = ageMatch[1];
  }

  const contentHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Full Name</label>
          <p class="font-medium text-gray-800">${escapeHtml(fullName)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Email</label>
          <p class="font-medium text-gray-800">${escapeHtml(email)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Phone Number</label>
          <p class="font-medium text-gray-800">${escapeHtml(phone)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Age</label>
          <p class="font-medium text-gray-800">${escapeHtml(String(age))}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Specialization</label>
          <p class="font-medium text-gray-800">${escapeHtml(specialization)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Consultation Fee</label>
          <p class="font-medium text-gray-800">${escapeHtml(consultationFee)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Experience</label>
          <p class="font-medium text-gray-800">${escapeHtml(experience)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Qualification</label>
          <p class="font-medium text-gray-800">${escapeHtml(qualification)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Password Status</label>
          <p class="font-medium text-gray-800">${escapeHtml(hasPassword)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
          <label class="text-xs text-gray-400 uppercase font-semibold">Address / Location</label>
          <p class="font-medium text-gray-800">${escapeHtml(address)}</p>
        </div>
      </div>
      
      <div class="bg-gray-50 p-3 rounded-lg">
        <label class="text-xs text-gray-400 uppercase font-semibold">Bio / Description</label>
        <p class="text-gray-700 mt-1 whitespace-pre-wrap">${escapeHtml(bio)}</p>
      </div>
      
      <div class="bg-gray-50 p-3 rounded-lg">
        <label class="text-xs text-gray-400 uppercase font-semibold">Status</label>
        <p class="font-medium">
          <span class="inline-block px-2 py-1 rounded-full text-xs ${status === "Accepted" ? "bg-green-100 text-green-700" : status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}">
            ${escapeHtml(status)}
          </span>
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Submitted At</label>
          <p class="font-medium text-gray-800">${escapeHtml(submittedAt)}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400 uppercase font-semibold">Reviewed At</label>
          <p class="font-medium text-gray-800">${escapeHtml(reviewedAt)}</p>
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById("doctorDetailsModal");
  const contentDiv = document.getElementById("doctorDetailsContent");
  if (modal && contentDiv) {
    contentDiv.innerHTML = contentHTML;
    modal.classList.remove("hidden");
    const modalContent = modal.querySelector(".bg-white");
    if (modalContent) {
      modalContent.style.opacity = "0";
      modalContent.style.transform = "scale(0.95)";
      setTimeout(() => {
        modalContent.style.transition =
          "opacity 0.2s ease, transform 0.2s ease";
        modalContent.style.opacity = "1";
        modalContent.style.transform = "scale(1)";
      }, 10);
    }
  }
}

function closeDoctorDetailsModal() {
  const modal = document.getElementById("doctorDetailsModal");
  if (modal) {
    const modalContent = modal.querySelector(".bg-white");
    if (modalContent) {
      modalContent.style.opacity = "0";
      modalContent.style.transform = "scale(0.95)";
    }
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 150);
  }
}
