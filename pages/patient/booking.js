const doctorDetails = {
  "Dr. Kim": {
    specialty: "Cardiologist",
    department: "Heart Care",
    location: "Room 203",
  },
  "Dr. Sarah Lee": {
    specialty: "Dermatologist",
    department: "Skin Care",
    location: "Room 105",
  },
  "Dr. James Miller": {
    specialty: "Dentist",
    department: "Dental Unit",
    location: "Room 301",
  },
  "Dr. Emily Carter": {
    specialty: "Neurologist",
    department: "Neuro Care",
    location: "Room 410",
  },
  "Dr. John Smith": {
    specialty: "General Physician",
    department: "General OPD",
    location: "Room 115",
  },
};

function formatTimeTo12Hour(time24) {
  const [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

const bookingForm = document.getElementById("bookingForm");
const cancelBooking = document.getElementById("cancelBooking");

window.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "LOAD_APPOINTMENT") {
    document.getElementById("patientName").value =
      event.data.data.patient || "";
    document.getElementById("doctor").value = event.data.data.doctor || "";
    document.getElementById("date").value = event.data.data.date || "";
    document.getElementById("time").value = event.data.data.time || "";
  }
});

cancelBooking.addEventListener("click", () => {
  bookingForm.reset();
  window.parent.postMessage({ type: "booking:close" }, "*");
});

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const doctor = document.getElementById("doctor").value;
  const details = doctorDetails[doctor];

  const appointment = {
    patient: document.getElementById("patientName").value.trim(),
    doctor: doctor,
    specialty: details.specialty,
    department: details.department,
    date: document.getElementById("date").value,
    time: formatTimeTo12Hour(document.getElementById("time").value),
    status: "upcoming",
    location: details.location,
  };

  window.parent.postMessage(
    {
      type: "NEW_APPOINTMENT",
      data: appointment,
    },
    "*",
  );

  bookingForm.reset();
});
