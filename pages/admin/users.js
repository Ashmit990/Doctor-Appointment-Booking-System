/*
  USERS PAGE - PATIENTS MANAGEMENT
  ================================
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allPatients = [];
let filteredPatients = [];

console.log("✓ users.js file loading...");

// ==================== UTILITIES ====================
function showToast(message, isError = false) {
  try {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    if (isError) {
      toast.style.background = "#dc2626";
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  } catch (e) {
    console.error("Toast error:", e);
  }
}

// admin-common.js handles date, sidebar, etc.

function closeDetailsModal() {
  try {
    const modal = document.getElementById("detailsModal");
    modal.classList.remove("active");
    // Also re-enable scrolling on body if needed
    document.body.style.overflow = "auto";
  } catch (e) {
    console.error("✗ Close details modal error:", e);
  }
}

function viewPatientDetails(userId) {
  try {
    const patient = allPatients.find((p) => p.user_id === userId);
    if (!patient) return;

    // Populate modal
    document.getElementById("modalName").textContent =
      patient.full_name || "N/A";
    document.getElementById("modalId").textContent = `UID-${patient.user_id}`;
    document.getElementById("modalEmail").textContent = patient.email || "N/A";
    document.getElementById("modalPhone").textContent =
      patient.contact_number || "N/A";
    document.getElementById("modalAge").textContent = patient.age
      ? `${patient.age} Years`
      : "N/A";
    document.getElementById("modalGender").textContent =
      patient.gender || "N/A";
    document.getElementById("modalBlood").textContent =
      patient.blood_group || "N/A";
    document.getElementById("modalAppointments").textContent =
      `${patient.total_appointments || 0} Total`;
    document.getElementById("modalAddress").textContent =
      patient.address || "N/A";
    
    // Set emergency contact
    const eName = patient.emergency_contact_name || "";
    const ePhone = patient.emergency_contact_phone || "";
    document.getElementById("modalEmergency").textContent = 
      (eName || ePhone) ? `${eName} (${ePhone})` : "N/A";

    // Set initials
    const initials = (patient.full_name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    document.getElementById("modalInitials").textContent = initials.substring(
      0,
      2,
    );

    // Setup delete button in modal
    const deleteBtn = document.getElementById("modalDeleteBtn");
    deleteBtn.onclick = () => {
      closeDetailsModal();
      deletePatient(userId);
    };

    // Show modal
    const modal = document.getElementById("detailsModal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scroll
  } catch (e) {
    console.error("✗ View details error:", e);
  }
}

// ==================== LOAD DATA ====================
async function loadPatients(page = 1) {
  try {
    currentPage = page;
    console.log("► Fetching patients page:", page);

    const response = await fetch(
      `/Doctor-Appointment-Booking-System/api/admin/patients.php?page=${page}&limit=10`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✓ API Response Status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✓ API Response:", result);

    if (result && result.status === "success") {
      allPatients = result.data || [];
      filteredPatients = [...allPatients];

      console.log(`✓ Loaded ${allPatients.length} patients`);

      const totalPagesEl = document.getElementById("total-pages");
      if (totalPagesEl) {
        totalPagesEl.textContent = result.pages || 1;
      }

      const currentPageEl = document.getElementById("current-page");
      if (currentPageEl) {
        currentPageEl.textContent = page;
      }

      displayPatients();
    } else {
      const errorMsg = result?.message || "Unknown error from API";
      console.error("⚠ API error:", errorMsg);
      showToast(errorMsg, true);

      const tbody = document.getElementById("patients-table-body");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Error: ${errorMsg}</td></tr>`;
      }
    }
  } catch (error) {
    console.error("✗ Fetch error:", error);
    showToast("Error: " + error.message, true);

    const tbody = document.getElementById("patients-table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Connection Error: ${error.message}<br><br>Make sure XAMPP is running and try again.</td></tr>`;
    }
  }
}

// ==================== DISPLAY DATA ====================
function displayPatients() {
  try {
    console.log("► Displaying", filteredPatients.length, "patients");

    const tbody = document.getElementById("patients-table-body");
    if (!tbody) {
      console.warn("⚠ Table tbody not found!");
      return;
    }

    if (!filteredPatients || filteredPatients.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-gray-500">No patients found</td></tr>';
      return;
    }

    let html = "";
    for (const patient of filteredPatients) {
      const fullName = (patient.full_name || "Unknown").replace(/'/g, "\\'");
      const email = (patient.email || "N/A").replace(/'/g, "\\'");
      const contactNumber = patient.contact_number || "N/A";
      const totalAppointments = patient.total_appointments || 0;
      const userId = patient.user_id;

      html += `
        <tr class="border-b hover:bg-gray-50 transition-colors">
          <td class="px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-teal/10 text-teal rounded-lg flex items-center justify-center text-xs font-bold">
                ${(patient.full_name || "U")[0].toUpperCase()}
              </div>
              <span class="text-sm font-semibold text-gray-900">${fullName}</span>
            </div>
          </td>
          <td class="px-5 py-4 text-sm text-gray-600">${email}</td>
          <td class="px-5 py-4 text-sm text-gray-600 hidden md:table-cell font-medium">${contactNumber}</td>
          <td class="px-5 py-4">
            <span class="px-2 py-1 bg-teal/5 text-teal text-xs font-bold rounded-lg border border-teal/10">
              ${totalAppointments} Appts
            </span>
          </td>
          <td class="px-5 py-4">
            <div class="flex items-center gap-2">
              <button onclick="viewPatientDetails('${userId}')" class="text-xs px-3 py-1.5 bg-teal text-white rounded-lg hover:bg-teal-dark font-bold transition-all shadow-sm">
                View
              </button>
              <button onclick="deletePatient('${userId}')" class="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-all">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
    console.log("✓ Table updated");
  } catch (e) {
    console.error("✗ Display error:", e);
    showToast("Error displaying patients: " + e.message, true);
  }
}

// ==================== FILTER ====================
function filterPatients() {
  const searchText = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();

  if (!searchText) {
    filteredPatients = [...allPatients];
  } else {
    filteredPatients = allPatients.filter(
      (p) =>
        (p.full_name || "").toLowerCase().includes(searchText) ||
        (p.email || "").toLowerCase().includes(searchText) ||
        (p.contact_number &&
          p.contact_number.toLowerCase().includes(searchText)),
    );
  }

  console.log(`Filtered to ${filteredPatients.length} patients`);
  displayPatients();
}

// ==================== DELETE ====================
async function deletePatient(patientId) {
  if (!confirm("Delete this patient? This action cannot be undone.")) return;

  try {
    console.log("► Deleting patient:", patientId);

    const response = await fetch(
      "/Doctor-Appointment-Booking-System/api/admin/patients.php",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ patient_id: patientId }),
      },
    );

    const result = await response.json();
    console.log("✓ Delete response:", result);

    if (result.status === "success") {
      showToast("Patient deleted successfully!");
      loadPatients(currentPage);
    } else {
      showToast(result.message || "Error deleting patient", true);
    }
  } catch (error) {
    console.error("✗ Delete error:", error);
    showToast("Error: " + error.message, true);
  }
}

// ==================== PAGINATION ====================
function nextPage() {
  const totalPages = parseInt(
    document.getElementById("total-pages")?.textContent || "1",
  );
  if (currentPage < totalPages) {
    currentPage++;
    document.getElementById("current-page").textContent = currentPage;
    loadPatients(currentPage);
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    document.getElementById("current-page").textContent = currentPage;
    loadPatients(currentPage);
  }
}

// ==================== PAGE INIT ====================
document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  try {
    console.log("╔═══════════════════════════════════╗");
    console.log("║   USERS PAGE INITIALIZATION       ║");
    console.log("╚═══════════════════════════════════╝");
    // admin-common.js handles updateCurrentDate
    loadPatients(1);
    console.log("✓ Page ready");
  } catch (err) {
    console.error("✗ INIT ERROR:", err);
    showToast("Page load error: " + err.message, true);
  }
}
