// pages/admin/leaderboard.js
console.log("✅ leaderboard.js loaded successfully!");

let allDoctors = [];
let filteredDoctors = [];

// =================== MOCK DATA ====================
function generateMockData() {
  console.log("🔄 Generating mock data...");
  const specializations = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology",
    "Oncology",
    "Radiology",
    "Psychiatry",
    "ENT",
    "General Surgery",
  ];
  const names = [
    "Dr. Sarah Johnson",
    "Dr. Michael Chen",
    "Dr. Priya Patel",
    "Dr. James Walker",
    "Dr. Emily Torres",
    "Dr. Daniel Kim",
    "Dr. Fatima Al-Hassan",
    "Dr. Lucas Müller",
    "Dr. Amara Osei",
    "Dr. Ravi Sharma",
    "Dr. Olivia Martin",
    "Dr. Noah Reyes",
    "Dr. Isabella Nguyen",
    "Dr. Elijah Brown",
    "Dr. Sophia Clark",
  ];

  const doctors = names
    .map((name, i) => {
      const completed = Math.floor(Math.random() * 180) + 20;
      const total = completed + Math.floor(Math.random() * 40);
      const rating = +(3.5 + Math.random() * 1.5).toFixed(1);
      const points = Math.round(
        completed * 10 + rating * 50 + Math.random() * 100,
      );

      return {
        id: i + 1,
        name,
        specialization: specializations[i % specializations.length],
        completed,
        total,
        missed: total - completed - Math.floor(Math.random() * 10),
        upcoming: Math.floor(Math.random() * 20),
        rating,
        points,
        joinedDate: "2022-0" + ((i % 9) + 1) + "-15",
      };
    })
    .sort((a, b) => b.points - a.points);

  console.log(`✅ Generated ${doctors.length} doctors`);
  return doctors;
}

function getTier(points) {
  if (points >= 1500) return "Platinum";
  if (points >= 900) return "Gold";
  if (points >= 400) return "Silver";
  return "Bronze";
}

function getTierClass(tier) {
  const classes = {
    Platinum: "tier-platinum",
    Gold: "tier-gold",
    Silver: "tier-silver",
    Bronze: "tier-bronze",
  };
  return classes[tier] || "tier-bronze";
}

function getTierEmoji(tier) {
  const emojis = { Platinum: "🏆", Gold: "🥇", Silver: "🥈", Bronze: "🥉" };
  return emojis[tier] || "🥉";
}

function getRankStyle(rank) {
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  return "";
}

function getRankDisplay(rank) {
  if (rank === 1) return '<span class="text-xl crown-1">👑</span>';
  if (rank === 2) return '<span class="text-base crown-2 font-bold">#2</span>';
  if (rank === 3) return '<span class="text-base crown-3 font-bold">#3</span>';
  return `<span class="text-sm font-semibold text-gray-500">#${rank}</span>`;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = "";
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '<span class="text-yellow-400">★</span>';
    else if (i === full && half)
      html += '<span class="text-yellow-300">★</span>';
    else html += '<span class="text-gray-200">★</span>';
  }
  return html;
}

function renderTierProgress(points) {
  const tiers = [
    { name: "Bronze", min: 0, max: 399, color: "#bf8040" },
    { name: "Silver", min: 400, max: 899, color: "#546e7a" },
    { name: "Gold", min: 900, max: 1499, color: "#f57f17" },
    { name: "Platinum", min: 1500, max: 2000, color: "#1565c0" },
  ];

  return tiers
    .map((t) => {
      const capped = Math.min(points, t.max);
      const pct =
        points >= t.min
          ? Math.min(
              Math.round(((capped - t.min) / (t.max - t.min)) * 100),
              100,
            )
          : 0;
      const active = points >= t.min;
      return `
      <div class="flex items-center gap-3 mb-2">
        <span class="text-xs w-16 text-right font-medium" style="color:${t.color}">${t.name}</span>
        <div class="flex-1 perf-bar-bg">
          <div class="perf-bar-fill" style="width:${pct}%; background:${t.color}; opacity:${active ? 1 : 0.3}"></div>
        </div>
        <span class="text-xs text-gray-400 w-8">${pct}%</span>
      </div>`;
    })
    .join("");
}

async function loadLeaderboard() {
  console.log("🔄 loadLeaderboard() called");
  const tbody = document.getElementById("leaderboard-table-body");

  if (!tbody) {
    console.error("❌ Could not find leaderboard-table-body element!");
    return;
  }

  console.log("✅ Found tbody element");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center py-10 text-gray-500">Loading...</td</tr>';

  await new Promise((r) => setTimeout(r, 600));
  allDoctors = generateMockData();

  allDoctors.forEach((d, i) => {
    d.rank = i + 1;
    d.tier = getTier(d.points);
  });

  console.log("📊 Doctors data:", allDoctors.slice(0, 3)); // Log first 3 doctors

  updateSummaryCards();
  filterLeaderboard();

  const lastUpdated = document.getElementById("last-updated");
  if (lastUpdated) {
    lastUpdated.textContent =
      "Last updated: " +
      new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  }

  console.log("✅ Leaderboard loaded successfully!");
}

function updateSummaryCards() {
  console.log("🔄 Updating summary cards");
  const counts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  allDoctors.forEach((d) => counts[d.tier]++);

  const platinumEl = document.getElementById("stat-platinum");
  const goldEl = document.getElementById("stat-gold");
  const silverEl = document.getElementById("stat-silver");
  const totalEl = document.getElementById("stat-total");

  if (platinumEl) platinumEl.textContent = counts.Platinum;
  if (goldEl) goldEl.textContent = counts.Gold;
  if (silverEl) silverEl.textContent = counts.Silver;
  if (totalEl) totalEl.textContent = allDoctors.length;

  console.log("Summary cards updated:", counts);
}

function filterLeaderboard() {
  console.log("🔄 filterLeaderboard() called");
  const search = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  const tier = document.getElementById("tierFilter")?.value || "";
  const sort = document.getElementById("sortFilter")?.value || "points";

  console.log(
    `Filters - Search: "${search}", Tier: "${tier}", Sort: "${sort}"`,
  );

  filteredDoctors = allDoctors.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search) ||
      d.specialization.toLowerCase().includes(search);
    const matchTier = !tier || d.tier === tier;
    return matchSearch && matchTier;
  });

  filteredDoctors.sort((a, b) => {
    if (sort === "completed") return b.completed - a.completed;
    if (sort === "rating") return b.rating - a.rating;
    return b.points - a.points;
  });

  console.log(`Filtered to ${filteredDoctors.length} doctors`);
  renderTable();
}

function renderTable() {
  console.log("🔄 renderTable() called");
  const tbody = document.getElementById("leaderboard-table-body");

  if (!tbody) {
    console.error("❌ tbody not found!");
    return;
  }

  if (!filteredDoctors.length) {
    console.warn("⚠️ No doctors found to display");
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-10 text-gray-500">No doctors found</td>\n</tr>';
    return;
  }

  const maxPoints = Math.max(...filteredDoctors.map((d) => d.points), 1);
  console.log(`Max points: ${maxPoints}`);

  tbody.innerHTML = filteredDoctors
    .map((doc, idx) => {
      const rank = doc.rank;
      const tier = doc.tier;
      const perfPct = Math.round((doc.points / maxPoints) * 100);
      const initial = doc.name.replace("Dr. ", "").charAt(0).toUpperCase();

      return `
      <tr class="border-b hover:bg-gray-50 transition-colors ${getRankStyle(rank)}">
        <td class="px-5 py-4 text-center rank-anim" style="animation-delay:${idx * 0.04}s">
          ${getRankDisplay(rank)}
        </td>
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-sm shrink-0">${initial}</div>
            <div>
              <p class="text-sm font-semibold text-gray-800">${doc.name}</p>
              <p class="text-xs text-gray-400">${renderStars(doc.rating)} ${doc.rating}</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">${doc.specialization}</td>
        <td class="px-5 py-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getTierClass(tier)}">
            ${getTierEmoji(tier)} ${tier}
          </span>
        </td>
        <td class="px-5 py-4">
          <span class="text-sm font-bold text-teal-dark">${doc.points.toLocaleString()}</span>
          <span class="text-xs text-gray-400 ml-1">pts</span>
        </td>
        <td class="px-5 py-4 hidden md:table-cell w-36">
          <div class="perf-bar-bg">
            <div class="perf-bar-fill" style="width:${perfPct}%"></div>
          </div>
          <p class="text-xs text-gray-400 mt-1">${doc.completed} completed</p>
        </td>
        <td class="px-5 py-4">
          <button onclick="openDoctorModal(${doc.id})" class="text-xs px-3 py-1.5 bg-teal-bg text-teal rounded-lg hover:bg-teal hover:text-white transition-colors font-semibold">View</button>
        </td>
      </tr>
    `;
    })
    .join("");

  console.log(`✅ Rendered ${filteredDoctors.length} doctors to table`);
}

function openDoctorModal(id) {
  const doc = allDoctors.find((d) => d.id === id);
  if (!doc) return;

  document.getElementById("modalDoctorName").textContent = doc.name;
  document.getElementById("modalBody").innerHTML = `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <span class="px-3 py-1.5 rounded-full text-sm font-semibold ${getTierClass(doc.tier)}">
          ${getTierEmoji(doc.tier)} ${doc.tier} Tier
        </span>
        <span class="text-2xl font-bold text-teal-dark">${doc.points.toLocaleString()} pts</span>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-teal-bg rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-teal-dark">#${doc.rank}</p>
          <p class="text-xs text-gray-500">Overall Rank</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-green-700">${doc.completed}</p>
          <p class="text-xs text-gray-500">Completed</p>
        </div>
        <div class="bg-orange-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-orange-600">${doc.upcoming}</p>
          <p class="text-xs text-gray-500">Upcoming</p>
        </div>
        <div class="bg-red-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-red-600">${doc.missed}</p>
          <p class="text-xs text-gray-500">Missed</p>
        </div>
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm text-gray-500">Specialization</span>
          <span class="text-sm font-semibold text-gray-800">${doc.specialization}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm text-gray-500">Rating</span>
          <span class="text-sm font-semibold text-gray-800">${renderStars(doc.rating)} ${doc.rating} / 5</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm text-gray-500">Total Appointments</span>
          <span class="text-sm font-semibold text-gray-800">${doc.total}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
          <span class="text-sm text-gray-500">Completion Rate</span>
          <span class="text-sm font-semibold text-teal-dark">${Math.round((doc.completed / doc.total) * 100)}%</span>
        </div>
        <div class="flex justify-between items-center py-2">
          <span class="text-sm text-gray-500">Member Since</span>
          <span class="text-sm font-semibold text-gray-800">${new Date(doc.joinedDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-xl p-4">
        <p class="text-xs font-semibold text-gray-500 uppercase mb-3">Points Breakdown</p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Completed × 10 pts</span>
            <span class="font-semibold">${doc.completed * 10}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Rating bonus</span>
            <span class="font-semibold">${Math.round(doc.rating * 50)}</span>
          </div>
          <div class="flex justify-between text-sm border-t pt-2 mt-2">
            <span class="font-semibold text-gray-800">Total Points</span>
            <span class="font-bold text-teal-dark">${doc.points}</span>
          </div>
        </div>
      </div>
      
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Tier Progress</p>
        ${renderTierProgress(doc.points)}
      </div>
    </div>
  `;
  document.getElementById("doctorModal").classList.add("active");
}

function closeModal() {
  document.getElementById("doctorModal").classList.remove("active");
}

document.getElementById("doctorModal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("doctorModal")) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function fixSidebarActiveState() {
  const currentPage = window.location.pathname.split("/").pop();
  const allLinks = document.querySelectorAll(
    "#sidebar nav a, #sidebar .border-t a",
  );
  allLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("bg-white/20", "text-white");
      link.classList.remove("text-white/75");
    } else {
      link.classList.remove("bg-white/20");
      link.classList.add("text-white/75");
    }
  });
}

function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const el = document.getElementById("current-date");
  if (el) el.textContent = new Date().toLocaleDateString("en-US", options);
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("overlay").classList.toggle("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("overlay").classList.add("hidden");
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  if (isError) toast.style.background = "#dc2626";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOMContentLoaded event fired");
  updateCurrentDate();
  fixSidebarActiveState();
  loadLeaderboard();
});

// Also try to load immediately in case DOMContentLoaded already fired
if (document.readyState === "loading") {
  console.log("Document still loading, waiting for DOMContentLoaded");
} else {
  console.log("Document already loaded, initializing immediately");
  updateCurrentDate();
  fixSidebarActiveState();
  loadLeaderboard();
}
