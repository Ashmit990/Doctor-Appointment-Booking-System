let profileForm;
let resetBtn;
let editProfileBtn;
let cancelEditBtn;
let viewMode;
let editMode;

let patientProfile = {};

function initializeElements() {
  profileForm = document.getElementById("profileForm");
  resetBtn = document.getElementById("resetBtn");
  editProfileBtn = document.getElementById("editProfileBtn");
  cancelEditBtn = document.getElementById("cancelEditBtn");
  viewMode = document.getElementById("viewMode");
  editMode = document.getElementById("editMode");
  
  console.log("Elements initialized:", {
    profileForm: !!profileForm,
    resetBtn: !!resetBtn,
    editProfileBtn: !!editProfileBtn,
    cancelEditBtn: !!cancelEditBtn,
    viewMode: !!viewMode,
    editMode: !!editMode
  });
}

function attachEventListeners() {
  if (!editProfileBtn) {
    console.error("editProfileBtn not found");
    return;
  }
  if (!cancelEditBtn) {
    console.error("cancelEditBtn not found");
    return;
  }
  if (!profileForm) {
    console.error("profileForm not found");
    return;
  }
  if (!resetBtn) {
    console.error("resetBtn not found");
    return;
  }
  
  editProfileBtn.addEventListener("click", () => toggleEditMode(true));
  cancelEditBtn.addEventListener("click", () => toggleEditMode(false));
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfile();
  });
  resetBtn.addEventListener("click", () => {
    fillEditForm();
  });
  
  console.log("Event listeners attached successfully");
}

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function logoutPatient() {
  window.location.href = "../../api/auth/logout.php";
}

function setEditFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value ?? "";
}

function getEditFieldValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function toggleEditMode(isEdit) {
  if (isEdit) {
    viewMode.classList.add("hidden");
    editMode.classList.remove("hidden");
    editProfileBtn.classList.add("hidden");
    cancelEditBtn.classList.remove("hidden");
    fillEditForm();
  } else {
    viewMode.classList.remove("hidden");
    editMode.classList.add("hidden");
    editProfileBtn.classList.remove("hidden");
    cancelEditBtn.classList.add("hidden");
  }
}

function fillEditForm() {
  setEditFieldValue("editName", patientProfile.full_name);
  setEditFieldValue("editEmail", patientProfile.email);
  setEditFieldValue("editPhone", patientProfile.contact_number);
  setEditFieldValue("editDob", patientProfile.dob ? String(patientProfile.dob).slice(0, 10) : "");
  setEditFieldValue("editAge", patientProfile.age);
  setEditFieldValue("editGender", patientProfile.gender);
  setEditFieldValue("editBlood", patientProfile.blood_group);
  setEditFieldValue("editAddress", patientProfile.address);
  setEditFieldValue("editEmergencyName", patientProfile.emergency_contact_name);
  setEditFieldValue("editEmergencyPhone", patientProfile.emergency_contact_phone);
}

function updateViewMode() {
  const name = patientProfile.full_name || "Patient";
  const email = patientProfile.email || "-";
  
  console.log("Updating view mode with:", { name, email });
  
  document.getElementById("patientNameDisplay").textContent = name;
  document.getElementById("emailDisplay").textContent = email;
  
  document.getElementById("viewName").textContent = patientProfile.full_name || "-";
  document.getElementById("viewEmail").textContent = patientProfile.email || "-";
  document.getElementById("viewPhone").textContent = patientProfile.contact_number || "-";
  document.getElementById("viewDob").textContent = patientProfile.dob || "-";
  document.getElementById("viewAge").textContent = patientProfile.age || "-";
  document.getElementById("viewGender").textContent = patientProfile.gender || "-";
  document.getElementById("viewBlood").textContent = patientProfile.blood_group || "-";
  document.getElementById("viewAddress").textContent = patientProfile.address || "-";
  document.getElementById("viewEmergencyName").textContent = patientProfile.emergency_contact_name || "-";
  document.getElementById("viewEmergencyPhone").textContent = patientProfile.emergency_contact_phone || "-";
}

function validateForm() {
  const errors = {};
  const name = getEditFieldValue("editName");
  const email = getEditFieldValue("editEmail");

  if (!name) {
    errors.name = true;
    document.getElementById("nameError").classList.remove("hidden");
  } else {
    document.getElementById("nameError").classList.add("hidden");
  }

  if (!email) {
    errors.email = true;
    document.getElementById("emailError").classList.remove("hidden");
  } else {
    document.getElementById("emailError").classList.add("hidden");
  }

  return Object.keys(errors).length === 0;
}

function loadMockProfile() {
  console.warn("Loading mock profile for testing...");
  patientProfile = {
    full_name: "John Doe",
    email: "john.doe@example.com",
    contact_number: "+1 (555) 123-4567",
    dob: "1990-05-15",
    age: 34,
    gender: "Male",
    blood_group: "O+",
    address: "123 Main Street, Springfield, IL 62701",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+1 (555) 123-4568"
  };
  updateViewMode();
  document.getElementById("current-date").textContent = new Date().toDateString();
}

async function loadProfile() {
  try {
    console.log("Loading profile from:", `${API_BASE}/patient/profile.php`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE}/patient/profile.php`, {
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      console.warn("Response not OK:", response.statusText);
      loadMockProfile();
      return;
    }
    
    const result = await response.json();
    console.log("Response data:", result);
    
    if (result.status !== "success") {
      console.warn("API Error:", result.message);
      loadMockProfile();
      return;
    }
    
    if (!result.data) {
      console.warn("No data in response");
      loadMockProfile();
      return;
    }
    
    patientProfile = result.data;
    updateViewMode();
    document.getElementById("current-date").textContent = new Date().toDateString();
    console.log("Profile loaded successfully:", patientProfile);
  } catch (error) {
    console.error("Error loading profile:", error);
    console.warn("Falling back to mock data...");
    loadMockProfile();
  }
}

async function saveProfile() {
  if (!validateForm()) {
    return;
  }

  const payload = {
    full_name: getEditFieldValue("editName"),
    email: getEditFieldValue("editEmail"),
    contact_number: getEditFieldValue("editPhone") || null,
    dob: getEditFieldValue("editDob") || null,
    age: getEditFieldValue("editAge") ? parseInt(getEditFieldValue("editAge")) : null,
    gender: getEditFieldValue("editGender") || null,
    blood_group: getEditFieldValue("editBlood") || null,
    address: getEditFieldValue("editAddress") || null,
    emergency_contact_name: getEditFieldValue("editEmergencyName") || null,
    emergency_contact_phone: getEditFieldValue("editEmergencyPhone") || null,
  };

  try {
    const response = await fetch(`${API_BASE}/patient/profile.php`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    
    if (result.status !== "success") {
      alert(result.message || "Save failed");
      return;
    }

    await loadProfile();
    toggleEditMode(false);
    showSuccessToast();
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Failed to save profile");
  }
}

function showSuccessToast() {
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 toast-message";
  toast.textContent = "Profile updated successfully!";
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize
(async function initProfile() {
  console.log("Initializing patient profile page...");
  console.log("API_BASE:", API_BASE);
  
  // Initialize DOM elements
  initializeElements();
  
  // Attach event listeners
  attachEventListeners();
  
  const ok = await requirePatientSession();
  if (!ok) {
    console.log("Session check failed");
    return;
  }
  
  console.log("Session verified, loading profile...");
  await loadProfile();
  lucide.createIcons();
  console.log("Profile initialization complete");
})();
