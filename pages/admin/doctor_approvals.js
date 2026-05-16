let currentRequests = [];
let pendingAction = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  loadApprovals();

  loadCategories();
  loadAllTickets(); // New: Load global ticket list
  setupModal();
  setupDoctorDetailsModal();
  setupCategoryForm();
  setupTicketFilters(); // New: Search & Filter for tickets
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

    // Debug: log raw response to check if JSON is valid
    const rawText = await response.text();
    console.log("Raw API response:", rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">Invalid response from server. Check console.</td></tr>`;
      return;
    }

    if (result.status === "success") {
      currentRequests = result.data || [];
      console.log("First record sample:", currentRequests[0]); // Debug parsed fields
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
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500 font-medium">No pending approval requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentRequests
    .map((req) => {
      const initial = req.full_name
        ? req.full_name.charAt(0).toUpperCase()
        : "?";
      const submittedDate = new Date(req.submitted_at).toLocaleDateString();

      const bioText = req.parsed_bio_text || "No bio provided";
      const bioPreview =
        bioText.length > 80 ? bioText.substring(0, 80) + "..." : bioText;

      return `
      <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold shrink-0 cursor-pointer"
              onclick='showDoctorDetails(${JSON.stringify(req).replace(/'/g, "&#39;")})'>
              ${initial}
            </div>
            <div>
              <p class="font-semibold text-gray-800 cursor-pointer hover:text-teal text-nowrap"
                onclick='showDoctorDetails(${JSON.stringify(req).replace(/'/g, "&#39;")})'>
                ${escapeHtml(req.full_name)}
              </p>
              <p class="text-xs text-gray-500">${escapeHtml(req.email)}</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <p class="font-medium text-gray-700 text-nowrap">${escapeHtml(req.specialization)}</p>
        </td>
        <td class="px-5 py-4">
          <p class="text-sm text-gray-600 font-medium">${escapeHtml(req.parsed_phone)}</p>
        </td>
        <td class="px-5 py-4">
          <p class="text-sm text-gray-600">${escapeHtml(req.parsed_age)}</p>
        </td>
        <td class="px-5 py-4">
          <p class="text-sm text-teal font-semibold font-mono">${escapeHtml(req.parsed_medical_id)}</p>
        </td>
        <td class="px-5 py-4 max-w-xs">
          <p class="text-sm text-gray-600 line-clamp-2" title="${escapeHtml(bioText)}">${escapeHtml(bioPreview)}</p>
          <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Submitted: ${submittedDate}</p>
        </td>
        <td class="px-5 py-4">
          <div class="flex flex-col gap-2">
            <button onclick="openConfirmModal('approve', ${req.approval_id}, '${escapeHtml(req.full_name)}')"
                    class="w-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Approve
            </button>
            <button onclick="openConfirmModal('reject', ${req.approval_id}, '${escapeHtml(req.full_name)}')"
                    class="w-full text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

function escapeHtml(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
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

function setupModal() {
  const modal = document.getElementById("confirmModal");
  const cancelBtn = document.getElementById("modalCancelBtn");
  const confirmBtn = document.getElementById("modalConfirmBtn");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const feeInput = document.getElementById("consultationFeeInput");

  // Real-time validation for Consultation Fee
  feeInput.addEventListener("input", () => {
    if (pendingAction && pendingAction.action === "approve") {
      const fee = feeInput.value;
      confirmBtn.disabled = !fee || parseFloat(fee) < 0;
    } else {
      confirmBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener("click", () => closeModal());
  confirmBtn.addEventListener("click", async () => {
    if (!pendingAction) return;

    let fee = null;
    if (pendingAction.action === "approve") {
      fee = document.getElementById("consultationFeeInput").value;
      if (!fee || parseFloat(fee) < 0) {
        showToast("Please set a valid consultation fee", true);
        document.getElementById("consultationFeeInput").focus();
        return;
      }
    }

    closeModal();
    await executeAction(pendingAction.action, pendingAction.approvalId, fee);
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
  modalMessage.textContent = `Are you sure you want to ${action.toLowerCase()} ${doctorName}?`;

  if (action === "approve") {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
    modalConfirmBtn.disabled = true;
  } else {
    modalConfirmBtn.className =
      "px-5 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-sm cursor-pointer";
    modalConfirmBtn.disabled = false;
  }

  pendingAction = { action, approvalId, doctorName };

  const feeContainer = document.getElementById("feeInputContainer");
  const feeInput = document.getElementById("consultationFeeInput");

  if (action === "approve") {
    feeContainer.classList.remove("hidden");
    feeInput.value = ""; // Clear previous
    setTimeout(() => feeInput.focus(), 300);
  } else {
    feeContainer.classList.add("hidden");
  }

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

async function executeAction(action, approvalId, fee = null) {
  try {
    const payload = { action: action, approval_id: approvalId };
    if (fee) payload.consultation_fee = fee;

    const response = await fetch("../../api/admin/doctor_approvals.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status === "success") {
      showToast(result.message);
      loadApprovals();
    } else {
      showToast(result.message || "Error processing request", true);
    }
  } catch (error) {
    console.error("Error:", error);
    showToast(`Error: ${error.message || "Failed to connect to server"}`, true);
  }
}

function setupDoctorDetailsModal() {
  if (!document.getElementById("doctorDetailsModal")) {
    const modalHTML = `
      <div id="doctorDetailsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden" style="backdrop-filter: blur(3px);">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-200">
          <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold text-teal-dark">Doctor Profile Details</h3>
            <button onclick="closeDoctorDetailsModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div class="p-6" id="doctorDetailsContent"></div>
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
  const fullName = doctor.full_name || "N/A";
  const email = doctor.email || "N/A";
  const specialization =
    doctor.parsed_specialization || doctor.specialization || "N/A";
  const consultationFee = doctor.consultation_fee
    ? `$${parseFloat(doctor.consultation_fee).toFixed(2)}`
    : "N/A";
  const status = doctor.status || "N/A";
  const submittedAt = doctor.submitted_at
    ? new Date(doctor.submitted_at).toLocaleString()
    : "N/A";
  const reviewedAt = doctor.reviewed_at
    ? new Date(doctor.reviewed_at).toLocaleString()
    : "Not reviewed yet";
  const hasPassword =
    doctor.password_hash === "yes" ? "Yes (secured)" : "No password set";

  // Use server-parsed fields
  const phone = doctor.parsed_phone || "N/A";
  const age = doctor.parsed_age || "N/A";
  const experience = doctor.parsed_experience || "N/A";
  const qualification = doctor.parsed_qualification || "N/A";
  const medicalId = doctor.parsed_medical_id || "N/A";
  // Simplified bio formatting for the modal
  const formatFullBio = (doctor) => {
    let bio = (doctor.parsed_bio_text || doctor.bio_clean || "").trim();

    if (bio.startsWith("{") || bio.startsWith("[")) {
      try {
        const data = JSON.parse(bio);
        if (data && typeof data === "object") {
          return data.bio || data.description || "No bio text provided";
        }
      } catch (e) {}
    }

    return typeof bio === "string" && !bio.trim().startsWith("{")
      ? bio
      : "No bio provided.";
  };

  const bio = formatFullBio(doctor);

  const statusClass =
    status === "Accepted"
      ? "bg-green-100 text-green-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-700";

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
          <p class="font-medium text-gray-800">${escapeHtml(String(phone))}</p>
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
          <label class="text-xs text-gray-400 uppercase font-semibold">Medical ID</label>
          <p class="font-medium text-gray-800">${escapeHtml(String(medicalId))}</p>
        </div>
      </div>

      <div class="bg-gray-50 p-3 rounded-lg">
        <label class="text-xs text-gray-400 uppercase font-semibold">Bio / Description</label>
        <p class="text-gray-700 mt-1 whitespace-pre-wrap">${escapeHtml(bio)}</p>
      </div>

      <div class="bg-gray-50 p-3 rounded-lg">
        <label class="text-xs text-gray-400 uppercase font-semibold">Status</label>
        <p class="font-medium">
          <span class="inline-block px-2 py-1 rounded-full text-xs ${statusClass}">
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

// Treatment Category Management
let allCategories = [];

async function loadCategories() {
  const tbody = document.getElementById("categories-table-body");
  if (!tbody) return;

  try {
    const response = await fetch("../../api/admin/treatment_categories.php");
    const result = await response.json();

    if (result.status === "success") {
      allCategories = result.data || [];
      renderCategories();
    } else {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-red-500">${result.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function renderCategories() {
  const tbody = document.getElementById("categories-table-body");
  if (!tbody) return;

  if (allCategories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-gray-500">No categories found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allCategories
    .map(
      (cat) => `
    <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors group">
      <td class="px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-teal/5 text-teal flex items-center justify-center font-bold">
            ${cat.name.charAt(0)}
          </div>
          <span class="font-semibold text-gray-800">${escapeHtml(cat.name)}</span>
        </div>
      </td>
      <td class="px-5 py-4 text-sm text-gray-600">${escapeHtml(cat.description)}</td>
      <td class="px-5 py-4">
        <div class="flex items-center gap-3">
          <button onclick="editCategory(${cat.id})" class="text-gray-400 hover:text-teal transition-colors p-1" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onclick="deleteCategory(${cat.id})" class="text-gray-400 hover:text-rose-600 transition-colors p-1" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}


function viewTicketFromDrillDown(ticket) {
  // Reuse the existing detail modal (we need to make sure it exists in the HTML)
  const detailModal = document.getElementById("ticketDetailModal");
  if (!detailModal) {
    alert(
      `Ticket: ${ticket.ticket_number}\nPatient: ${ticket.patient_name}\nCost: ₹${ticket.cost}`,
    );
    return;
  }

  document.getElementById("detailTicketNum").textContent = ticket.ticket_number;
  document.getElementById("detailPatientName").textContent =
    ticket.patient_name;
  document.getElementById("detailDoctorName").textContent =
    ticket.doctor_name || "N/A";
  document.getElementById("detailCategory").textContent = ticket.category_name;
  document.getElementById("detailCost").textContent =
    `₹${parseFloat(ticket.cost).toLocaleString()}`;
  document.getElementById("detailDuration").textContent =
    ticket.duration || "30 Mins";
  document.getElementById("detailDate").textContent = new Date(
    ticket.generated_at,
  ).toLocaleString();
  document.getElementById("detailDescription").textContent =
    ticket.category_description || "No description available.";

  detailModal.classList.remove("hidden");
  detailModal.style.zIndex = "60"; // Make sure it stays on top of the drill-down modal
}

// Global Tickets Management
let allTickets = [];

async function loadAllTickets() {
  const tbody = document.getElementById("all-tickets-table-body");
  const search = document.getElementById("ticketSearch")?.value || "";
  const category = document.getElementById("ticketCategoryFilter")?.value || "";

  if (!tbody) return;

  try {
    const url = `../../api/admin/treatment_tickets.php?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.status === "success") {
      allTickets = result.data || [];
      renderAllTickets();
      if (result.categories) {
        populateCategoryFilter(result.categories);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-red-500">${result.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Error loading all tickets:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-red-500">Failed to load ticket data.</td></tr>`;
  }
}

function renderAllTickets() {
  const tbody = document.getElementById("all-tickets-table-body");
  if (!tbody) return;

  if (allTickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-gray-400">No matching tickets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allTickets
    .map(
      (t) => `
    <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td class="px-5 py-4 font-mono text-xs font-bold text-teal">${t.ticket_number}</td>
      <td class="px-5 py-4 text-sm font-medium text-gray-800">${escapeHtml(t.patient_name)}</td>
      <td class="px-5 py-4 text-sm font-medium text-gray-600">Dr. ${escapeHtml(t.doctor_name)}</td>
      <td class="px-5 py-4">
        <span class="inline-block px-2 py-0.5 rounded bg-teal/5 text-teal text-[10px] font-bold border border-teal/10">${escapeHtml(t.category_name)}</span>
      </td>
      <td class="px-5 py-4 font-bold text-gray-700 text-sm">₹${parseFloat(t.cost).toLocaleString()}</td>
      <td class="px-5 py-4 text-xs text-gray-500 font-medium">${escapeHtml(t.duration || "30 Mins")}</td>
      <td class="px-5 py-4 text-xs text-gray-500">
        ${new Date(t.generated_at).toLocaleDateString()}
      </td>
      <td class="px-5 py-4">
        <button onclick='viewTicketFromDrillDown(${JSON.stringify(t).replace(/'/g, "&apos;")})' class="text-teal hover:underline text-xs font-bold">Details</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function populateCategoryFilter(categories) {
  const filter = document.getElementById("ticketCategoryFilter");
  if (!filter || filter.options.length > 1) return; // Only populate once

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
}

function setupTicketFilters() {
  const searchInput = document.getElementById("ticketSearch");
  const filterSelect = document.getElementById("ticketCategoryFilter");

  let timeout = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      loadAllTickets();
    }, 500);
  });

  filterSelect?.addEventListener("change", () => {
    loadAllTickets();
  });
}

function closeCategoryTicketsModal() {
  document.getElementById("categoryTicketsModal").classList.add("hidden");
}

function closeTicketModal() {
  document.getElementById("ticketDetailModal").classList.add("hidden");
}

function openCategoryModal(mode, id = null) {
  const modal = document.getElementById("categoryModal");
  const title = document.getElementById("categoryModalTitle");
  const form = document.getElementById("categoryForm");

  form.reset();
  document.getElementById("categoryId").value = "";

  if (mode === "edit" && id) {
    const cat = allCategories.find((c) => c.id == id);
    if (cat) {
      title.textContent = "Edit Treatment Category";
      document.getElementById("categoryId").value = cat.id;
      document.getElementById("categoryName").value = cat.name;
      document.getElementById("categoryDescription").value = cat.description;
    }
  } else {
    title.textContent = "Add Treatment Category";
  }

  modal.classList.remove("hidden");
}

function closeCategoryModal() {
  document.getElementById("categoryModal").classList.add("hidden");
}

function editCategory(id) {
  openCategoryModal("edit", id);
}

async function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  try {
    const response = await fetch(
      `../../api/admin/treatment_categories.php?id=${id}`,
      {
        method: "DELETE",
      },
    );
    const result = await response.json();
    if (result.status === "success") {
      showToast(result.message);
      loadCategories();
    } else {
      showToast(result.message, true);
    }
  } catch (error) {
    console.error("Error deleting category:", error);
  }
}

function setupCategoryForm() {
  const form = document.getElementById("categoryForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      id: document.getElementById("categoryId").value,
      name: document.getElementById("categoryName").value,
      description: document.getElementById("categoryDescription").value,
    };

    try {
      const response = await fetch("../../api/admin/treatment_categories.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.status === "success") {
        showToast(result.message);
        closeCategoryModal();
        loadCategories();
      } else {
        showToast(result.message, true);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  });
}
