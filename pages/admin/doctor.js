// DOCTORS PAGE - MANAGE DOCTORS
let currentPage = 1;
let allDoctors = [];
let filteredDoctors = [];

console.log("=== DOCTOR.JS LOADED ===");

// Utility Functions
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateElement = document.getElementById("current-date");
  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-US", options);
  }
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("overlay").classList.toggle("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("overlay").classList.add("hidden");
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// MODAL FUNCTIONS
function viewDoctorDetails(doctorId) {
  console.log("Opening modal for doctor ID:", doctorId);

  const modal = document.getElementById("doctorModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  if (!modal) {
    console.error("Modal not found!");
    showToast("Error: Modal not found");
    return;
  }

  // Show modal
  modal.classList.add("active");
  modalBody.innerHTML = `
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p class="mt-3 text-gray-500">Loading doctor details...</p>
        </div>
    `;

  // Fetch doctor details
  fetch(`../../api/admin/doctors.php?doctor_id=${doctorId}`, {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("API Response:", result);

      if (result.status === "success" && result.data) {
        const doc = result.data;
        modalTitle.textContent = `Dr. ${doc.full_name || "Doctor"} - Complete Profile`;

        modalBody.innerHTML = `
                <div class="space-y-5">
                    <!-- Header -->
                    <div class="flex items-center gap-4 pb-4 border-b">
                        <div class="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d7377" stroke-width="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-xl font-bold text-gray-800">Dr. ${escapeHtml(doc.full_name || "N/A")}</h4>
                            <p class="text-teal-600 font-medium">${escapeHtml(doc.specialization || "Specialization not specified")}</p>
                        </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div>
                        <h5 class="text-sm font-semibold text-teal-dark mb-3">📞 Contact Information</h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                            <div>
                                <p class="text-xs text-gray-400">Email</p>
                                <p class="text-sm font-medium">${escapeHtml(doc.email || "N/A")}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">📞 Phone Number</p>
                                <p class="text-sm font-medium">${escapeHtml(doc.contact_number || "Not provided")}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">🎂 Age</p>
                                <p class="text-sm font-medium">${doc.age || "Not provided"} ${doc.age ? "years" : ""}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">🆔 Medical ID</p>
                                <p class="text-sm font-medium">${escapeHtml(doc.medical_id || "Not provided")}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Professional Details -->
                    <div>
                        <h5 class="text-sm font-semibold text-teal-dark mb-3">💼 Professional Details</h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                            <div>
                                <p class="text-xs text-gray-400">Specialization</p>
                                <p class="text-sm font-medium">${escapeHtml(doc.specialization || "Not specified")}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">💰 Consultation Fee</p>
                                <p class="text-sm font-medium">${doc.consultation_fee ? "₹" + doc.consultation_fee : "Not set"}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">📅 Experience (Years)</p>
                                <p class="text-sm font-medium">${doc.experience_years || "Not specified"} ${doc.experience_years ? "years" : ""}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">🎓 Qualifications</p>
                                <p class="text-sm font-medium">${escapeHtml(doc.qualifications || "Not specified")}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bio -->
                    <div>
                        <h5 class="text-sm font-semibold text-teal-dark mb-3">📝 About / Bio</h5>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(doc.bio || "No bio provided yet.")}</p>
                        </div>
                    </div>
                    
                    <!-- Statistics -->
                    <div>
                        <h5 class="text-sm font-semibold text-teal-dark mb-3">📊 Statistics</h5>
                        <div class="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                            <div class="text-center">
                                <p class="text-2xl font-bold text-teal-600">${doc.total_appointments || 0}</p>
                                <p class="text-xs text-gray-400">Total Appointments</p>
                            </div>
                            <div class="text-center">
                                <p class="text-2xl font-bold text-green-600">${doc.completed_appointments || 0}</p>
                                <p class="text-xs text-gray-400">Completed Appointments</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      } else {
        modalBody.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <svg class="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>Failed to load doctor details.</p>
                    <p class="text-sm mt-2">${result.message || "Please try again."}</p>
                </div>
            `;
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      modalBody.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Error loading details.</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    });
}

function closeDoctorModal() {
  const modal = document.getElementById("doctorModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modal = document.getElementById("doctorModal");
  const modalContent = document.querySelector(".modal-content");
  if (
    modal &&
    modal.classList.contains("active") &&
    modalContent &&
    !modalContent.contains(event.target)
  ) {
    const isDoctorButton = event.target.closest(".doctor-name-btn");
    if (!isDoctorButton) {
      closeDoctorModal();
    }
  }
});

// Close with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeDoctorModal();
  }
});

// Load Doctors
function loadDoctors(page = 1) {
  console.log("Loading doctors page:", page);
  currentPage = page;

  fetch(`../../api/admin/doctors.php?page=${page}&limit=10`, {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Doctors loaded:", result);

      if (result.status === "success") {
        allDoctors = result.data || [];
        filteredDoctors = [...allDoctors];
        document.getElementById("total-pages").textContent = result.pages || 1;
        document.getElementById("current-page").textContent = currentPage;
        displayDoctors();
      } else {
        showToast("Error loading doctors");
        document.getElementById("doctors-table-body").innerHTML =
          '<tr><td colspan="5" class="text-center py-8 text-red-500">Failed to load doctors</td></tr>';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showToast("Error loading doctors");
    });
}

function displayDoctors() {
  const tbody = document.getElementById("doctors-table-body");

  if (!filteredDoctors.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center py-8 text-gray-500">No doctors found</td></tr>';
    return;
  }

  let html = "";
  for (const doc of filteredDoctors) {
    html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-5 py-4">
                    <button class="doctor-name-btn" onclick="viewDoctorDetails('${doc.user_id}')">
                        ${escapeHtml(doc.full_name || "Unknown")}
                    </button>
                 </td>
                <td class="px-5 py-4 text-sm">${escapeHtml(doc.specialization || "N/A")}</td>
                <td class="px-5 py-4 text-sm hidden md:table-cell">${escapeHtml(doc.email || "")}</td>
                <td class="px-5 py-4 text-sm">${doc.total_appointments || 0}</td>
                <td class="px-5 py-4">
                    <button onclick="deleteDoctor('${doc.user_id}')" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold transition">
                        Delete
                    </button>
                 </td>
            </tr>
        `;
  }
  tbody.innerHTML = html;
}

function filterDoctors() {
  const searchText = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  filteredDoctors = allDoctors.filter(
    (doc) =>
      (doc.full_name || "").toLowerCase().includes(searchText) ||
      (doc.email || "").toLowerCase().includes(searchText) ||
      (doc.specialization || "").toLowerCase().includes(searchText),
  );
  displayDoctors();
}

function deleteDoctor(doctorId) {
  if (!confirm("⚠️ Delete this doctor?\n\nThis action cannot be undone."))
    return;

  fetch("../../api/admin/doctors.php", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ doctor_id: doctorId }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        showToast("✓ Doctor deleted successfully!");
        loadDoctors(currentPage);
      } else {
        showToast(result.message || "Error deleting doctor");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showToast("Error deleting doctor");
    });
}

function nextPage() {
  const totalPages = parseInt(
    document.getElementById("total-pages")?.textContent || "1",
  );
  if (currentPage < totalPages) {
    loadDoctors(currentPage + 1);
  }
}

function previousPage() {
  if (currentPage > 1) {
    loadDoctors(currentPage - 1);
  }
}

// Initialize Page
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== Page Initialized ===");
  updateCurrentDate();
  loadDoctors();
});
