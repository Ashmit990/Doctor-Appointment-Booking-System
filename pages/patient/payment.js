/**
 * Payment Page Logic
 * Handles parameter parsing, UI updates, and eSewa sandbox integration
 */

console.log("payment.js loading...");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired in payment.js");
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
  const payBtnText = document.getElementById("payBtnText");
  const cancelBtn = document.getElementById("cancelBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingMsg = document.getElementById("loadingMsg");
  const paymentMethodSelect = document.getElementById("paymentMethodSelect");
  const paymentMethodInfo = document.getElementById("paymentMethodInfo");
  const debugInfo = document.getElementById("debugInfo");
  const debugSelected = document.getElementById("debugSelected");
  const debugButtonText = document.getElementById("debugButtonText");
  const debugStatus = document.getElementById("debugStatus");

  let selectedPaymentMethod = "esewa"; // Default

  // Payment method information
  const paymentMethodDescriptions = {
    esewa: {
      name: "eSewa",
      desc: "Fast and secure payment via eSewa Sandbox",
      color: "#60bb46",
      bgColor: "from-[#60bb46]/10 to-[#60bb46]/5",
      borderColor: "border-[#60bb46]/20",
      textColor: "text-[#60bb46]"
    },
    khalti: {
      name: "Khalti",
      desc: "Fast payments via Khalti mobile wallet",
      color: "#5B3CC4",
      bgColor: "from-[#5B3CC4]/10 to-[#5B3CC4]/5",
      borderColor: "border-[#5B3CC4]/20",
      textColor: "text-[#5B3CC4]"
    }
  };

  // Function to update UI based on payment method
  function updatePaymentMethodUI(method) {
    console.log("Updating UI for method:", method);
    selectedPaymentMethod = method;
    const info = paymentMethodDescriptions[method];

    // Update button text
    payBtnText.textContent = method === "khalti" ? "Pay with Khalti" : "Pay with eSewa";
    console.log("Button text updated to:", payBtnText.textContent);

    // Update button styling using inline styles for reliability
    if (method === "khalti") {
      payNowBtn.style.backgroundColor = "#5B3CC4";
      payNowBtn.style.boxShadow = "0 4px 12px rgba(91, 60, 196, 0.2)";
      payNowBtn.onmouseover = function() { this.style.backgroundColor = "#4a2fa8"; };
      payNowBtn.onmouseout = function() { this.style.backgroundColor = "#5B3CC4"; };
    } else {
      payNowBtn.style.backgroundColor = "#60bb46";
      payNowBtn.style.boxShadow = "0 4px 12px rgba(96, 187, 70, 0.2)";
      payNowBtn.onmouseover = function() { this.style.backgroundColor = "#41a124"; };
      payNowBtn.onmouseout = function() { this.style.backgroundColor = "#60bb46"; };
    }
    console.log("Button styles updated");

    // Update payment method info box
    if (paymentMethodInfo) {
      paymentMethodInfo.className = `mt-6 p-4 rounded-2xl bg-gradient-to-br ${info.bgColor} border ${info.borderColor}`;
      paymentMethodInfo.innerHTML = `
        <p class="text-sm text-slate-600">
          <span class="font-semibold ${info.textColor}">${info.name}</span> - ${info.desc}
        </p>
      `;
      console.log("Info box updated to:", info.name);
    }

    // Update debug display
    if (debugInfo && debugSelected) {
      debugSelected.textContent = method;
      debugButtonText.textContent = payBtnText.textContent;
      debugInfo.classList.remove("hidden");
    }
  }

  // Dropdown change handler - Try multiple methods to ensure it works
  if (paymentMethodSelect) {
    console.log("Payment method select found, attaching listeners");
    debugStatus.textContent = "Script loaded, listeners attached";
    
    // Method 1: addEventListener for "change"
    paymentMethodSelect.addEventListener("change", (e) => {
      console.log("Event: change - Payment method changed to:", e.target.value);
      updatePaymentMethodUI(e.target.value);
    });
    
    // Method 2: addEventListener for "input"
    paymentMethodSelect.addEventListener("input", (e) => {
      console.log("Event: input - Payment method input:", e.target.value);
      updatePaymentMethodUI(e.target.value);
    });

    // Method 3: Direct property assignment
    paymentMethodSelect.onchange = function(e) {
      console.log("Event: onchange - Payment method changed to:", this.value);
      updatePaymentMethodUI(this.value);
    };
    
    // Initialize with current value on page load
    const currentValue = paymentMethodSelect.value;
    console.log("Initial payment method:", currentValue);
    updatePaymentMethodUI(currentValue);
  } else {
    console.error("Payment method select element not found!");
    debugStatus.textContent = "ERROR: Select element not found";
  }

  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  payNowBtn.addEventListener("click", async () => {
    console.log("Pay button clicked, selected method:", selectedPaymentMethod);

    try {
      // Show Loading State
      payNowBtn.disabled = true;
      loadingTitle.textContent = "Initiating Payment";
      
      const gatewayName = selectedPaymentMethod === "khalti" ? "Khalti" : "eSewa";
      loadingMsg.textContent = `Connecting to ${gatewayName} secure gateway...`;
      loadingOverlay.classList.remove("hidden");

      // Determine endpoint
      const endpoint = selectedPaymentMethod === "khalti" 
        ? `${API_BASE}/patient/khalti_payment_init.php`
        : `${API_BASE}/patient/esewa_payment_init.php`;

      // Call Backend to Init Payment
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          avail_id: parseInt(availId),
          reason_for_visit: reasonValue || "Consultation",
        }),
      });

      if (response.status === 504 || response.status === 502) {
        throw new Error(`${gatewayName} payment server is currently undergoing maintenance or is slow. Please try again in a few minutes.`);
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

      // Open popup window for payment redirect
      const paymentWindow = window.open("", "_blank");
      if (!paymentWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Determine redirect path
      let redirectPath;
      if (selectedPaymentMethod === "khalti" && result.payment_url) {
        // Use Khalti's payment URL directly if available
        redirectPath = result.payment_url;
      } else {
        // Use our redirect endpoints
        redirectPath = selectedPaymentMethod === "khalti"
          ? `${API_BASE}/patient/khalti_redirect.php?payment_id=${result.payment_id}`
          : `${API_BASE}/patient/esewa_redirect.php?payment_id=${result.payment_id}`;
      }
      
      console.log("Redirecting to:", redirectPath);
      paymentWindow.location.href = redirectPath;

      // Start polling
      if (result.payment_id) {
        startPolling(result.payment_id, paymentWindow);
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
