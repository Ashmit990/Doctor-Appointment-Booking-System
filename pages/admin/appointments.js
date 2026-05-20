/*
  APPOINTMENTS PAGE - MANAGE APPOINTMENTS
  ======================================
  Admin can only edit PAST appointments (date < today)
  Cannot edit today's or future appointments
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allAppointments = [];
let filteredAppointments = [];
let currentEditId = null;
let pendingDeleteAppointmentId = null;
let currentStatusFilter = ""; // Store current filter
let currentSearchText = ""; // Store current search
let totalPagesFromAPI = 1; // Store total pages from API

console.log("✓ appointments.js loading...");

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
    console.error("Date error:", e);
  }
}

function toggleSidebar() {
  try {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
    document.getElementById("overlay").classList.toggle("hidden");
  } catch (e) {
    console.error("Sidebar error:", e);
  }
}

function closeSidebar() {
  try {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("overlay").classList.add("hidden");
  } catch (e) {
    console.error("Close sidebar error:", e);
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Missed":
      return "bg-red-100 text-red-800";
    case "Cancelled":
      return "bg-gray-100 text-gray-800";
    case "Upcoming":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// ==================== CHECK IF APPOINTMENT IS EDITABLE ====================
function isEditable(appointmentDate) {
  if (!appointmentDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aptDate = new Date(appointmentDate);
  aptDate.setHours(0, 0, 0, 0);

  // Allow editing if appointment date is today or in the past
  return aptDate <= today;
}

function getEditableMessage(appointmentDate) {
  if (!appointmentDate) return "Cannot edit this appointment";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aptDate = new Date(appointmentDate);
  aptDate.setHours(0, 0, 0, 0);

  if (aptDate > today) {
    return "⚠️ Cannot edit future appointments. Only today's or past appointments can be modified.";
  }
  return "";
}

// ==================== LOAD DATA ====================
async function loadAppointments(page = 1) {
  try {
    currentPage = page;
    console.log("Fetching appointments page:", page);

    const response = await fetch(
      `../../api/admin/appointments.php?page=${page}&limit=10`,
      {
        credentials: "include",
      },
    );

    console.log("API Response:", response.status);
    const result = await response.json();
    console.log("Data received:", result);

    if (result && result.status === "success") {
      allAppointments = result.data || [];
      
      // Store total pages from API
      totalPagesFromAPI = result.pages || 1;
      
      // Copy all appointments to filtered for display
      filteredAppointments = [...allAppointments];

      const totalPages = result.pages || 1;
      updatePaginationUI(currentPage, totalPages);
      displayAppointments();

      const completedCountEl = document.getElementById("total-completed-count");
      if (completedCountEl) {
        completedCountEl.textContent = result.completed_total || 0;
      }
    } else {
      console.warn("API returned error");
      showToast("Error loading appointments");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Error loading appointments: " + error.message);
  }
}

// ==================== DISPLAY DATA ====================
function displayAppointments() {
  try {
    console.log("Displaying", filteredAppointments.length, "appointments");

    const tbody = document.getElementById("appointments-table-body");
    if (!tbody) {
      console.warn("Table tbody not found!");
      return;
    }

    if (!filteredAppointments || filteredAppointments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-gray-500">No appointments found</td></tr>';
      updatePaginationUI(0, 1);
      return;
    }

    // Handle pagination for filtered results (10 items per page)
    const ITEMS_PER_PAGE = 10;
    
    // Calculate total pages based on whether filter is active
    const hasActiveFilter = currentSearchText || currentStatusFilter;
    let totalPages;
    
    if (hasActiveFilter) {
      // For filtered results, calculate from filtered data
      totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
    } else {
      // For unfiltered results, use total pages from API
      totalPages = totalPagesFromAPI;
    }
    
    console.log(`Display mode - Active filter: ${hasActiveFilter}, Total pages: ${totalPages}, Filtered count: ${filteredAppointments.length}`);
    
    // Ensure currentPage is within bounds
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageAppointments = filteredAppointments.slice(startIdx, endIdx);

    let html = "";
    for (const apt of pageAppointments) {
      const comments = (apt.doctor_comments || "").replace(/'/g, "\\'");
      const editable = isEditable(apt.app_date);

      // Fix: If date has passed and status is still "Upcoming", show it as "Completed"
      let displayStatus = apt.status;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aptDate = new Date(apt.app_date);
      aptDate.setHours(0, 0, 0, 0);

      if (aptDate < today && displayStatus === "Upcoming") {
        displayStatus = "Completed";
      }

      const editButtonClass = editable
        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
        : "bg-gray-100 text-gray-400 cursor-not-allowed";
      const editDisabled = editable ? "" : "disabled";
      const titleMessage = !editable
        ? getEditableMessage(apt.app_date)
        : "Edit this appointment";

      html += `
                <tr class="border-b hover:bg-gray-50 transition-colors">
                    <td class="px-5 py-4 text-sm font-medium text-gray-800">${apt.patient_name}</td>
                    <td class="px-5 py-4 text-sm text-gray-600">${apt.doctor_name}</td>
                    <td class="px-5 py-4 text-sm text-gray-600 font-mono">${apt.app_date} ${apt.app_time}</td>
                    <td class="px-5 py-4">
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(displayStatus)}">${displayStatus}</span>
                    </td>

                    <td class="px-5 py-4">
                        <div class="flex gap-2">
                            <button 
                                onclick="openEditModal(${apt.appointment_id}, '${apt.status}', '${comments}', '${apt.app_date}')" 
                                class="text-xs px-3 py-1 rounded transition-colors font-semibold ${editButtonClass}"
                                ${editDisabled}
                                title="${titleMessage}">
                                Edit
                            </button>
                            <button onclick="openDeleteConfirm(${apt.appointment_id})" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-semibold">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
    }

    tbody.innerHTML = html;
    updatePaginationUI(currentPage, totalPages);
    console.log("Table updated");
  } catch (e) {
    console.error("Display error:", e);
  }
}

// ==================== UPDATE PAGINATION UI ====================
function updatePaginationUI(currentPageNum, totalPagesNum) {
  const currentPageEl = document.getElementById("current-page");
  const totalPagesEl = document.getElementById("total-pages");
  const prevBtn = document.querySelector('button[onclick="previousPage()"]');
  const nextBtn = document.querySelector('button[onclick="nextPage()"]');

  // Update page numbers
  if (currentPageEl) {
    currentPageEl.textContent = currentPageNum;
  }
  if (totalPagesEl) {
    totalPagesEl.textContent = totalPagesNum;
  }

  // Disable/enable buttons based on current page
  if (prevBtn) {
    if (currentPageNum <= 1) {
      prevBtn.disabled = true;
      prevBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  if (nextBtn) {
    if (currentPageNum >= totalPagesNum) {
      nextBtn.disabled = true;
      nextBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      nextBtn.disabled = false;
      nextBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

// ==================== FILTER ====================
function filterAppointments() {
  const searchText = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  const statusFilter = document.getElementById("statusFilter")?.value || "";

  // Store current filter values
  currentSearchText = searchText;
  currentStatusFilter = statusFilter;

  console.log("Filtering with:", { searchText, statusFilter });

  // If filter is active, do local filtering and pagination
  if (searchText || statusFilter) {
    // Filter locally from currently loaded appointments
    filteredAppointments = allAppointments.filter((apt) => {
      // Calculate display status (past Upcoming appointments show as Completed)
      let displayStatus = apt.status;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aptDate = new Date(apt.app_date);
      aptDate.setHours(0, 0, 0, 0);
      
      if (aptDate < today && displayStatus === "Upcoming") {
        displayStatus = "Completed";
      }

      // Check search match
      const matchesSearch =
        (apt.patient_name || "").toLowerCase().includes(searchText) ||
        (apt.doctor_name || "").toLowerCase().includes(searchText) ||
        (apt.app_date && apt.app_date.includes(searchText));
      
      // Check status match - compare with calculated display status
      const matchesStatus = !statusFilter || displayStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    console.log(`Filtered results: ${filteredAppointments.length} appointments`);
    
    // Reset to page 1 when filtering
    currentPage = 1;
    displayAppointments();
  } else {
    // No filter - show all appointments from allAppointments
    filteredAppointments = [...allAppointments];
    currentPage = 1;
    displayAppointments();
  }
}

// ==================== EDIT MODAL ====================
function openEditModal(appointmentId, status, comments, appointmentDate) {
  try {
    console.log("Opening edit for:", appointmentId, "Date:", appointmentDate);

    // Check if appointment is editable
    if (!isEditable(appointmentDate)) {
      const message = getEditableMessage(appointmentDate);
      showToast(message);
      console.warn("Edit blocked:", message);
      return;
    }

    currentEditId = appointmentId;

    const editStatus = document.getElementById("editStatus");
    const editComments = document.getElementById("editComments");

    if (status === "Upcoming") {
      status = "Completed";
    }

    if (editStatus) editStatus.value = status;
    if (editComments) editComments.value = comments;

    // Add a note to show this is a past appointment
    const modal = document.getElementById("editModal");
    if (modal) {
      modal.classList.add("active");

      // Add/update a warning note in the modal
      let warningNote = document.getElementById("editWarningNote");
      if (!warningNote) {
        warningNote = document.createElement("div");
        warningNote.id = "editWarningNote";
        const form = document.getElementById("editForm");
        if (form && form.parentNode) {
          form.parentNode.insertBefore(warningNote, form);
        }
      }
      warningNote.className =
        "mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700";
      warningNote.innerHTML =
        "📅 <strong>Note:</strong> This is a past appointment. You can modify the status and add comments.";
    }
  } catch (e) {
    console.error("Modal error:", e);
  }
}

function closeEditModal() {
  try {
    document.getElementById("editModal").classList.remove("active");
    currentEditId = null;

    // Remove warning note
    const warningNote = document.getElementById("editWarningNote");
    if (warningNote) warningNote.remove();
  } catch (e) {
    console.error("Close modal error:", e);
  }
}

// ==================== SAVE ====================
async function saveAppointment(event) {
  event.preventDefault();
  console.log("SAVE START");
  console.log("ID:", currentEditId);

  const status = (document.getElementById("editStatus")?.value || "").trim();
  const comments = (
    document.getElementById("editComments")?.value || ""
  ).trim();

  console.log("Data:", { status, comments });

  if (!currentEditId || !status) {
    console.warn("Validation failed");
    showToast("Status is required");
    return;
  }

  try {
    console.log("Sending to API...");

    const payload = {
      appointment_id: currentEditId,
      status: status,
      doctor_comments: comments,
    };

    const response = await fetch("../../api/admin/appointments.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log("Response:", response.status);
    const result = await response.json();
    console.log("Result:", result);

    if (result.status === "success") {
      console.log("SUCCESS");
      showToast("Appointment updated successfully!");
      closeEditModal();
      loadAppointments(currentPage);
    } else {
      console.warn("API error:", result.message);
      showToast(result.message || "Error saving appointment");
    }
  } catch (error) {
    console.error("Exception:", error);
    showToast("Error: " + error.message);
  }
  console.log("SAVE END");
}

// ==================== DELETE ====================
function openDeleteConfirm(appointmentId) {
  pendingDeleteAppointmentId = appointmentId;
  const modal = document.getElementById("deleteConfirmModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeDeleteConfirm() {
  pendingDeleteAppointmentId = null;
  const modal = document.getElementById("deleteConfirmModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

async function confirmDeleteAppointment() {
  if (!pendingDeleteAppointmentId) return;
  const appointmentId = pendingDeleteAppointmentId;
  closeDeleteConfirm();
  await deleteAppointment(appointmentId);
}

async function deleteAppointment(appointmentId) {
  if (!appointmentId) return;

  try {
    const response = await fetch("../../api/admin/appointments.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ appointment_id: appointmentId }),
    });

    const result = await response.json();
    if (result.status === "success") {
      showToast("Appointment deleted successfully!");
      loadAppointments(currentPage);
    } else {
      showToast(result.message || "Error deleting appointment");
    }
  } catch (error) {
    showToast("Error: " + error.message);
  }
}

// ==================== PAGINATION ====================
function nextPage() {
  const hasFilter = currentSearchText || currentStatusFilter;
  const totalPages = parseInt(
    document.getElementById("total-pages")?.textContent || "1",
  );
  
  if (currentPage < totalPages) {
    currentPage++;
    
    if (hasFilter) {
      // If filter active, just paginate through filtered results locally
      displayAppointments();
    } else {
      // If no filter, load next page from API
      loadAppointments(currentPage);
    }
  }
}

function previousPage() {
  const hasFilter = currentSearchText || currentStatusFilter;
  
  if (currentPage > 1) {
    currentPage--;
    
    if (hasFilter) {
      // If filter active, just paginate through filtered results locally
      displayAppointments();
    } else {
      // If no filter, load previous page from API
      loadAppointments(currentPage);
    }
  }
}

// ==================== FORM HANDLER ====================
function handleFormSubmit(e) {
  console.log("FORM SUBMITTED");
  e.preventDefault();
  saveAppointment(e);
}

// ==================== PAGE INIT ====================
document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  try {
    console.log("═══════════════════════════════════");
    console.log("  APPOINTMENTS PAGE INITIALIZATION");
    console.log("═══════════════════════════════════");

    updateCurrentDate();
    loadAppointments();

    // Auto-refresh appointments every 30 seconds to show new bookings
    setInterval(() => {
      console.log("Auto-refreshing appointments...");
      loadAppointments(currentPage);
    }, 30000);

    const editForm = document.getElementById("editForm");
    if (editForm) {
      editForm.addEventListener("submit", handleFormSubmit);
      console.log("Form listener attached");
    } else {
      console.warn("editForm not found");
    }

    console.log("Page ready");
  } catch (err) {
    console.error("INIT ERROR:", err);
    showToast("Page load error: " + err.message);
  }
}
