/*
  USER FEEDBACK MANAGEMENT JS
  ===========================
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allFeedback = [];
let filteredFeedback = [];

console.log("✓ feedback.js loaded");

// ==================== TOAST MESSAGES ====================
function showToast(message, isError = false) {
  try {
    const toast = document.createElement("div");
    toast.className = "toast shadow-lg";
    toast.textContent = message;
    if (isError) {
      toast.style.background = "#dc2626";
    }
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  } catch (e) {
    console.error("Toast error:", e);
  }
}

// ==================== DETAILS MODAL ====================
function closeDetailsModal() {
  try {
    const modal = document.getElementById("detailsModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  } catch (e) {
    console.error("✗ Close modal error:", e);
  }
}

function viewFeedbackDetails(id) {
  try {
    const item = allFeedback.find((f) => parseInt(f.id) === parseInt(id));
    if (!item) return;

    // Format submission date
    const dateSubmitted = new Date(item.created_at).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Populate modal fields
    document.getElementById("modalName").textContent = item.full_name || "Anonymous";
    document.getElementById("modalEmail").textContent = item.email || "N/A";
    document.getElementById("modalDate").textContent = `Submitted on: ${dateSubmitted}`;
    document.getElementById("modalMessage").textContent = item.message || "";

    // Set avatar initials
    const initials = (item.full_name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    document.getElementById("modalInitials").textContent = initials.substring(0, 2);

    // Setup action delete button in details modal
    const deleteBtn = document.getElementById("modalDeleteBtn");
    deleteBtn.onclick = () => {
      closeDetailsModal();
      deleteFeedback(id);
    };

    // Active modal class and lock body scroll
    const modal = document.getElementById("detailsModal");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (e) {
    console.error("✗ View details modal error:", e);
  }
}

// ==================== FETCH DATA ====================
async function loadFeedback(page = 1) {
  try {
    currentPage = page;
    console.log("► Fetching feedback page:", page);

    const response = await fetch(
      `../../api/admin/feedback.php?page=${page}&limit=10`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✓ API response:", result);

    if (result && result.status === "success") {
      allFeedback = result.data || [];
      filteredFeedback = [...allFeedback];

      // Update pagination displays
      const totalPagesEl = document.getElementById("total-pages");
      if (totalPagesEl) {
        totalPagesEl.textContent = result.pages || 1;
      }

      const currentPageEl = document.getElementById("current-page");
      if (currentPageEl) {
        currentPageEl.textContent = page;
      }

      displayFeedback();
    } else {
      const errorMsg = result?.message || "Could not retrieve feedback messages.";
      showToast(errorMsg, true);
      const tbody = document.getElementById("feedback-table-body");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Error: ${errorMsg}</td></tr>`;
      }
    }
  } catch (error) {
    console.error("✗ Load feedback error:", error);
    showToast("Connection failed: " + error.message, true);
    const tbody = document.getElementById("feedback-table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Connection Error. Please verify server status.<br>Details: ${error.message}</td></tr>`;
    }
  }
}

// ==================== DISPLAY DATA ====================
function displayFeedback() {
  try {
    const tbody = document.getElementById("feedback-table-body");
    if (!tbody) return;

    if (!filteredFeedback || filteredFeedback.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-12 text-gray-500 font-medium">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4"></path>
            </svg>
            No feedback submissions found.
          </td>
        </tr>
      `;
      return;
    }

    let html = "";
    for (const item of filteredFeedback) {
      const id = item.id;
      const fullName = (item.full_name || "Anonymous").replace(/'/g, "\\'");
      const email = (item.email || "N/A").replace(/'/g, "\\'");
      const rawMessage = item.message || "";
      
      // Truncate message for table view
      const maxLength = 75;
      const displayMessage = rawMessage.length > maxLength 
        ? rawMessage.substring(0, maxLength) + "..." 
        : rawMessage;

      // Format date
      const dateString = new Date(item.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      html += `
        <tr class="border-b hover:bg-gray-50 transition-colors">
          <td class="px-5 py-4 text-xs font-semibold text-gray-500">${dateString}</td>
          <td class="px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-teal/10 text-teal rounded-lg flex items-center justify-center text-xs font-bold">
                ${(item.full_name || "A")[0].toUpperCase()}
              </div>
              <span class="text-sm font-semibold text-gray-900">${fullName}</span>
            </div>
          </td>
          <td class="px-5 py-4 text-sm text-gray-600 font-medium">${email}</td>
          <td class="px-5 py-4 text-sm text-gray-600 leading-relaxed font-medium break-words max-w-xs md:max-w-md">${displayMessage}</td>
          <td class="px-5 py-4">
            <div class="flex items-center gap-2">
              <button onclick="viewFeedbackDetails(${id})" class="text-xs px-3 py-1.5 bg-teal text-white rounded-lg hover:bg-teal-dark font-bold transition-all shadow-sm">
                View
              </button>
              <button onclick="deleteFeedback(${id})" class="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-all">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
  } catch (e) {
    console.error("✗ Display feedback error:", e);
    showToast("Error listing submissions: " + e.message, true);
  }
}

// ==================== SEARCH FILTER ====================
function filterFeedback() {
  const searchText = (document.getElementById("searchInput")?.value || "").toLowerCase();

  if (!searchText) {
    filteredFeedback = [...allFeedback];
  } else {
    filteredFeedback = allFeedback.filter(
      (f) =>
        (f.full_name || "").toLowerCase().includes(searchText) ||
        (f.email || "").toLowerCase().includes(searchText) ||
        (f.message || "").toLowerCase().includes(searchText)
    );
  }

  displayFeedback();
}

// ==================== DELETE SUBMISSION ====================
async function deleteFeedback(id) {
  if (!confirm("Are you sure you want to permanently delete this feedback submission?")) return;

  try {
    console.log("► Deleting feedback ID:", id);

    const response = await fetch(
      "../../api/admin/feedback.php",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: id }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status === "success") {
      showToast("Feedback submission deleted successfully!");
      loadFeedback(currentPage);
    } else {
      showToast(result.message || "Could not delete feedback.", true);
    }
  } catch (error) {
    console.error("✗ Delete feedback error:", error);
    showToast("Delete failed: " + error.message, true);
  }
}

// ==================== PAGINATION CONTROLS ====================
function nextPage() {
  const totalPages = parseInt(
    document.getElementById("total-pages")?.textContent || "1"
  );
  if (currentPage < totalPages) {
    currentPage++;
    document.getElementById("current-page").textContent = currentPage;
    loadFeedback(currentPage);
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    document.getElementById("current-page").textContent = currentPage;
    loadFeedback(currentPage);
  }
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("╔═══════════════════════════════════╗");
  console.log("║    FEEDBACK PAGE INIALIZING       ║");
  console.log("╚═══════════════════════════════════╝");
  loadFeedback(1);
});
