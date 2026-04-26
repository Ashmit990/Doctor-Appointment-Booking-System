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

function closeDetailsModal() {
  try {
    document.getElementById("detailsModal").classList.remove("active");
  } catch (e) {
    console.error("✗ Close details modal error:", e);
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
        <tr class="border-b hover:bg-gray-50">
          <td class="px-5 py-4 text-sm font-semibold">${fullName}</td>
          <td class="px-5 py-4 text-sm">${email}</td>
          <td class="px-5 py-4 text-sm hidden md:table-cell">${contactNumber}</td>
          <td class="px-5 py-4 text-sm">${totalAppointments}</td>
          <td class="px-5 py-4">
            <button onclick="deletePatient('${userId}')" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold">
              Delete
            </button>
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
    updateCurrentDate();
    loadPatients(1);
    console.log("✓ Page ready");
  } catch (err) {
    console.error("✗ INIT ERROR:", err);
    showToast("Page load error: " + err.message, true);
  }
}
