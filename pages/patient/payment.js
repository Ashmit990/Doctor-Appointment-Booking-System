/**
 * Payment Page Logic
 * Handles parameter parsing, UI updates, and eSewa sandbox integration
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize State
  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get("doctor_id");
  const availId = urlParams.get("avail_id");
  const doctorName = urlParams.get("doctor_name");
  const specialization = urlParams.get("specialization");
  const dateValue = urlParams.get("date");
  const timeValue = urlParams.get("time");
  const reasonValue = urlParams.get("reason");

  // Basic validation
  if (!doctorId || !availId) {
    console.error("Missing required payment parameters");
    window.location.href = "dashboard.html";
    return;
  }

  // 2. Populate UI with Initial Data
  document.getElementById("dispDoctorName").textContent =
    doctorName || "Doctor";
  document.getElementById("dispSpecialization").textContent =
    specialization || "Consultation";
  document.getElementById("dispDate").textContent = dateValue || "---";
  document.getElementById("dispTime").textContent = timeValue || "---";
  document.getElementById("dispReason").textContent =
    reasonValue || "No reason provided";

  // 3. Fetch Fee Information
  let consultationFee = 500; // Default fallback
  try {
    const response = await fetch(`${API_BASE}/patient/doctors.php`, {
      credentials: "include",
    });
    const result = await response.json();
    if (result.status === "success" && result.data) {
      const doctor = result.data.find(
        (d) => String(d.doctor_id) === String(doctorId),
      );
      if (doctor && doctor.consultation_fee) {
        consultationFee = parseFloat(doctor.consultation_fee);
      }
    }
  } catch (error) {
    console.warn("Could not fetch precise fee, using default:", error);
  }

  // Update Price UI
  const formattedFee = `Rs. ${consultationFee.toFixed(2)}`;
  document.getElementById("dispBasePrice").textContent = formattedFee;
  document.getElementById("dispTotalPrice").textContent = formattedFee;

  // 4. Interaction Handlers
  const backBtn = document.getElementById("backBtn");
  const payNowBtn = document.getElementById("payNowBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingMsg = document.getElementById("loadingMsg");

  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  payNowBtn.addEventListener("click", async () => {
    // 1. Open the new tab IMMEDIATELY to bypass popup blockers (user activation context)
    const esewaWindow = window.open("about:blank", "_blank");

    try {
      // Show Loading State
      payNowBtn.disabled = true;
      loadingTitle.textContent = "Initiating Payment";
      loadingMsg.textContent = "Connecting to eSewa secure gateway...";
      loadingOverlay.classList.remove("hidden");

      // Call Backend to Init Payment
      const response = await fetch(
        `${API_BASE}/patient/esewa_payment_init.php`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctor_id: doctorId,
            avail_id: parseInt(availId),
            reason_for_visit: reasonValue || "Consultation",
          }),
        },
      );

      if (response.status === 504 || response.status === 502) {
        throw new Error("eSewa payment server is currently undergoing maintenance or is slow. Please try again in a few minutes.");
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Server Error Response:", errText);
        throw new Error("Server error: " + response.status + ". Please try again later.");
      }

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(result.message || "Failed to start payment process");
      }

      // 2. Redirect the already-opened new tab to eSewa redirection helper
      if (esewaWindow) {
        // Resolve absolute URL for the redirection helper relative to page
        const absoluteRedirectUrl = `${API_BASE}/patient/esewa_redirect.php?payment_id=${result.payment_id}`;
        esewaWindow.location.href = absoluteRedirectUrl;
      } else {
        // Fallback if popup was completely blocked
        window.open(`${API_BASE}/patient/esewa_redirect.php?payment_id=${result.payment_id}`, "_blank");
      }

      // 3. Start "watching" the payment status in the background
      if (result.payment_id) {
        startPolling(result.payment_id, esewaWindow);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      loadingOverlay.classList.add("hidden");
      payNowBtn.disabled = false;
      showToast(error.message, "error");
    }
  });

  function startPolling(paymentId, popupWindow) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(
          `${API_BASE}/patient/check_payment_status.php?payment_id=${paymentId}`,
        );
        const data = await response.json();

        if (data.status === "success" && data.payment_status === "Completed") {
          clearInterval(interval);
          if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
          }
          // Notify the parent dashboard that we are done!
          window.parent.postMessage(
            {
              type: "payment-result",
              status: "Completed",
              success: true,
              appointment_id: data.appointment_id,
              message: "Payment confirmed! Generating your receipt...",
            },
            "*",
          );
        } else if (
          data.status === "success" &&
          ["Failed", "Cancelled", "Expired", "Refunded"].includes(
            data.payment_status,
          )
        ) {
          clearInterval(interval);
          if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
          }
          // Inform self to show error toast
          window.postMessage(
            {
              type: "payment-result",
              status: "Failed",
              success: false,
              message: "Payment failed, expired, or was cancelled.",
            },
            "*",
          );
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Check every 2 seconds

    // Stop polling after 5 minutes to save resources
    setTimeout(() => clearInterval(interval), 300000);
  }

  // 5. Listen for Callback Message (Keep for compatibility if used from other places)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "payment-result") {
      const data = event.data;

      if (data.success) {
        // Success State
        loadingTitle.textContent = "Payment Successful!";
        loadingMsg.textContent =
          "Your appointment has been confirmed. Redirecting to dashboard...";
        loadingOverlay.querySelector(".animate-spin")?.classList.add("hidden");

        setTimeout(() => {
          window.location.href = "dashboard.html?booking_success=true";
        }, 3000);
      } else {
        // Failure State
        loadingOverlay.classList.add("hidden");
        payNowBtn.disabled = false;
        showToast(data.message || "Payment was not successful", "error");
      }
    }
  });
});

/**
 * Show a floating toast message
 */
function showToast(message, type = "error") {
  const toast = document.getElementById("errorToast");
  const text = document.getElementById("errorMsgText");

  text.textContent = message;

  // Adjust colors based on type
  if (type === "success") {
    toast.classList.replace("bg-red-600", "bg-emerald-600");
  } else {
    toast.classList.replace("bg-emerald-600", "bg-red-600");
  }

  // Animate in
  toast.classList.remove("translate-y-24", "opacity-0", "pointer-events-none");

  // Animate out after delay
  setTimeout(() => {
    toast.classList.add("translate-y-24", "opacity-0", "pointer-events-none");
  }, 5000);
}
