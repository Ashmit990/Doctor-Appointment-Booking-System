/*
  DOCTORS PAGE - MANAGE DOCTORS
  ============================
  Admin can click on doctor name to see a popup with FULL details
  (phone number, age, bio, qualifications, experience, consultation fee, etc.)
  NO dropdowns - only modal popup
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allDoctors = [];
let filteredDoctors = [];

console.log("✓ doctor.js file loading...");

// ==================== UTILITIES ====================
function showToast(message) {
  try {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  } catch (e) {
    console.error("Toast error:", e);
  }
}

function updateCurrentDate() {
  try {
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
  } catch (e) {
    console.error("✗ Date error:", e);
  }
}

function toggleSidebar() {
  try {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
    document.getElementById("overlay").classList.toggle("hidden");
  } catch (e) {
    console.error("✗ Sidebar error:", e);
  }
}

function closeSidebar() {
  try {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("overlay").classList.add("hidden");
  } catch (e) {
    console.error("✗ Close sidebar error:", e);
  }
}

// ==================== DOCTOR DETAILS MODAL ====================
async function viewDoctorDetails(doctorId) {
  try {
    console.log("Fetching details for doctor:", doctorId);

    const modal = document.getElementById("doctorModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    if (!modal || !modalBody) {
      console.error("Modal elements not found!");
      return;
    }

    // Show loading state
    modal.classList.add("active");
    modalBody.innerHTML = `
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        <p class="ml-3 text-gray-500">Loading doctor information...</p>
      </div>
    `;

    // Fetch full doctor details from API
    const response = await fetch(
      `../../api/admin/doctors.php?doctor_id=${doctorId}`,
      {
        credentials: "include",
      },
    );

    const result = await response.json();
    console.log("Doctor details response:", result);

    if (result.status === "success" && result.data) {
      const doc = result.data;

      if (modalTitle) {
        modalTitle.textContent = `Dr. ${doc.full_name || "Doctor"} - Profile`;
      }

      // Format the details nicely
      modalBody.innerHTML = `
        <div class="space-y-6">
          <!-- Header with avatar -->
          <div class="flex items-center gap-4 pb-4 border-b">
            <div class="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d7377" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h4 class="text-xl font-bold text-gray-800">${escapeHtml(doc.full_name || "N/A")}</h4>
              <p class="text-teal-600 font-medium">${escapeHtml(doc.specialization || "Specialization not specified")}</p>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div>
            <h5 class="text-sm font-semibold text-teal-dark uppercase tracking-wider mb-3">Contact Information</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p class="text-xs text-gray-400">Email Address</p>
                <p class="text-sm font-medium text-gray-700">${escapeHtml(doc.email || "N/A")}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Phone Number</p>
                <p class="text-sm font-medium text-gray-700">${escapeHtml(doc.contact_number || "Not provided")}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Age</p>
                <p class="text-sm font-medium text-gray-700">${doc.age || "Not provided"}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Medical ID</p>
                <p class="text-sm font-medium text-gray-700">${escapeHtml(doc.medical_id || "Not provided")}</p>
              </div>
            </div>
          </div>
          
          <!-- Professional Details -->
          <div>
            <h5 class="text-sm font-semibold text-teal-dark uppercase tracking-wider mb-3">Professional Details</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p class="text-xs text-gray-400">Specialization</p>
                <p class="text-sm font-medium text-gray-700">${escapeHtml(doc.specialization || "Not specified")}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Consultation Fee</p>
                <p class="text-sm font-medium text-gray-700">${doc.consultation_fee ? "₹" + doc.consultation_fee : "Not set"}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Experience (Years)</p>
                <p class="text-sm font-medium text-gray-700">${doc.experience_years || "Not specified"}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Qualifications</p>
                <p class="text-sm font-medium text-gray-700">${escapeHtml(doc.qualifications || "Not specified")}</p>
              </div>
            </div>
          </div>
          
          <!-- Bio / About -->
          <div>
            <h5 class="text-sm font-semibold text-teal-dark uppercase tracking-wider mb-3">About / Bio</h5>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(doc.bio || "No bio provided yet.")}</p>
            </div>
          </div>
          
          <!-- Statistics -->
          <div>
            <h5 class="text-sm font-semibold text-teal-dark uppercase tracking-wider mb-3">Practice Statistics</h5>
            <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
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
          <p class="text-sm mt-2">${escapeHtml(result.message || "Please try again later.")}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    const modalBody = document.getElementById("modalBody");
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>Error loading doctor details.</p>
          <p class="text-sm mt-2">${error.message}</p>
        </div>
      `;
    }
  }
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
  const modalContent = modal?.querySelector(".modal-content");
  if (
    modal &&
    modal.classList.contains("active") &&
    modalContent &&
    !modalContent.contains(event.target)
  ) {
    closeDoctorModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeDoctorModal();
  }
});

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ==================== LOAD DATA ====================
async function loadDoctors(page = 1) {
  try {
    currentPage = page;
    console.log("► Fetching doctors page:", page);

    const response = await fetch(
      `../../api/admin/doctors.php?page=${page}&limit=10`,
      {
        credentials: "include",
      },
    );

    console.log("✓ API Response:", response.status);
    const result = await response.json();
    console.log("✓ Data received:", result);

    if (result && result.status === "success") {
      allDoctors = result.data || [];
      filteredDoctors = [...allDoctors];

      const totalPagesEl = document.getElementById("total-pages");
      if (totalPagesEl) {
        totalPagesEl.textContent = result.pages || 1;
      }

      const currentPageEl = document.getElementById("current-page");
      if (currentPageEl) {
        currentPageEl.textContent = currentPage;
      }

      displayDoctors();
    } else {
      console.warn("⚠ API returned error");
      showToast("Error loading doctors");
    }
  } catch (error) {
    console.error("✗ Fetch error:", error);
    showToast("Error loading doctors: " + error.message);
  }
}

// ==================== DISPLAY DATA ====================
function displayDoctors() {
  try {
    console.log("► Displaying", filteredDoctors.length, "doctors");

    const tbody = document.getElementById("doctors-table-body");
    if (!tbody) {
      console.warn("⚠ Table tbody not found!");
      return;
    }

    if (!filteredDoctors || filteredDoctors.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-gray-500">No doctors found</td></tr>';
      return;
    }

    let html = "";
    for (const doc of filteredDoctors) {
      const fullName = doc.full_name || "Unknown";
      const email = doc.email || "";
      const docId = doc.user_id;

      html += `
        <tr class="border-b hover:bg-gray-50">
          <td class="px-5 py-4 text-sm font-semibold">
            <button
              onclick="viewDoctorDetails('${docId}')"
              class="text-left text-gray-800 hover:text-teal-700 bg-transparent border-none p-0 cursor-pointer font-semibold hover:underline"
            >
              ${escapeHtml(fullName)}
            </button>
           </td>
          <td class="px-5 py-4 text-sm">${escapeHtml(doc.specialization || "N/A")}</td>
          <td class="px-5 py-4 text-sm hidden md:table-cell">${escapeHtml(email)}</td>
          <td class="px-5 py-4 text-sm">${doc.total_appointments || 0}</td>
          <td class="px-5 py-4">
            <button onclick="deleteDoctor('${docId}')" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold transition">
              Delete
            </button>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
    console.log("✓ Table updated - no dropdowns, click name for modal");
  } catch (e) {
    console.error("✗ Display error:", e);
  }
}

// ==================== FILTER ====================
function filterDoctors() {
  const searchText = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  filteredDoctors = allDoctors.filter((doc) => {
    return (
      (doc.full_name || "").toLowerCase().includes(searchText) ||
      (doc.email || "").toLowerCase().includes(searchText) ||
      (doc.specialization &&
        doc.specialization.toLowerCase().includes(searchText))
    );
  });
  displayDoctors();
}

// ==================== DELETE ====================
async function deleteDoctor(doctorId) {
  if (
    !confirm(
      "⚠️ Delete this doctor?\n\nThis action cannot be undone. All associated appointments and data will be removed.",
    )
  )
    return;

  try {
    const response = await fetch("../../api/admin/doctors.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ doctor_id: doctorId }),
    });

    const result = await response.json();
    if (result.status === "success") {
      showToast("✓ Doctor deleted successfully!");
      loadDoctors(currentPage);
    } else {
      showToast(result.message || "Error deleting doctor");
    }
  } catch (error) {
    console.error("Delete error:", error);
    showToast("Error: " + error.message);
  }
}

// ==================== PAGINATION ====================
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

// ==================== PAGE INIT ====================
document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  try {
    console.log("╔═══════════════════════════════════╗");
    console.log("║   DOCTORS PAGE INITIALIZATION     ║");
    console.log("║   ✓ Click doctor name for modal   ║");
    console.log("║   ✓ No dropdowns                  ║");
    console.log("║   ✓ Full details in popup         ║");
    console.log("╚═══════════════════════════════════╝");

    updateCurrentDate();
    loadDoctors();

    console.log(
      "✓ Page ready - Click doctor name to see full details in modal",
    );
  } catch (err) {
    console.error("✗ INIT ERROR:", err);
    showToast("Page load error: " + err.message);
  }
}
