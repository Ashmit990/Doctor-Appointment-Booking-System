let allActivity = [];

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  fetchActivity();
});

function updateCurrentDate() {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const dateElem = document.getElementById("current-date");
  if (dateElem) dateElem.textContent = new Date().toLocaleDateString("en-US", options);
}

function showLoader() {
  const loader = document.getElementById("page-loader");
  if (loader) { loader.style.width = "70%"; loader.style.opacity = "1"; }
}
function hideLoader() {
  const loader = document.getElementById("page-loader");
  if (loader) {
    loader.style.width = "100%";
    setTimeout(() => { loader.style.opacity = "0"; setTimeout(() => { loader.style.width = "0%"; }, 500); }, 200);
  }
}

async function fetchActivity() {
  showLoader();
  try {
    const period = document.getElementById("discountPeriod") ? document.getElementById("discountPeriod").value : 'all';
    const response = await fetch(`../../api/admin/patient_activity.php?period=${period}`);
    const result = await response.json();

    if (result.status === "success") {
      allActivity = result.data || [];
      updateSummaryCards(result.summary);
      renderTable(allActivity);
      document.getElementById("last-updated").textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  } catch (error) {
    console.error("Failed to fetch activity:", error);
  } finally {
    hideLoader();
  }
}





function updateSummaryCards(summary) {
  if (document.getElementById("stat-active"))
    document.getElementById("stat-active").textContent = summary.active_this_month || 0;
    
  const totalTickets = allActivity.reduce((acc, curr) => acc + curr.ticket_count, 0);
  if (document.getElementById("stat-tickets"))
    document.getElementById("stat-tickets").textContent = totalTickets;
}

function renderTable(patients) {
  const tableBody = document.getElementById("activity-table-body");
  
  if (patients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 font-medium">No activity records found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = patients.map(pat => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs">
            ${pat.full_name.charAt(0)}
          </div>
          <div>
            <span class="font-bold text-gray-800 block">${pat.full_name}</span>
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${pat.email}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-gray-800">${pat.completed_appointments} <span class="text-gray-400 font-normal">Completed</span></span>
          <span class="text-[10px] text-gray-400">${pat.total_appointments} Total Bookings</span>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex flex-col gap-1 w-32">
          <div class="flex justify-between text-[10px] font-bold text-gray-400">
            <span>Engagement</span>
            <span>${pat.engagement}%</span>
          </div>
          <div class="engagement-bar-bg">
            <div class="engagement-bar-fill" style="width: ${pat.engagement}%"></div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex gap-4">
          <div class="flex flex-col">
             <span class="text-xs font-bold text-gray-700">${pat.feedback_count}</span>
             <span class="text-[10px] text-gray-400 uppercase font-bold">Feedback</span>
          </div>
          <div class="flex flex-col">
             <span class="text-xs font-bold text-gray-700">${pat.ticket_count}</span>
             <span class="text-[10px] text-gray-400 uppercase font-bold">Tickets</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <button onclick="viewPatient('${pat.user_id}')" class="text-teal hover:text-teal-dark font-bold text-xs uppercase tracking-widest transition-colors">
          View Activity
        </button>
      </td>
    </tr>
  `).join("");
}

function filterActivity() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allActivity.filter(pat => 
    pat.full_name.toLowerCase().includes(search) || 
    pat.email.toLowerCase().includes(search)
  );
  renderTable(filtered);
}

function viewPatient(id) {
    // Navigate to users/patients page with filter or show modal
    window.location.href = `users.html?id=${id}`;
}
