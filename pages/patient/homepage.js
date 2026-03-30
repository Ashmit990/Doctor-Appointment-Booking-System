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

const notifications = [
  {
    icon: "user-round",
    title: "Appointment Reminder",
    message: "You have an appointment with Dr. Kim today at 10:30 AM.",
    time: "5 min",
    dotColor: "bg-teal-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: "calendar-clock",
    title: "Upcoming Visit",
    message: "Dr. Sarah Lee appointment is scheduled for 2026-03-27.",
    time: "3 h",
    dotColor: "bg-teal-500",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    icon: "circle-alert",
    title: "System Alert",
    message: "Please arrive 15 minutes early for document verification.",
    time: "17 Jan",
    dotColor: "bg-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    icon: "shield-alert",
    title: "Health Notice",
    message: "Keep your prescriptions and reports ready before the visit.",
    time: "14 Jan",
    dotColor: "bg-yellow-500",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
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

function goToDashboard(event) {
  if (event) {
    event.stopPropagation();
  }
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
document.getElementById("notificationCount").textContent = notifications.length;

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

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllReadBtn");
const notificationCount = document.getElementById("notificationCount");

const calendarCardBtn = document.getElementById("calendarCardBtn");
const calendarModal = document.getElementById("calendarModal");
const closeCalendarModal = document.getElementById("closeCalendarModal");

function renderNotifications() {
  notificationList.innerHTML = "";

  notifications.forEach((item) => {
    const notificationItem = document.createElement("div");
    notificationItem.className =
      "notification-card px-5 py-4 border-b border-slate-100 last:border-b-0";

    notificationItem.innerHTML = `
      <div class="flex gap-4">
        <div class="pt-1">
          <div class="w-10 h-10 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center">
            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
          </div>
          <div class="w-2.5 h-2.5 rounded-full ${item.dotColor} mt-3 mx-auto"></div>
        </div>

        <div class="flex-1">
          <div class="flex items-start justify-between gap-4">
            <p class="text-[16px] leading-8 text-slate-600">
              <span class="font-bold text-slate-800">${item.title}</span>
              <span> ${item.message}</span>
            </p>
            <span class="text-sm text-slate-400 whitespace-nowrap">${item.time}</span>
          </div>
        </div>
      </div>
    `;

    notificationList.appendChild(notificationItem);
  });

  lucide.createIcons();
}

notificationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notificationPanel.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (
    !notificationPanel.contains(e.target) &&
    !notificationBtn.contains(e.target)
  ) {
    notificationPanel.classList.add("hidden");
  }
});

markAllReadBtn.addEventListener("click", () => {
  notificationCount.classList.add("hidden");
});

function openCalendarModal() {
  calendarModal.classList.remove("hidden");
  calendarModal.classList.add("flex");
}

function closeCalendarPopup() {
  calendarModal.classList.add("hidden");
  calendarModal.classList.remove("flex");
}

calendarCardBtn.addEventListener("click", openCalendarModal);
closeCalendarModal.addEventListener("click", closeCalendarPopup);

calendarModal.addEventListener("click", (e) => {
  if (e.target === calendarModal) {
    closeCalendarPopup();
  }
});

renderNotifications();
