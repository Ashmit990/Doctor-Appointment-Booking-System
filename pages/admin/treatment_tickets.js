/*
  TREATMENT TICKETS PAGE
  ======================
  Admin can view, search, and filter all generated treatment tickets.
  Place this file at: pages/admin/treatment_tickets.js
*/

// ==================== GLOBAL STATE ====================
let allTickets = [];
let filteredTickets = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

console.log("✓ treatment_tickets.js loading...");

// ==================== UTILITIES ====================
function showToast(msg, isError = false) {
  try {
    const t = document.createElement("div");
    t.className = "toast" + (isError ? " error" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  } catch (e) {
    console.error("Toast error:", e);
  }
}

function updateCurrentDate() {
  const el = document.getElementById("current-date");
  if (el) {
    el.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

function formatCurrency(val) {
  return (
    "Rs. " +
    parseFloat(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })
  );
}

function formatDateTime(dt) {
  if (!dt) return "N/A";
  const d = new Date(dt);
  return (
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==================== LOAD DATA ====================
async function loadTickets() {
  try {
    console.log("► Fetching treatment tickets...");
    const res = await fetch("../../api/admin/treatment_tickets.php", {
      credentials: "include",
    });

    if (!res.ok) throw new Error("HTTP " + res.status + ": " + res.statusText);

    const result = await res.json();
    console.log("✓ API Response:", result);

    if (result.status === "success") {
      allTickets = result.data || [];
      filteredTickets = [...allTickets];
      populateCategoryFilter(result.categories || []);
      updateStats(result.stats || {});
      currentPage = 1;
      renderTable();
    } else {
      showToast(result.message || "Error loading tickets", true);
      document.getElementById("tickets-table-body").innerHTML =
        '<tr><td colspan="7" class="text-center py-10 text-red-500">' +
        escHtml(result.message || "Failed to load tickets") +
        "</td></tr>";
    }
  } catch (err) {
    console.error("✗ Fetch error:", err);
    showToast("Connection error: " + err.message, true);
    document.getElementById("tickets-table-body").innerHTML =
      '<tr><td colspan="7" class="text-center py-10 text-red-500">Connection Error. Make sure XAMPP is running.</td></tr>';
  }
}

// ==================== POPULATE CATEGORY FILTER ====================
function populateCategoryFilter(categories) {
  const sel = document.getElementById("categoryFilter");
  sel.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

// ==================== UPDATE STATS ====================
function updateStats(stats) {
  document.getElementById("stat-total").textContent =
    stats.total_tickets || allTickets.length || 0;
  document.getElementById("stat-revenue").textContent = formatCurrency(
    stats.total_revenue || 0,
  );
  document.getElementById("stat-patients").textContent =
    stats.unique_patients || 0;
  document.getElementById("stat-categories").textContent =
    stats.categories_used || 0;
}

// ==================== FILTER ====================
function filterTickets() {
  const search = (
    document.getElementById("searchInput").value || ""
  ).toLowerCase();
  const catFilter = document.getElementById("categoryFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

  filteredTickets = allTickets.filter((t) => {
    const matchSearch =
      !search ||
      (t.ticket_number || "").toLowerCase().includes(search) ||
      (t.patient_id || "").toLowerCase().includes(search) ||
      (t.patient_name || "").toLowerCase().includes(search) ||
      (t.category_name || "").toLowerCase().includes(search);

    const matchCat = !catFilter || String(t.category_id) === catFilter;

    const matchDate =
      !dateFilter || (t.generated_at || "").substring(0, 10) === dateFilter;

    return matchSearch && matchCat && matchDate;
  });

  currentPage = 1;
  renderTable();
}

// ==================== RENDER TABLE ====================
function renderTable() {
  const tbody = document.getElementById("tickets-table-body");
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / ITEMS_PER_PAGE),
  );
  if (currentPage > totalPages) currentPage = totalPages;

  document.getElementById("current-page").textContent = currentPage;
  document.getElementById("total-pages").textContent = totalPages;

  if (!filteredTickets.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-10 text-gray-500">No tickets found</td></tr>';
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageData = filteredTickets.slice(start, start + ITEMS_PER_PAGE);

  tbody.innerHTML = pageData
    .map(
      (t) => `
      <tr class="ticket-row border-b">
        <td class="px-5 py-4">
          <span class="font-mono text-xs bg-teal-bg text-teal-dark font-semibold px-2 py-1 rounded">
            ${escHtml(t.ticket_number || "N/A")}
          </span>
        </td>
        <td class="px-5 py-4">
          <div class="text-sm font-semibold text-gray-800">${escHtml(t.patient_name || "Unknown")}</div>
          <div class="text-xs text-gray-400 font-medium">${escHtml(t.patient_id || "N/A")}</div>
        </td>
        <td class="px-5 py-4">
          <span class="text-sm font-medium text-gray-700">${escHtml(t.category_name || "Unknown")}</span>
          ${
            t.category_description
              ? `<p class="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]" title="${escHtml(t.category_description)}">${escHtml(t.category_description)}</p>`
              : ""
          }
        </td>
        <td class="px-5 py-4 text-sm text-gray-600">#${escHtml(String(t.appointment_id || "N/A"))}</td>
        <td class="px-5 py-4">
          <span class="text-sm font-bold text-teal-dark">${formatCurrency(t.cost)}</span>
          <p class="text-[10px] text-gray-400 font-medium">30 min duration</p>
        </td>
        <td class="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
          ${formatDateTime(t.generated_at)}
        </td>
        <td class="px-5 py-4">
          <button
            onclick='openDetailModal(${JSON.stringify(t).replace(/'/g, "&#39;")})'
            class="text-xs px-3 py-1.5 bg-teal-bg text-teal rounded-lg hover:bg-teal hover:text-white font-semibold transition-colors">
            View Details
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

// ==================== DETAIL MODAL ====================
function openDetailModal(ticket) {
  document.getElementById("detailContent").innerHTML = `
    <div class="space-y-4">
      <div class="bg-teal-bg rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 bg-teal rounded-full flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>
        <div>
          <p class="font-mono font-bold text-teal-dark text-base">${escHtml(ticket.ticket_number || "N/A")}</p>
          <p class="text-xs text-gray-500">Generated: ${formatDateTime(ticket.generated_at)}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-50 rounded-xl p-3 col-span-2">
          <p class="text-xs text-gray-400 mb-1">Patient Info</p>
          <p class="font-bold text-gray-800 text-sm">${escHtml(ticket.patient_name || "Unknown")}</p>
          <p class="text-xs text-gray-500">${escHtml(ticket.patient_id || "N/A")}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Appointment ID</p>
          <p class="font-semibold text-gray-800 text-sm">#${escHtml(String(ticket.appointment_id || "N/A"))}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Treatment Category</p>
          <p class="font-semibold text-gray-800 text-sm">${escHtml(ticket.category_name || "Unknown")}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Treatment Cost</p>
          <p class="font-bold text-teal-dark text-sm">${formatCurrency(ticket.cost)}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Treatment Duration</p>
          <p class="font-semibold text-gray-800 text-sm">30 Minutes</p>
        </div>
      </div>

      ${
        ticket.category_description
          ? `<div class="bg-gray-50 rounded-xl p-3">
               <p class="text-xs text-gray-400 mb-1">Category Description</p>
               <p class="text-sm text-gray-700">${escHtml(ticket.category_description)}</p>
             </div>`
          : ""
      }
    </div>
  `;
  document.getElementById("detailModal").classList.add("active");
}

function closeDetailModal() {
  document.getElementById("detailModal").classList.remove("active");
}

// ==================== PAGINATION ====================
function nextPage() {
  const total = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  if (currentPage < total) {
    currentPage++;
    renderTable();
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  TREATMENT TICKETS PAGE INIT         ║");
  console.log("╚══════════════════════════════════════╝");
  updateCurrentDate();
  loadTickets();
});
