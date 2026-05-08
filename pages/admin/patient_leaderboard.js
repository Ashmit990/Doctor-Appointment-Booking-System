let allPatients = [];

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  fetchPatientLeaderboard();
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

async function fetchPatientLeaderboard() {
  try {
    const response = await fetch("../../api/admin/patient_leaderboard.php");
    const result = await response.json();

    if (result.status === "success") {
      allPatients = result.data || [];
      updateSummaryCards(result.summary);
      renderLeaderboard(allPatients);
      document.getElementById("last-updated").textContent =
        `Last updated: ${new Date().toLocaleTimeString()}`;
    } else {
      console.warn("API returned error:", result.message);
    }
  } catch (error) {
    console.error("Failed to fetch patient leaderboard:", error);
  }
}

function updateSummaryCards(summary) {
  if (document.getElementById("stat-platinum"))
    document.getElementById("stat-platinum").textContent =
      summary.platinum || 0;
  if (document.getElementById("stat-gold"))
    document.getElementById("stat-gold").textContent = summary.gold || 0;
  if (document.getElementById("stat-silver"))
    document.getElementById("stat-silver").textContent = summary.silver || 0;
  if (document.getElementById("stat-total"))
    document.getElementById("stat-total").textContent = summary.total || 0;
}

function getTierIcon(tier) {
  switch (tier) {
    case "Platinum":
      return "💎";
    case "Gold":
      return "🥇";
    case "Silver":
      return "🥈";
    case "Bronze":
      return "🥉";
    default:
      return "⭐";
  }
}

function renderLeaderboard(patients) {
  const tableBody = document.getElementById("leaderboard-table-body");

  if (patients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-500">No patients found in the ranking.</td></tr>`;
    return;
  }

  tableBody.innerHTML = patients
    .map((pat, idx) => {
      const tierClass = `tier-${pat.tier.toLowerCase()}`;
      const rankClass = pat.rank <= 3 ? `rank-${pat.rank}` : "";
      const crownIcon =
        pat.rank === 1
          ? "👑"
          : pat.rank === 2
            ? "🥈"
            : pat.rank === 3
              ? "🥉"
              : "";

      // Points breakdown tooltip text
      const pointsBreakdown = `Appointments: ${pat.total_appointments}×10 = ${pat.total_appointments * 10}\nCompleted: ${pat.completed_appointments}×25 = ${pat.completed_appointments * 25}\nFeedback: ${pat.feedback_count}×15 = ${pat.feedback_count * 15}\nTickets: ${pat.ticket_count}×20 = ${pat.ticket_count * 20}`;

      return `
      <tr class="hover:bg-gray-50/80 transition-colors ${rankClass}">
        <td class="px-5 py-4 font-bold text-gray-400">
          <div class="flex items-center gap-2">
            <span class="rank-anim">${pat.rank}</span>
            <span class="text-lg">${crownIcon}</span>
          </div>
        </td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-teal/20 to-teal/5 flex items-center justify-center text-teal font-bold text-xs border border-teal/10">
              ${pat.full_name.charAt(0)}
            </div>
            <div>
              <span class="font-semibold text-gray-800 block">${pat.full_name}</span>
              <span class="text-[10px] text-gray-400">${pat.email}</span>
            </div>
          </div>
        </td>
        <td class="px-5 py-4 hidden sm:table-cell">
          <div class="flex items-center gap-1.5" title="${pointsBreakdown}">
            <span class="text-lg font-black text-gray-800">${pat.points}</span>
            <span class="text-[10px] text-gray-400 font-semibold uppercase">pts</span>
          </div>
        </td>
        <td class="px-5 py-4">
          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierClass}">
            ${getTierIcon(pat.tier)} ${pat.tier}
          </span>
        </td>
        <td class="px-5 py-4 hidden md:table-cell">
          <div class="flex flex-col gap-1 w-32">
            <div class="flex justify-between text-[10px] font-bold text-gray-400">
              <span></span>
              <span>${pat.completed_appointments}/${pat.total_appointments} Appts</span>
            </div>
            <div class="perf-bar-bg">
              <div class="perf-bar-fill" style="width: ${pat.engagement}%"></div>
            </div>
          </div>
        </td>
        <td class="px-5 py-4 hidden lg:table-cell">
          <div class="flex gap-3 text-[10px] font-semibold text-gray-500">
            <span title="Appointments booked" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
              ${pat.total_appointments}
            </span>
            <span title="Feedback given" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ${pat.feedback_count}
            </span>
            <span title="Treatment tickets" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z"/></svg>
              ${pat.ticket_count}
            </span>
          </div>
        </td>
        <td class="px-5 py-4">
          <button onclick="showPatientDetails('${pat.user_id}')" class="text-teal hover:text-teal-dark font-bold text-xs uppercase tracking-wider transition-colors">
            View Details
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

function filterLeaderboard() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const tier = document.getElementById("tierFilter").value;

  const filtered = allPatients.filter((pat) => {
    const matchesSearch =
      pat.full_name.toLowerCase().includes(search) ||
      pat.email.toLowerCase().includes(search);
    const matchesTier = !tier || pat.tier === tier;
    return matchesSearch && matchesTier;
  });

  renderLeaderboard(filtered);
}

function showPatientDetails(id) {
  const modal = document.getElementById("patientModal");
  const modalBody = document.getElementById("modalBody");

  const pat = allPatients.find((p) => p.user_id === id);

  if (!pat) return;

  document.getElementById("modalPatientName").textContent = pat.full_name;

  const tierClass = `tier-${pat.tier.toLowerCase()}`;
  const memberDate = pat.member_since
    ? new Date(pat.member_since).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  modalBody.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center gap-4 bg-gradient-to-r from-teal-bg to-white p-5 rounded-2xl border border-teal/10">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-teal to-teal-light text-white flex items-center justify-center text-2xl font-bold shadow-lg">
          ${pat.full_name.charAt(0)}
        </div>
        <div>
          <h4 class="text-xl font-bold text-teal-dark">${pat.full_name}</h4>
          <p class="text-sm text-gray-500 font-medium">${pat.email}</p>
          <p class="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Member since ${memberDate}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Rank</p>
          <p class="text-2xl font-black text-gray-800">#${pat.rank}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Points</p>
          <p class="text-2xl font-black text-teal">${pat.points}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tier</p>
          <span class="inline-block px-3 py-1 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierClass}">
            ${getTierIcon(pat.tier)} ${pat.tier}
          </span>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-xs font-bold text-gray-500 uppercase">Points Breakdown</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center text-sm">📅</div>
            <div>
              <p class="text-xs font-bold text-gray-700">${pat.total_appointments} Appointments</p>
              <p class="text-[10px] text-gray-400">+${pat.total_appointments * 10} pts</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
            <div class="w-8 h-8 rounded-lg bg-green-100 text-green-500 flex items-center justify-center text-sm">✅</div>
            <div>
              <p class="text-xs font-bold text-gray-700">${pat.completed_appointments} Completed</p>
              <p class="text-[10px] text-gray-400">+${pat.completed_appointments * 25} pts</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
            <div class="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-500 flex items-center justify-center text-sm">⭐</div>
            <div>
              <p class="text-xs font-bold text-gray-700">${pat.feedback_count} Feedbacks</p>
              <p class="text-[10px] text-gray-400">+${pat.feedback_count * 15} pts</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
            <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-500 flex items-center justify-center text-sm">🎫</div>
            <div>
              <p class="text-xs font-bold text-gray-700">${pat.ticket_count} Tickets</p>
              <p class="text-[10px] text-gray-400">+${pat.ticket_count * 20} pts</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between items-end">
          <p class="text-xs font-bold text-gray-500 uppercase">Engagement Rate</p>
          <p class="text-sm font-black text-teal"></p>
        </div>
        <div class="perf-bar-bg h-3">
          <div class="perf-bar-fill h-3" style="width: ${pat.engagement}%"></div>
        </div>
        <p class="text-[10px] text-gray-400 font-medium">
          ${pat.completed_appointments} completed out of ${pat.total_appointments} total appointments booked.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Gender</p>
          <p class="text-sm font-semibold text-gray-700">${pat.gender || "N/A"}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Blood Group</p>
          <p class="text-sm font-semibold text-gray-700">${pat.blood_group || "N/A"}</p>
        </div>
      </div>
      
      <div class="pt-4 border-t border-gray-100 flex justify-end">
        <button onclick="closeModal()" class="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">
          Close Details
        </button>
      </div>
    </div>
  `;

  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("patientModal").classList.remove("active");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("overlay").classList.toggle("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("overlay").classList.add("hidden");
}
