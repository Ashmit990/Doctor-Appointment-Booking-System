let allDoctors = [];

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  fetchLeaderboard();
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

async function fetchLeaderboard() {
  const tableBody = document.getElementById("leaderboard-table-body");

  try {
    const response = await fetch("../../api/admin/leaderboard.php");
    const result = await response.json();

    if (result.status === "success") {
      allDoctors = result.data || [];
      updateSummaryCards(result.summary);
      renderLeaderboard(allDoctors);
      document.getElementById("last-updated").textContent =
        `Last updated: ${new Date().toLocaleTimeString()}`;
    } else {
      console.warn("API returned error, showing dummy data:", result.message);
      showDummyData();
    }
  } catch (error) {
    console.error("Failed to fetch leaderboard, showing dummy data:", error);
    showDummyData();
  }
}

function showDummyData() {
  // Enhanced dummy data to ensure the user sees SOMETHING beautiful
  allDoctors = [
    {
      rank: 1,
      full_name: "Dr. Sarah Jenkins",
      specialization: "Cardiology",
      tier: "Platinum",
      performance: 98,
      completed: 45,
      total: 46,
    },
    {
      rank: 2,
      full_name: "Dr. Michael Chen",
      specialization: "Neurology",
      tier: "Platinum",
      performance: 95,
      completed: 42,
      total: 44,
    },
    {
      rank: 3,
      full_name: "Dr. Elena Rodriguez",
      specialization: "Pediatrics",
      tier: "Gold",
      performance: 92,
      completed: 38,
      total: 41,
    },
    {
      rank: 4,
      full_name: "Dr. David Smith",
      specialization: "Dermatology",
      tier: "Gold",
      performance: 88,
      completed: 35,
      total: 40,
    },
    {
      rank: 5,
      full_name: "Dr. James Wilson",
      specialization: "Orthopedics",
      tier: "Silver",
      performance: 85,
      completed: 30,
      total: 35,
    },
  ];

  updateSummaryCards({ platinum: 2, gold: 2, silver: 1, total: 12 });
  renderLeaderboard(allDoctors);
  document.getElementById("last-updated").textContent =
    "Viewing dummy data (offline)";
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

function renderLeaderboard(doctors) {
  const tableBody = document.getElementById("leaderboard-table-body");

  if (doctors.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">No doctors found in the ranking.</td></tr>`;
    return;
  }

  tableBody.innerHTML = doctors
    .map((doc) => {
      const tierClass = `tier-${doc.tier.toLowerCase()}`;
      const rankClass = doc.rank <= 3 ? `rank-${doc.rank}` : "";
      const crownIcon =
        doc.rank === 1
          ? "👑"
          : doc.rank === 2
            ? "🥈"
            : doc.rank === 3
              ? "🥉"
              : "";

      return `
      <tr class="hover:bg-gray-50/80 transition-colors ${rankClass}">
        <td class="px-5 py-4 font-bold text-gray-400">
          <div class="flex items-center gap-2">
            <span class="rank-anim">${doc.rank}</span>
            <span class="text-lg">${crownIcon}</span>
          </div>
        </td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs">
              ${doc.full_name.charAt(0)}
            </div>
            <span class="font-semibold text-gray-800">${doc.full_name}</span>
          </div>
        </td>
        <td class="px-5 py-4 text-sm text-gray-500 hidden sm:table-cell">
          ${doc.specialization}
        </td>
        <td class="px-5 py-4">
          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierClass}">
            ${doc.tier}
          </span>
        </td>
        <td class="px-5 py-4 hidden md:table-cell">
          <div class="flex flex-col gap-1 w-32">
            <div class="flex justify-between text-[10px] font-bold text-gray-400">
              <span>${doc.performance}%</span>
              <span>${doc.completed} Appts</span>
            </div>
            <div class="perf-bar-bg">
              <div class="perf-bar-fill" style="width: ${doc.performance}%"></div>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <button onclick="showDoctorDetails('${doc.user_id || doc.rank}')" class="text-teal hover:text-teal-dark font-bold text-xs uppercase tracking-wider transition-colors">
            View Stats
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

  const filtered = allDoctors.filter((doc) => {
    const matchesSearch =
      doc.full_name.toLowerCase().includes(search) ||
      doc.specialization.toLowerCase().includes(search);
    const matchesTier = !tier || doc.tier === tier;
    return matchesSearch && matchesTier;
  });

  renderLeaderboard(filtered);
}

function showDoctorDetails(id) {
  const modal = document.getElementById("doctorModal");
  const modalBody = document.getElementById("modalBody");

  // Find doctor in current list
  const doc = allDoctors.find((d) => d.user_id == id || d.rank == id);

  if (!doc) return;

  document.getElementById("modalDoctorName").textContent = doc.full_name;

  modalBody.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center gap-4 bg-teal-bg p-4 rounded-2xl">
        <div class="w-16 h-16 rounded-full bg-teal text-white flex items-center justify-center text-2xl font-bold">
          ${doc.full_name.charAt(0)}
        </div>
        <div>
          <h4 class="text-xl font-bold text-teal-dark">${doc.full_name}</h4>
          <p class="text-sm text-teal-light font-medium">${doc.specialization}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Rank</p>
          <p class="text-2xl font-black text-gray-800">#${doc.rank}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tier</p>
          <p class="text-lg font-bold text-teal">${doc.tier}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between items-end">
          <p class="text-xs font-bold text-gray-500 uppercase">Overall Performance</p>
          <p class="text-sm font-black text-teal">${doc.performance}%</p>
        </div>
        <div class="perf-bar-bg h-3">
          <div class="perf-bar-fill h-3" style="width: ${doc.performance}%"></div>
        </div>
        <p class="text-[10px] text-gray-400 font-medium">
          Calculated based on ${doc.completed} completed out of ${doc.total} total appointments scheduled.
        </p>
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
  document.getElementById("doctorModal").classList.remove("active");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("overlay").classList.toggle("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("overlay").classList.add("hidden");
}
