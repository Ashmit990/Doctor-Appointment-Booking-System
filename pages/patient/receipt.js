document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get("appointment_id");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const receiptContent = document.getElementById("receiptContent");

  if (!appointmentId) {
    alert("Invalid Receipt Access");
    window.close();
    return;
  }

  try {
    const response = await fetch(
      `../../api/patient/get_receipt.php?appointment_id=${appointmentId}`,
      {
        credentials: "include",
      },
    );
    const result = await response.json();

    if (result.status === "success") {
      const data = result.data;

      // Populate Fields
      document.getElementById("billNo").textContent = data.bill_no;
      document.getElementById("paymentDate").textContent = new Date(
        data.payment_date,
      ).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      document.getElementById("patientName").textContent = data.patient_name;
      document.getElementById("patientEmail").textContent = data.patient_email;
      document.getElementById("doctorName").textContent = data.doctor_name;
      document.getElementById("specialization").textContent =
        data.specialization || "General Consultation";
      document.getElementById("appointmentMeta").textContent =
        `${data.app_date} • ${data.app_time}`;

      const formattedAmount = `Rs. ${Number(data.amount_rupees).toFixed(2)}`;
      document.getElementById("itemAmount").textContent = formattedAmount;
      document.getElementById("totalAmount").textContent = formattedAmount;
      document.getElementById("paymentMethod").textContent =
        data.payment_method +
        (data.payment_method === "Khalti" ? " e-Wallet" : "");
      document.getElementById("transactionId").textContent =
        data.transaction_id || data.pidx || "N/A";

      // Show Content
      loadingOverlay.classList.add("hidden");
      receiptContent.classList.remove("hidden");

      if (typeof lucide !== "undefined") lucide.createIcons();
    } else {
      throw new Error(result.message || "Failed to load receipt");
    }
  } catch (error) {
    console.error("Receipt Error:", error);
    alert(error.message);
    window.close();
  }

  document.getElementById("closeBtn").addEventListener("click", () => {
    if (
      window.parent &&
      typeof window.parent.closeReceiptModal === "function"
    ) {
      window.parent.closeReceiptModal();
    } else {
      window.close();
    }
  });
});
