const defaultProfile = {
  fullName: "Sirjeet Dahal",
  email: "sirjeet@example.com",
  phone: "9800000000",
  dob: "2004-01-01",
  gender: "Male",
  bloodGroup: "O+",
  address: "Kathmandu, Nepal",
  emergencyName: "Family Contact",
  emergencyPhone: "9811111111",
  lastUpdated: "Today",
};

const profileForm = document.getElementById("profileForm");
const resetProfileButton = document.getElementById("resetProfile");
const searchInput = document.getElementById("profileSearch");

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function getStoredProfile() {
  const savedProfile = localStorage.getItem("patientProfileData");
  return savedProfile ? JSON.parse(savedProfile) : defaultProfile;
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value || "";
}

function getFieldValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function loadProfile() {
  const profile = getStoredProfile();

  setFieldValue("fullName", profile.fullName);
  setFieldValue("email", profile.email);
  setFieldValue("phone", profile.phone);
  setFieldValue("dob", profile.dob);
  setFieldValue("gender", profile.gender);
  setFieldValue("bloodGroup", profile.bloodGroup);
  setFieldValue("address", profile.address);
  setFieldValue("emergencyName", profile.emergencyName);
  setFieldValue("emergencyPhone", profile.emergencyPhone);

  updateSummary(profile);
}

function updateSummary(profile) {
  const fields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.dob,
    profile.gender,
    profile.bloodGroup,
    profile.address,
    profile.emergencyName,
    profile.emergencyPhone,
  ];

  const filledCount = fields.filter(
    (item) => item && item.trim() !== "",
  ).length;
  const completion = Math.round((filledCount / fields.length) * 100);
  const verified = [
    profile.email,
    profile.phone,
    profile.emergencyPhone,
  ].filter((item) => item && item.trim() !== "").length;

  document.getElementById("summaryName").textContent =
    profile.fullName || "Patient Name";
  document.getElementById("summaryEmail").textContent =
    profile.email || "No email added";
  document.getElementById("summaryPhone").textContent = profile.phone || "-";
  document.getElementById("summaryGender").textContent = profile.gender || "-";
  document.getElementById("summaryBlood").textContent =
    profile.bloodGroup || "-";

  document.getElementById("profileCompletion").textContent = `${completion}%`;
  document.getElementById("verifiedFields").textContent = verified;
  document.getElementById("filledFields").textContent = `${filledCount}/9`;

  document.getElementById("lastUpdatedHero").textContent =
    profile.lastUpdated || "Today";
  document.getElementById("lastUpdatedSide").textContent =
    profile.lastUpdated || "Today";

  const initial = profile.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : "P";
  document.getElementById("profileInitial").textContent = initial;
}

function showSuccessToast() {
  const toast = document.getElementById("successToast");
  const title = toast.querySelector(".toast-title");
  const text = toast.querySelector(".toast-text");

  if (title) title.textContent = "Success";
  if (text) text.textContent = "Profile updated successfully.";

  toast.classList.remove("hidden");
  toast.classList.add("flex");

  setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 2000);
}

function saveProfile() {
  const profile = {
    fullName: getFieldValue("fullName"),
    email: getFieldValue("email"),
    phone: getFieldValue("phone"),
    dob: getFieldValue("dob"),
    gender: getFieldValue("gender"),
    bloodGroup: getFieldValue("bloodGroup"),
    address: getFieldValue("address"),
    emergencyName: getFieldValue("emergencyName"),
    emergencyPhone: getFieldValue("emergencyPhone"),
    lastUpdated: "Today",
  };

  localStorage.setItem("patientProfileData", JSON.stringify(profile));
  updateSummary(profile);
  showSuccessToast();
}

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveProfile();
});

resetProfileButton.addEventListener("click", () => {
  loadProfile();
});

document.getElementById("profileDateLabel").textContent =
  new Date().toDateString();

const labelMap = [
  { id: "labelFullName", text: "full name" },
  { id: "labelEmail", text: "email" },
  { id: "labelPhone", text: "phone" },
  { id: "labelDob", text: "date of birth" },
  { id: "labelGender", text: "gender" },
  { id: "labelBlood", text: "blood group" },
  { id: "labelAddress", text: "address" },
  { id: "labelEmergencyName", text: "emergency contact name" },
  { id: "labelEmergencyPhone", text: "emergency contact phone" },
];

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase().trim();

  labelMap.forEach((item) => {
    const label = document.getElementById(item.id);
    if (!label) return;

    label.classList.remove("highlight-field");

    if (value && item.text.includes(value)) {
      label.classList.add("highlight-field");
      label.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});

loadProfile();
