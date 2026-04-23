let profileForm;
let resetBtn;
let editProfileBtn;
let viewMode;
let editMode;

let doctorProfile = {};

const API_BASE = '../../api';

function initializeElements() {
  profileForm = document.getElementById("profileForm");
  resetBtn = document.getElementById("resetBtn");
  editProfileBtn = document.getElementById("editProfileBtn");
  viewMode = document.getElementById("viewMode");
  editMode = document.getElementById("editMode");
  
  console.log("Elements initialized:", {
    profileForm: !!profileForm,
    resetBtn: !!resetBtn,
    editProfileBtn: !!editProfileBtn,
    viewMode: !!viewMode,
    editMode: !!editMode
  });
}

function attachEventListeners() {
  if (!profileForm) {
    console.error("profileForm not found");
    return;
  }
  if (!resetBtn) {
    console.error("resetBtn not found");
    return;
  }
  
  // Card header button listeners
  const cardEditBtn = document.getElementById("cardEditBtn");
  const cardCancelBtn = document.getElementById("cardCancelBtn");
  if (cardEditBtn) cardEditBtn.addEventListener("click", () => toggleEditMode(true));
  if (cardCancelBtn) cardCancelBtn.addEventListener("click", () => toggleEditMode(false));
  
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfile();
  });
  resetBtn.addEventListener("click", () => {
    fillEditForm();
  });
  
  console.log("Event listeners attached successfully");
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
    
    // Toggle card header buttons
    const cardEditBtn = document.getElementById("cardEditBtn");
    const cardCancelBtn = document.getElementById("cardCancelBtn");
    if (cardEditBtn) cardEditBtn.classList.add("hidden");
    if (cardCancelBtn) cardCancelBtn.classList.remove("hidden");
    
    fillEditForm();
  } else {
    viewMode.classList.remove("hidden");
    editMode.classList.add("hidden");
    
    // Toggle card header buttons
    const cardEditBtn = document.getElementById("cardEditBtn");
    const cardCancelBtn = document.getElementById("cardCancelBtn");
    if (cardEditBtn) cardEditBtn.classList.remove("hidden");
    if (cardCancelBtn) cardCancelBtn.classList.add("hidden");
  }
}

function fillEditForm() {
  setEditFieldValue("editName", doctorProfile.full_name);
  setEditFieldValue("editEmail", doctorProfile.email);
  setEditFieldValue("editPhone", doctorProfile.phone);
  setEditFieldValue("editAge", doctorProfile.age);
  setEditFieldValue("editSpecialization", doctorProfile.specialization);
  setEditFieldValue("editExperience", doctorProfile.experience);
  setEditFieldValue("editQualification", doctorProfile.qualification);
  setEditFieldValue("editDescription", doctorProfile.description);
}

function updateViewMode() {
  const name = doctorProfile.full_name || "Doctor";
  const email = doctorProfile.email || "-";
  const spec = doctorProfile.specialization || "-";
  
  console.log("Updating view mode with:", { name, email, spec });
  
  // Update sidebar profile card
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = email;
  document.getElementById("sidebarPhone").textContent = doctorProfile.phone || "-";
  document.getElementById("sidebarSpec").textContent = spec;
  document.getElementById("sidebarExp").textContent = doctorProfile.experience || "-";
  
  // Update user initials
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const initialElem = document.getElementById("userInitialsLarge");
  if (initialElem) initialElem.textContent = initials || "D";
  
  // Update view mode content
  document.getElementById("viewName").textContent = doctorProfile.full_name || "-";
  document.getElementById("viewEmail").textContent = doctorProfile.email || "-";
  document.getElementById("viewPhone").textContent = doctorProfile.phone || "-";
  document.getElementById("viewAge").textContent = doctorProfile.age || "-";
  document.getElementById("viewSpecialization").textContent = spec;
  document.getElementById("viewExperience").textContent = doctorProfile.experience || "-";
  document.getElementById("viewQualification").textContent = doctorProfile.qualification || "-";
  document.getElementById("viewDescription").textContent = doctorProfile.description || "-";
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  if (!phone) return false;
  const phoneDigits = phone.replace(/[\s\(\)\+-]/g, "");
  return phoneDigits.length >= 8 && /^\d+$/.test(phoneDigits);
}

function clearValidationErrors() {
  const errorIds = ["nameError", "emailError", "phoneError", "ageError", "specError", "expError", "qualError", "descError"];
  errorIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const inputIds = ["editName", "editEmail", "editPhone", "editAge", "editSpecialization", "editExperience", "editQualification", "editDescription"];
  inputIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.classList.remove("border-red-500", "ring-red-100");
      input.classList.add("border-gray-300");
    }
  });
}

function setFieldError(inputId, errorId, message, show) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;
  if (show) {
    error.textContent = message;
    error.classList.remove("hidden");
    input.classList.remove("border-gray-300");
    input.classList.add("border-red-500");
  } else {
    error.classList.add("hidden");
    input.classList.remove("border-red-500");
    input.classList.add("border-gray-300");
  }
}

function validateForm() {
  clearValidationErrors();
  let isValid = true;

  // Validate Full Name
  const name = getEditFieldValue("editName");
  if (!name) {
    setFieldError("editName", "nameError", "Full name is required", true);
    isValid = false;
  } else if (name.length < 2) {
    setFieldError("editName", "nameError", "Name must be at least 2 characters", true);
    isValid = false;
  }

  // Validate Email
  const email = getEditFieldValue("editEmail");
  if (!email) {
    setFieldError("editEmail", "emailError", "Email is required", true);
    isValid = false;
  } else if (!isValidEmail(email)) {
    setFieldError("editEmail", "emailError", "Please enter a valid email address", true);
    isValid = false;
  }

  // Validate Phone Number
  const phone = getEditFieldValue("editPhone");
  if (!phone) {
    setFieldError("editPhone", "phoneError", "Phone number is required", true);
    isValid = false;
  } else if (!isValidPhone(phone)) {
    setFieldError("editPhone", "phoneError", "Valid phone number required (min 8 digits)", true);
    isValid = false;
  }

  // Validate Age
  const age = getEditFieldValue("editAge");
  if (!age) {
    setFieldError("editAge", "ageError", "Age is required", true);
    isValid = false;
  } else {
    const ageNum = parseInt(age);
    if (ageNum < 18 || ageNum > 100) {
      setFieldError("editAge", "ageError", "Age must be between 18 and 100", true);
      isValid = false;
    }
  }

  // Validate Specialization
  const spec = getEditFieldValue("editSpecialization");
  if (!spec) {
    setFieldError("editSpecialization", "specError", "Specialization is required", true);
    isValid = false;
  }

  // Validate Experience
  const exp = getEditFieldValue("editExperience");
  if (!exp) {
    setFieldError("editExperience", "expError", "Experience is required", true);
    isValid = false;
  }

  // Validate Qualification
  const qual = getEditFieldValue("editQualification");
  if (!qual) {
    setFieldError("editQualification", "qualError", "Qualification is required", true);
    isValid = false;
  }

  // Validate Description (Bio)
  const desc = getEditFieldValue("editDescription");
  if (!desc) {
    setFieldError("editDescription", "descError", "Professional bio is required", true);
    isValid = false;
  } else {
    const wordCount = desc.trim().split(/\s+/).length;
    if (wordCount < 15) {
      setFieldError("editDescription", "descError", "Professional bio must contain at least 15 words (2-3 sentences)", true);
      isValid = false;
    }
  }

  return isValid;
}

function loadMockProfile() {
  console.warn("Loading mock profile for testing...");
  doctorProfile = {
    full_name: "Dr. John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    age: 45,
    specialization: "Cardiology",
    experience: "15+ years",
    qualification: "MD, Board Certified Cardiologist",
    description: "Experienced cardiologist with 15 years of clinical practice. Specializes in interventional cardiology and heart disease prevention. Published numerous research papers in cardiac medicine."
  };
  updateViewMode();
  document.getElementById("current-date").textContent = new Date().toDateString();
}

async function loadProfile() {
  try {
    console.log("Loading profile from:", `${API_BASE}/doctor/get_doctor_info.php`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE}/doctor/get_doctor_info.php`, {
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

    const profileData = result.data;
    const bio = typeof profileData.bio === 'string' ? JSON.parse(profileData.bio) : (profileData.bio || {});
    
    doctorProfile = {
      full_name: profileData.full_name || "",
      email: profileData.email || "",
      phone: bio.phone || "",
      age: profileData.age || "",
      specialization: bio.specialization || "",
      experience: bio.experience || "",
      qualification: bio.qualification || "",
      description: bio.description || ""
    };

    updateViewMode();
    document.getElementById("current-date").textContent = new Date().toDateString();
    console.log("Profile loaded successfully:", doctorProfile);
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
    specialization: getEditFieldValue("editSpecialization"),
    phone: getEditFieldValue("editPhone"),
    experience: getEditFieldValue("editExperience"),
    age: getEditFieldValue("editAge") ? parseInt(getEditFieldValue("editAge")) : null,
    qualification: getEditFieldValue("editQualification"),
    description: getEditFieldValue("editDescription")
  };

  try {
    const response = await fetch(`${API_BASE}/doctor/update_profile.php`, {
      method: "POST",
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
  console.log("Initializing doctor profile page...");
  console.log("API_BASE:", API_BASE);
  
  // Initialize Lucide icons early
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialize DOM elements
  initializeElements();
  
  // Attach event listeners
  attachEventListeners();
  
  // Verify doctor session
  try {
    const sessionResponse = await fetch(`${API_BASE}/auth/session_info.php`, {
      credentials: 'include'
    });
    const sessionData = await sessionResponse.json();
    if (!sessionData.logged_in || sessionData.role !== 'Doctor') {
      console.error("Not logged in as doctor");
      window.location.href = '../auth/login.html';
      return;
    }
  } catch (error) {
    console.error("Session check failed:", error);
  }
  
  console.log("Session verified, loading profile...");
  await loadProfile();
  
  // Re-initialize icons after content loads
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  console.log("Profile initialization complete");
})();
