# eSewa Sandbox Setup Guide

This project is configured to use the eSewa Sandbox payment gateway. Follow these steps to configure your environment variables and test payments.

## Step 1: Environment Variables

Add the following keys to your `.env` file in the project root:

```env
# eSewa Sandbox Gateway Settings
ESEWA_API_BASE=https://rc-epay.esewa.com.np/api/epay
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/esewa_payment_callback.php
```

*Note: The values above are the standard eSewa sandbox credentials, which are populated as defaults if not explicitly configured in `.env`.*

## Step 2: Testing Payments

1. Initiate an appointment booking on the patient portal.
2. Select **eSewa Wallet** and click **Pay with eSewa**.
3. You will be redirected to the secure eSewa Sandbox page.
4. Use the following test credentials:
   - **Mobile Number / eSewa ID**: `9806800001` (or `9806800002`, `9806800003`, `9806800004`, `9806800005`)
   - **Password**: `Nepal@123`
   - **MPIN**: `1122`
   - **OTP / Token**: `123456`
5. Click **Pay**, then complete the simulation.
6. The eSewa sandbox will redirect you back to the appointment dashboard automatically, completing the appointment booking!
