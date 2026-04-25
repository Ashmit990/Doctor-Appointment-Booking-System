let profileForm;
let resetBtn;
let editProfileBtn;
let viewMode;
let editMode;

let patientProfile = {};

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

  // Auto-calculate DOB from age input
  const ageInput = document.getElementById("editAge");
  if (ageInput) {
    ageInput.addEventListener("input", () => {
      const age = parseInt(ageInput.value.trim(), 10);
      const dobField = document.getElementById("editDob");
      if (dobField && !isNaN(age) && age >= 0 && age <= 150) {
        const birthYear = new Date().getFullYear() - age;
        dobField.value = `${birthYear}-01-01`;
      } else if (dobField) {
        dobField.value = "";
      }
    });
  }
  
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
  console.log("Filling edit form with profile data:", patientProfile);
  setEditFieldValue("editName", patientProfile.full_name);
  setEditFieldValue("editEmail", patientProfile.email);
  setEditFieldValue("editPhone", patientProfile.contact_number);
  setEditFieldValue("editAge", patientProfile.age);
  setEditFieldValue("editGender", patientProfile.gender);
  setEditFieldValue("editBlood", patientProfile.blood_group);
  setEditFieldValue("editAddress", patientProfile.address);
  setEditFieldValue("editEmergencyName", patientProfile.emergency_contact_name);
  setEditFieldValue("editEmergencyPhone", patientProfile.emergency_contact_phone);

  // Auto-set DOB from existing profile dob or calculate from age
  const dobField = document.getElementById("editDob");
  if (dobField) {
    if (patientProfile.dob) {
      dobField.value = String(patientProfile.dob).slice(0, 10);
    } else if (patientProfile.age) {
      const birthYear = new Date().getFullYear() - parseInt(patientProfile.age, 10);
      dobField.value = `${birthYear}-01-01`;
    } else {
      dobField.value = "";
    }
  }

  // Hide "Select gender" placeholder once a gender is already chosen
  const genderSelect = document.getElementById("editGender");
  if (genderSelect) {
    const placeholderOpt = genderSelect.querySelector('option[value=""]');
    const syncGenderPlaceholder = () => {
      if (placeholderOpt) {
        placeholderOpt.hidden = genderSelect.value !== "";
      }
    };
    syncGenderPlaceholder();
    // Avoid duplicate listeners on repeated fillEditForm calls
    genderSelect.removeEventListener("change", genderSelect._syncPlaceholder);
    genderSelect._syncPlaceholder = syncGenderPlaceholder;
    genderSelect.addEventListener("change", genderSelect._syncPlaceholder);
  }

  // Hide "Select blood group" placeholder once a blood group is already chosen
  const bloodSelect = document.getElementById("editBlood");
  if (bloodSelect) {
    const bloodPlaceholderOpt = bloodSelect.querySelector('option[value=""]');
    const syncBloodPlaceholder = () => {
      if (bloodPlaceholderOpt) {
        bloodPlaceholderOpt.hidden = bloodSelect.value !== "";
      }
    };
    syncBloodPlaceholder();
    // Avoid duplicate listeners on repeated fillEditForm calls
    bloodSelect.removeEventListener("change", bloodSelect._syncPlaceholder);
    bloodSelect._syncPlaceholder = syncBloodPlaceholder;
    bloodSelect.addEventListener("change", bloodSelect._syncPlaceholder);
  }
}

function calculateProfileCompletion() {
  // Keep completion aligned with required fields shown in the profile form.
  const fields = [
    patientProfile.full_name,
    patientProfile.email,
    patientProfile.contact_number,
    patientProfile.age,
    patientProfile.gender,
    patientProfile.blood_group,
    patientProfile.address,
    patientProfile.emergency_contact_name,
    patientProfile.emergency_contact_phone
  ];
  const total = fields.length;
  const filled = fields.filter(f => f !== null && f !== undefined && String(f).trim() !== "").length;
  const percent = Math.round((filled / total) * 100);
  return { filled, total, percent };
}

function updateViewMode() {
  const name = patientProfile.full_name || "Patient";
  const email = patientProfile.email || "-";
  
  console.log("Updating view mode with:", { name, email });
  
  // Update sidebar profile card
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = email;
  document.getElementById("sidebarPhone").textContent = patientProfile.contact_number || "-";
  document.getElementById("sidebarGender").textContent = patientProfile.gender || "-";
  document.getElementById("sidebarBlood").textContent = patientProfile.blood_group || "-";
  
  // Update user initials
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const initialElem = document.getElementById("userInitialsLarge");
  if (initialElem) initialElem.textContent = initials || "P";
  
  // Update view mode content
  document.getElementById("viewName").textContent = patientProfile.full_name || "-";
  document.getElementById("viewEmail").textContent = patientProfile.email || "-";
  document.getElementById("viewPhone").textContent = patientProfile.contact_number || "-";
  document.getElementById("viewAge").textContent = patientProfile.age || "-";
  document.getElementById("viewGender").textContent = patientProfile.gender || "-";
  document.getElementById("viewBlood").textContent = patientProfile.blood_group || "-";
  document.getElementById("viewAddress").textContent = patientProfile.address || "-";
  document.getElementById("viewEmergencyName").textContent = patientProfile.emergency_contact_name || "-";
  document.getElementById("viewEmergencyPhone").textContent = patientProfile.emergency_contact_phone || "-";

  // Update profile completion stats dynamically
  const { filled, total, percent } = calculateProfileCompletion();
  const completionEl = document.getElementById("profileCompletion");
  const verifiedEl = document.getElementById("verifiedFields");
  const accountVerifiedEl = document.getElementById("accountVerifiedFields");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  const accountLastUpdatedEl = document.getElementById("accountLastUpdated");

  if (completionEl) completionEl.textContent = percent + "%";
  if (verifiedEl) verifiedEl.textContent = filled + "/" + total;
  if (accountVerifiedEl) accountVerifiedEl.textContent = filled + "/" + total;

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (lastUpdatedEl) lastUpdatedEl.textContent = today;
  if (accountLastUpdatedEl) accountLastUpdatedEl.textContent = today;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  if (!phone) return false;
  const phoneDigits = phone.replace(/[\s\(\)\+-]/g, "");
  return phoneDigits.length === 10 && /^\d+$/.test(phoneDigits);
}

function clearValidationErrors() {
  const errorIds = ["nameError", "emailError", "phoneError", "ageError", "genderError", "bloodError", "addressError", "emergencyNameError", "emergencyPhoneError"];
  errorIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const inputIds = ["editName", "editEmail", "editPhone", "editAge", "editGender", "editBlood", "editAddress", "editEmergencyName", "editEmergencyPhone"];
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
    setFieldError("editPhone", "phoneError", "Phone number must be exactly 10 digits", true);
    isValid = false;
  }

  // Validate Age
  const age = getEditFieldValue("editAge");
  console.log("Age validation - age value:", age, "type:", typeof age);
  if (!age || age.trim() === "") {
    setFieldError("editAge", "ageError", "Age is required", true);
    isValid = false;
  } else {
    const ageNum = parseInt(age, 10);
    console.log("Age parsed to number:", ageNum);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setFieldError("editAge", "ageError", "Age must be between 0 and 150", true);
      isValid = false;
    } else {
      // Clear age error if validation passes
      const ageErrorEl = document.getElementById("ageError");
      if (ageErrorEl) ageErrorEl.classList.add("hidden");
      const ageInputEl = document.getElementById("editAge");
      if (ageInputEl) {
        ageInputEl.classList.remove("border-red-500", "ring-red-100");
        ageInputEl.classList.add("border-gray-300");
      }
    }
  }

  // Validate Gender
  const gender = getEditFieldValue("editGender");
  if (!gender) {
    setFieldError("editGender", "genderError", "Gender is required", true);
    isValid = false;
  }

  // Validate Blood Group
  const blood = getEditFieldValue("editBlood");
  if (!blood) {
    setFieldError("editBlood", "bloodError", "Blood group is required", true);
    isValid = false;
  }

  // Validate Address
  const address = getEditFieldValue("editAddress");
  if (!address) {
    setFieldError("editAddress", "addressError", "Address is required", true);
    isValid = false;
  }

  // Validate Emergency Contact Name
  const emergencyName = getEditFieldValue("editEmergencyName");
  if (!emergencyName) {
    setFieldError("editEmergencyName", "emergencyNameError", "Emergency contact name is required", true);
    isValid = false;
  }

  // Validate Emergency Contact Phone
  const emergencyPhone = getEditFieldValue("editEmergencyPhone");
  if (!emergencyPhone) {
    setFieldError("editEmergencyPhone", "emergencyPhoneError", "Emergency contact phone is required", true);
    isValid = false;
  } else if (!isValidPhone(emergencyPhone)) {
    setFieldError("editEmergencyPhone", "emergencyPhoneError", "Emergency phone must be exactly 10 digits", true);
    isValid = false;
  }

  return isValid;
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
      try {
        const errorResult = await response.json();
        console.error("API Error Details:", errorResult.message || errorResult);
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
      }
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
    console.log("Profile data loaded:", patientProfile);
    
    // Ensure age is properly set
    if (!patientProfile.age || patientProfile.age === null) {
      console.warn("Age is not set in profile, checking if we need to update it");
    }
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

  const ageVal = getEditFieldValue("editAge");
  const dobVal = getEditFieldValue("editDob");
  const payload = {
    full_name: getEditFieldValue("editName"),
    email: getEditFieldValue("editEmail"),
    contact_number: getEditFieldValue("editPhone") || null,
    age: ageVal !== "" ? parseInt(ageVal) : null,
    dob: dobVal !== "" ? dobVal : null,
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
    
    // Log response details for debugging
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    const responseText = await response.text();
    console.log("Response text:", responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Response was:", responseText);
      throw new Error(`API returned invalid JSON: ${responseText.substring(0, 100)}`);
    }
    
    if (result.status !== "success") {
      // Display API errors in field-specific error boxes instead of alert
      displayApiErrors(result.message || "Save failed");
      return;
    }

    await loadProfile();
    toggleEditMode(false);
    showSuccessToast();
  } catch (error) {
    console.error("Error saving profile:", error);
    // Display error in a field-specific error box instead of alert
    displayApiErrors("Failed to save profile. Please try again.");
  }
}

function displayApiErrors(errorMessage) {
  clearValidationErrors();
  
  // Parse the error message and map to appropriate fields
  const errorMap = {
    'full name': { inputId: 'editName', errorId: 'nameError' },
    'email': { inputId: 'editEmail', errorId: 'emailError' },
    'phone': { inputId: 'editPhone', errorId: 'phoneError' },
    'age': { inputId: 'editAge', errorId: 'ageError' },
    'gender': { inputId: 'editGender', errorId: 'genderError' },
    'blood': { inputId: 'editBlood', errorId: 'bloodError' },
    'address': { inputId: 'editAddress', errorId: 'addressError' },
    'emergency contact name': { inputId: 'editEmergencyName', errorId: 'emergencyNameError' },
    'emergency contact phone': { inputId: 'editEmergencyPhone', errorId: 'emergencyPhoneError' }
  };
  
  let errorShown = false;
  
  // Check if specific field error matches
  for (const [keyword, fields] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(keyword.toLowerCase())) {
      setFieldError(fields.inputId, fields.errorId, errorMessage, true);
      errorShown = true;
      break;
    }
  }
  
  // If no specific field matched, show error in the first field (name)
  if (!errorShown) {
    setFieldError('editName', 'nameError', errorMessage, true);
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
  
  // Initialize Lucide icons early
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
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
  
  // Re-initialize icons after content loads
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  console.log("Profile initialization complete");
})();
