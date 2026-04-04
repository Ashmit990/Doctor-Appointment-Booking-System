const patientAppointments = [
  {
    patient: "Sirjeet",
    doctor: "Dr. Kim",
    specialty: "Cardiologist",
    department: "Heart Care",
    date: "2026-03-25",
    time: "10:30 AM",
    status: "today",
    location: "Room 203",
  },
  {
    patient: "Sirjeet",
    doctor: "Dr. Sarah Lee",
    specialty: "Dermatologist",
    department: "Skin Care",
    date: "2026-03-27",
    time: "02:00 PM",
    status: "upcoming",
    location: "Room 105",
  },
  {
    patient: "Sirjeet",
    doctor: "Dr. James Miller",
    specialty: "Dentist",
    department: "Dental Unit",
    date: "2026-03-18",
    time: "11:00 AM",
    status: "completed",
    location: "Room 301",
  },
];

const todayBooking = patientAppointments.find(
  (item) => item.status === "today",
);
const nextBooking = patientAppointments.find(
  (item) => item.status === "upcoming",
);
const totalAppointments = patientAppointments.length;
const todayCount = patientAppointments.filter(
  (item) => item.status === "today",
).length;
const upcomingCount = patientAppointments.filter(
  (item) => item.status === "upcoming",
).length;
const completedCount = patientAppointments.filter(
  (item) => item.status === "completed",
).length;

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

document.getElementById("todayBookingsCount").textContent = todayCount;
document.getElementById("upcomingCount").textContent = upcomingCount;
document.getElementById("completedCount").textContent = completedCount;
document.getElementById("totalAppointments").textContent = totalAppointments;
document.getElementById("todayDateLabel").textContent =
  new Date().toDateString();

if (todayBooking) {
  document.getElementById("todayBookingMessage").classList.add("hidden");
  document.getElementById("todayBookingCard").classList.remove("hidden");

  document.getElementById("todayDoctorName").textContent = todayBooking.doctor;
  document.getElementById("todayDoctorMeta").textContent =
    `${todayBooking.specialty} • ${todayBooking.department}`;
  document.getElementById("todayBookingDate").textContent = todayBooking.date;
  document.getElementById("todayBookingTime").textContent = todayBooking.time;
  document.getElementById("todayBookingLocation").textContent =
    todayBooking.location;
  document.getElementById("todayBookingStatus").textContent = "Yes";
} else {
  document.getElementById("todayBookingMessage").classList.remove("hidden");
  document.getElementById("todayBookingCard").classList.add("hidden");
  document.getElementById("todayBookingStatus").textContent = "No";
}

if (nextBooking) {
  document.getElementById("nextDoctorName").textContent = nextBooking.doctor;
  document.getElementById("nextDoctorMeta").textContent =
    `${nextBooking.specialty} • ${nextBooking.department}`;
  document.getElementById("nextBookingDate").textContent = nextBooking.date;
  document.getElementById("nextBookingTime").textContent = nextBooking.time;
  document.getElementById("nextBookingLocation").textContent =
    nextBooking.location;
  document.getElementById("nextDoctorSummary").textContent = nextBooking.doctor;
}
