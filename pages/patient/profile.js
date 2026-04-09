const profileForm = document.getElementById("profileForm");
const resetProfileButton = document.getElementById("resetProfile");
const searchInput = document.getElementById("profileSearch");

function goToHomePage() {
  window.location.href = "homepage.html";
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function setFieldValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value ?? "";
}

function getFieldValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function updateSummaryFromData(profile) {
  const fields = [
    profile.full_name,
    profile.email,
    profile.contact_number,
    profile.dob,
    profile.gender,
    profile.blood_group,
    profile.address,
    profile.emergency_contact_name,
    profile.emergency_contact_phone,
  ];

  const filledCount = fields.filter(
    (item) => item && String(item).trim() !== "",
  ).length;
  const completion = Math.round((filledCount / fields.length) * 100);
  const verified = [profile.email, profile.contact_number, profile.emergency_contact_phone].filter(
    (item) => item && String(item).trim() !== "",
  ).length;

  document.getElementById("summaryName").textContent =
    profile.full_name || "Patient Name";
  document.getElementById("summaryEmail").textContent =
    profile.email || "No email added";
  document.getElementById("summaryPhone").textContent =
    profile.contact_number || "-";
  document.getElementById("summaryGender").textContent = profile.gender || "-";
  document.getElementById("summaryBlood").textContent =
    profile.blood_group || "-";

  document.getElementById("profileCompletion").textContent = `${completion}%`;
  document.getElementById("verifiedFields").textContent = verified;
  document.getElementById("filledFields").textContent = `${filledCount}/9`;

  const lu = profile.last_updated || new Date().toLocaleDateString();
  document.getElementById("lastUpdatedHero").textContent = lu;
  document.getElementById("lastUpdatedSide").textContent = lu;

  const initial = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "P";
  document.getElementById("profileInitial").textContent = initial;
}

async function loadProfile() {
  const r = await fetch(`${API_BASE}/patient/profile.php`, {
    credentials: "include",
  });
  const j = await r.json();
  if (j.status !== "success" || !j.data) {
    console.error(j.message);
    return;
  }
  const p = j.data;
  setFieldValue("fullName", p.full_name);
  setFieldValue("email", p.email);
  setFieldValue("phone", p.contact_number);
  setFieldValue("dob", p.dob ? String(p.dob).slice(0, 10) : "");
  setFieldValue("gender", p.gender);
  setFieldValue("bloodGroup", p.blood_group);
  setFieldValue("address", p.address);
  setFieldValue("emergencyName", p.emergency_contact_name);
  setFieldValue("emergencyPhone", p.emergency_contact_phone);

  updateSummaryFromData({
    ...p,
    last_updated: new Date().toLocaleDateString(),
  });
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

async function saveProfile() {
  const payload = {
    full_name: getFieldValue("fullName"),
    email: getFieldValue("email"),
    contact_number: getFieldValue("phone"),
    dob: getFieldValue("dob") || null,
    gender: getFieldValue("gender") || null,
    blood_group: getFieldValue("bloodGroup") || null,
    address: getFieldValue("address") || null,
    emergency_contact_name: getFieldValue("emergencyName") || null,
    emergency_contact_phone: getFieldValue("emergencyPhone") || null,
  };

  if (!payload.full_name || !payload.email) {
    alert("Full name and email are required.");
    return;
  }

  const r = await fetch(`${API_BASE}/patient/profile.php`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (j.status !== "success") {
    alert(j.message || "Save failed");
    return;
  }

  await loadProfile();
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

(async function initProfile() {
  const ok = await requirePatientSession();
  if (!ok) return;
  await loadProfile();
})();
