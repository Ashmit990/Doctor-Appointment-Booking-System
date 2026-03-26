let appointments = [
  {
    patient: "You",
    doctor: "Dr. Kim",
    specialty: "Cardiologist",
    department: "Heart Care",
    date: "2026-03-25",
    time: "10:30 AM",
    status: "upcoming",
    location: "Room 203",
  },
  {
    patient: "You",
    doctor: "Dr. Sarah Lee",
    specialty: "Dermatologist",
    department: "Skin Care",
    date: "2026-03-27",
    time: "02:00 PM",
    status: "upcoming",
    location: "Room 105",
  },
  {
    patient: "You",
    doctor: "Dr. James Miller",
    specialty: "Dentist",
    department: "Dental Unit",
    date: "2026-03-18",
    time: "11:00 AM",
    status: "completed",
    location: "Room 301",
  },
  {
    patient: "You",
    doctor: "Dr. Emily Carter",
    specialty: "Neurologist",
    department: "Neuro Care",
    date: "2026-03-14",
    time: "09:00 AM",
    status: "missed",
    location: "Room 410",
  },
  {
    patient: "You",
    doctor: "Dr. John Smith",
    specialty: "General Physician",
    department: "General OPD",
    date: "2026-03-20",
    time: "04:15 PM",
    status: "completed",
    location: "Room 115",
  },
];

let activeFilter = "all";
let editingIndex = null;

const appointmentList = document.getElementById("appointmentList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
function goToHomePage() {
  window.location.href = "/homepage.html";
}

function getStatusClasses(status) {
  if (status === "upcoming") return "bg-emerald-100 text-emerald-700";
  if (status === "completed") return "bg-blue-100 text-blue-700";
  return "bg-red-100 text-red-700";
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function to24Hour(time12) {
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function renderCounts() {
  const upcoming = appointments.filter((a) => a.status === "upcoming").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const missed = appointments.filter((a) => a.status === "missed").length;

  document.getElementById("upcomingCount").textContent = upcoming;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("missedCount").textContent = missed;
  document.getElementById("totalCount").textContent = appointments.length;

  const next = appointments.find((a) => a.status === "upcoming");
  document.getElementById("nextAppointment").textContent = next
    ? `${next.date} • ${next.time}`
    : "-";
}

function renderAppointments() {
  const searchValue = searchInput.value.toLowerCase().trim();

  const filtered = appointments
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      const matchFilter =
        activeFilter === "all" || item.status === activeFilter;
      const matchSearch =
        item.doctor.toLowerCase().includes(searchValue) ||
        item.department.toLowerCase().includes(searchValue) ||
        item.specialty.toLowerCase().includes(searchValue);
      return matchFilter && matchSearch;
    });

  appointmentList.innerHTML = "";

  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach(({ item, originalIndex }) => {
    const lineColor =
      item.status === "upcoming"
        ? "bg-emerald-500"
        : item.status === "completed"
          ? "bg-blue-500"
          : "bg-red-500";

    const card = document.createElement("div");
    card.className =
      "appointment-card relative overflow-hidden bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md";

    card.innerHTML = `
      <div class="absolute left-0 top-0 h-full w-1 ${lineColor} rounded-l-[24px]"></div>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-800">${item.doctor}</h3>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(item.status)}">
              ${formatStatus(item.status)}
            </span>
          </div>

          <p class="text-sm text-slate-400 mb-4">${item.specialty} • ${item.department}</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-500">
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Date</span>
              <span class="font-medium text-slate-700">${item.date}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Time</span>
              <span class="font-medium text-slate-700">${item.time}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <span class="block text-xs text-slate-400 mb-1">Location</span>
              <span class="font-medium text-slate-700">${item.location}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition">
            View
          </button>
          <button data-index="${originalIndex}" class="reschedule-btn px-4 py-2.5 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium shadow-sm transition">
            Reschedule
          </button>
        </div>
      </div>
    `;

    appointmentList.appendChild(card);
  });

  document.querySelectorAll(".reschedule-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      openRescheduleModal(index);
    });
  });
}

function openBookingModal() {
  editingIndex = null;
  const modal = document.getElementById("bookingModal");
  const iframe = document.querySelector("#bookingModal iframe");
  iframe.src = "booking.html";
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openRescheduleModal(index) {
  editingIndex = index;
  const modal = document.getElementById("bookingModal");
  const iframe = document.querySelector("#bookingModal iframe");
  iframe.src = "booking.html";
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  iframe.onload = () => {
    const appointment = appointments[index];
    iframe.contentWindow.postMessage(
      {
        type: "LOAD_APPOINTMENT",
        data: {
          patient: appointment.patient,
          doctor: appointment.doctor,
          date: appointment.date,
          time: to24Hour(appointment.time),
        },
      },
      "*",
    );
  };
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.remove("active-filter", "bg-teal-600", "text-white");
      btn.classList.add(
        "bg-white",
        "border",
        "border-gray-200",
        "text-gray-700",
      );
    });

    button.classList.remove(
      "bg-white",
      "border",
      "border-gray-200",
      "text-gray-700",
    );
    button.classList.add("active-filter", "bg-teal-600", "text-white");

    renderAppointments();
  });
});

window.addEventListener("message", function (event) {
  if (!event.data) return;

  if (event.data.type === "NEW_APPOINTMENT") {
    if (editingIndex !== null) {
      appointments[editingIndex] = {
        ...appointments[editingIndex],
        ...event.data.data,
        status: "upcoming",
      };
      editingIndex = null;
    } else {
      appointments.unshift(event.data.data);
    }

    renderAppointments();
    renderCounts();
    closeBookingModal();

    setTimeout(() => {
      const toast = document.getElementById("successToast");
      toast.classList.remove("hidden");
      toast.classList.add("flex");

      const title = toast.querySelector(".toast-title");
      const text = toast.querySelector(".toast-text");

      if (title) title.textContent = "Success";
      if (text)
        text.textContent =
          editingIndex === null
            ? "Appointment booked successfully."
            : "Appointment rescheduled successfully.";

      setTimeout(() => {
        toast.classList.add("hidden");
        toast.classList.remove("flex");
      }, 2000);
    }, 350);
  }

  if (event.data.type === "booking:close") {
    closeBookingModal();
  }
});

searchInput.addEventListener("input", renderAppointments);

renderCounts();
renderAppointments();
