/*
  DOCTORS PAGE - MANAGE DOCTORS
  ============================
  Clean reorganized version with all utilities first
*/

// ==================== GLOBAL STATE ====================
let currentPage = 1;
let allDoctors = [];
let filteredDoctors = [];
let currentEditId = null;
let openBioId = null; // track which bio is open

console.log("✓ doctor.js file loading...");

// ==================== UTILITIES (Must be first!) ====================
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

// ==================== BIO TOGGLE ====================
function toggleBio(id) {
  openBioId = openBioId === id ? null : id;
  displayDoctors();
}

// ==================== LOAD DATA ====================
async function loadDoctors(page = 1) {
  try {
    currentPage = page;
    console.log("► Fetching doctors page:", page);

    const response = await fetch(
      `../../api/admin/doctors.php?page=${page}&limit=10`,
      {
        credentials: "include",
      },
    );

    console.log("✓ API Response:", response.status);
    const result = await response.json();
    console.log("✓ Data received:", result);

    if (result && result.status === "success") {
      allDoctors = result.data || [];
      filteredDoctors = result.data || [];

      const totalPagesEl = document.getElementById("total-pages");
      if (totalPagesEl) {
        totalPagesEl.textContent = result.pages || 1;
      }

      displayDoctors();
    } else {
      console.warn("⚠ API returned error");
      showToast("Error loading doctors");
    }
  } catch (error) {
    console.error("✗ Fetch error:", error);
    showToast("Error loading doctors: " + error.message);
  }
}

// ==================== DISPLAY DATA ====================
function displayDoctors() {
  try {
    console.log("► Displaying", filteredDoctors.length, "doctors");

    const tbody = document.getElementById("doctors-table-body");
    if (!tbody) {
      console.warn("⚠ Table tbody not found!");
      return;
    }

    if (!filteredDoctors || filteredDoctors.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center py-8 text-gray-500">No doctors found</td></tr>';
      return;
    }

    let html = "";
    for (const doc of filteredDoctors) {
      const fullName = (doc.full_name || "").replace(/'/g, "\\'");
      const email = (doc.email || "").replace(/'/g, "\\'");
      const docId = doc.user_id;
      const isOpen = openBioId === docId;

      // Use bio from API if available, otherwise use a default
      const bio = doc.bio
        ? doc.bio
        : `${doc.full_name || "This doctor"} is a qualified ${doc.specialization || "specialist"} registered on our healthcare platform. Full bio will be available once the doctor updates their profile.`;

      html += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-5 py-4 text-sm font-semibold">
                        <button
                            onclick="toggleBio('${docId}')"
                            style="font-family:inherit; font-size:inherit; font-weight:inherit;"
                            class="flex items-center gap-1.5 text-left text-gray-800 hover:text-teal-700 bg-transparent border-none p-0 cursor-pointer"
                        >
                            ${fullName}
                            <svg
                                style="transition:transform 0.2s ease; transform:${isOpen ? "rotate(180deg)" : "rotate(0deg)"}; flex-shrink:0;"
                                width="14" height="14" viewBox="0 0 24 24"
                                fill="none" stroke="#0d7377" stroke-width="2.5"
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                     </td>
                    <td class="px-5 py-4 text-sm">${doc.specialization || "N/A"}</td>
                    <td class="px-5 py-4 text-sm hidden md:table-cell">${email}</td>
                    <td class="px-5 py-4 text-sm">${doc.total_appointments || 0}</td>
                    <td class="px-5 py-4">
                        <div class="flex gap-2">
                            <button onclick="openEditModal('${docId}', '${fullName}', '${email}', '${(doc.bio || "").replace(/'/g, "\\'")}')" class="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-semibold">Edit</button>
                            <button onclick="deleteDoctor('${docId}')" class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold">Delete</button>
                        </div>
                     </td>
                 </tr>
            `;

      // Bio dropdown row — only shown when this doctor is open
      if (isOpen) {
        html += `
                 <tr>
                    <td colspan="5" style="padding:0;">
                        <div style="border-left:3px solid #0d7377; background:#e8f5f5;" class="flex items-start gap-4 px-6 py-4">
                            <div class="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0" style="background:#c5e8e8;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d7377" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div>
                                <p style="margin:0 0 4px; font-weight:600; color:#0a5a5d; font-size:14px;">
                                    ${doc.full_name || ""} &mdash; ${doc.specialization || ""}
                                </p>
                                <p style="margin:0; font-size:13px; color:#374151; line-height:1.7;">
                                    ${bio}
                                </p>
                            </div>
                        </div>
                     </td>
                 </tr>
                `;
      }
    }

    tbody.innerHTML = html;
    console.log("✓ Table updated");
  } catch (e) {
    console.error("✗ Display error:", e);
  }
}

// ==================== FILTER ====================
function filterDoctors() {
  const searchText = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  filteredDoctors = allDoctors.filter((doc) => {
    return (
      (doc.full_name || "").toLowerCase().includes(searchText) ||
      (doc.email || "").toLowerCase().includes(searchText) ||
      (doc.specialization &&
        doc.specialization.toLowerCase().includes(searchText))
    );
  });
  displayDoctors();
}

// ==================== EDIT MODAL ====================
function openEditModal(doctorId, name, email, bio = "") {
  try {
    console.log("► Opening edit for:", doctorId);
    currentEditId = doctorId;

    const editName = document.getElementById("editName");
    const editEmail = document.getElementById("editEmail");
    const editBio = document.getElementById("editBio");

    if (editName) editName.value = name;
    if (editEmail) editEmail.value = email;
    if (editBio) editBio.value = bio;

    const modal = document.getElementById("editModal");
    if (modal) modal.classList.add("active");
  } catch (e) {
    console.error("✗ Modal error:", e);
  }
}

function closeEditModal() {
  try {
    document.getElementById("editModal").classList.remove("active");
    currentEditId = null;
  } catch (e) {
    console.error("✗ Close modal error:", e);
  }
}

// ==================== FORM HANDLER ====================
function handleFormSubmit(e) {
  console.log(">>> FORM SUBMITTED");
  e.preventDefault();
  saveDoctor(e);
}

// ==================== SAVE ====================
async function saveDoctor(event) {
  event.preventDefault();
  console.log("═══ SAVE START ═══");
  console.log("ID:", currentEditId);

  const name = (document.getElementById("editName")?.value || "").trim();
  const email = (document.getElementById("editEmail")?.value || "").trim();
  const bio = (document.getElementById("editBio")?.value || "").trim();

  console.log("Data:", { name, email, bio });

  if (!currentEditId || !name || !email) {
    console.warn("⚠ Validation failed");
    showToast("Please fill in all fields");
    return;
  }

  try {
    console.log("► Sending to API...");

    const payload = {
      doctor_id: currentEditId,
      full_name: name,
      email: email,
      bio: bio,
    };

    const response = await fetch("../../api/admin/doctors.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log("✓ Response:", response.status);
    const result = await response.json();
    console.log("✓ Result:", result);

    if (result.status === "success") {
      console.log("✓✓✓ SUCCESS ✓✓✓");
      showToast("Doctor updated!");
      closeEditModal();
      loadDoctors(currentPage);
    } else {
      console.warn("✗ API error:", result.message);
      showToast(result.message || "Error saving");
    }
  } catch (error) {
    console.error("✗ Exception:", error);
    showToast("Error: " + error.message);
  }
  console.log("═══ SAVE END ═══");
}

// ==================== DELETE ====================
async function deleteDoctor(doctorId) {
  if (!confirm("Delete this doctor?")) return;

  try {
    const response = await fetch("../../api/admin/doctors.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ doctor_id: doctorId }),
    });

    const result = await response.json();
    if (result.status === "success") {
      showToast("Doctor deleted!");
      loadDoctors(currentPage);
    } else {
      showToast("Error deleting doctor");
    }
  } catch (error) {
    showToast("Error: " + error.message);
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
    loadDoctors(currentPage);
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    document.getElementById("current-page").textContent = currentPage;
    loadDoctors(currentPage);
  }
}

// ==================== PAGE INIT ====================
document.addEventListener("DOMContentLoaded", initPage);

function initPage() {
  try {
    console.log("╔═══════════════════════════════════╗");
    console.log("║   DOCTORS PAGE INITIALIZATION     ║");
    console.log("╚═══════════════════════════════════╝");

    updateCurrentDate();
    loadDoctors();

    const editForm = document.getElementById("editForm");
    if (editForm) {
      editForm.addEventListener("submit", handleFormSubmit);
      console.log("✓ Form listener attached");
    } else {
      console.warn("⚠ editForm not found");
    }

    console.log("✓ Page ready");
  } catch (err) {
    console.error("✗ INIT ERROR:", err);
    showToast("Page load error: " + err.message);
  }
}
