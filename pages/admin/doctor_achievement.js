let allAchievements = [];

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  fetchAchievements();
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

async function fetchAchievements() {
  showLoader();
  try {
    const response = await fetch("../../api/admin/doctor_achievements.php");
    const result = await response.json();

    if (result.status === "success") {
      allAchievements = result.data || [];
      updateSummaryCards(result.summary);
      renderTable(allAchievements);
      document.getElementById("last-updated").textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
  } finally {
    hideLoader();
  }
}


function updateSummaryCards(summary) {
  if (document.getElementById("stat-total-doctors"))
    document.getElementById("stat-total-doctors").textContent = summary.total_doctors || 0;
  if (document.getElementById("stat-completed"))
    document.getElementById("stat-completed").textContent = summary.total_completed || 0;
  
  // Calculate average performance
  const avgPerf = allAchievements.length > 0 
    ? Math.round(allAchievements.reduce((acc, curr) => acc + curr.performance, 0) / allAchievements.length) 
    : 0;
    
  if (document.getElementById("stat-avg-perf"))
    document.getElementById("stat-avg-perf").textContent = `${avgPerf}%`;
}

function renderTable(doctors) {
  const tableBody = document.getElementById("achievement-table-body");
  
  if (doctors.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 font-medium">No activity records found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = doctors.map(doc => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs">
            ${doc.full_name.charAt(0)}
          </div>
          <div>
            <span class="font-bold text-gray-800 block">${doc.full_name}</span>
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clinical Profile</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
          ${doc.specialization}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-gray-800">${doc.completed} <span class="text-gray-400 font-normal">Completed</span></span>
          <span class="text-[10px] text-gray-400">${doc.total} Total Appointments</span>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex flex-col gap-1 w-32">
          <div class="flex justify-between text-[10px] font-bold text-gray-400">
            <span>Progress</span>
            <span>${doc.performance}%</span>
          </div>
          <div class="perf-bar-bg">
            <div class="perf-bar-fill" style="width: ${doc.performance}%"></div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <button onclick="viewStats('${doc.user_id}')" class="text-teal hover:text-teal-dark font-bold text-xs uppercase tracking-widest transition-colors">
          Performance Details
        </button>
      </td>
    </tr>
  `).join("");
}

function filterAchievements() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allAchievements.filter(doc => 
    doc.full_name.toLowerCase().includes(search) || 
    doc.specialization.toLowerCase().includes(search)
  );
  renderTable(filtered);
}

function viewStats(id) {
  // Navigation to individual doctor profile/stats can be added here
  window.location.href = `doctor.html?id=${id}`;
}
