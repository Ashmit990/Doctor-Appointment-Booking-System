# Khalti Sandbox Setup Guide

## Step 1: Register as a Merchant on Khalti Test Portal

1. Go to https://test-admin.khalti.com/
2. Click **"Create a new account"** or **"Sign up"**
3. Enter your email and password
4. You'll receive an OTP on your email - use **987654** (Khalti test OTP)
5. Complete registration

## Step 2: Generate Your API Key

1. After login, go to **Settings** → **API Keys** or **Developer**
2. Create a new API key
3. You'll see two keys:
   - **Public Key** (for frontend)
   - **Secret Key** (for backend - keep this private!)
4. Copy the **Secret Key**

## Step 3: Update Your .env File

Edit `.env` in your project root and replace the placeholder:

```env
KHALTI_SECRET_KEY=your_actual_secret_key_here
KHALTI_API_BASE=https://dev.khalti.com/api/v2
KHALTI_WEBSITE_URL=http://localhost/Doctor-Appointment-Booking-System
KHALTI_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/khalti_payment_callback.php
KHALTI_TEST_MODE=true
```

Replace `your_actual_secret_key_here` with your real key from step 2.

## Step 4: Test Payment Credentials

Use these test credentials when making payments:

- **Khalti ID**: 9800000000 through 9800000005
- **MPIN**: 1111
- **OTP**: 987654

## Step 5: Test the Integration

1. Reload your dashboard (clear browser cache if needed)
2. Try booking an appointment
3. Complete payment using test credentials above
4. You should see success on redirect

## Troubleshooting

If you see "Invalid Khalti credentials" error:
- Verify your Secret Key is correctly copied (no extra spaces)
- Make sure .env file is in project root: `Doctor-Appointment-Booking-System/.env`
- Restart your web server (XAMPP Apache) so PHP picks up new env vars
- Check error logs: `php error_log` in XAMPP

If you see "Could not verify payment with Khalti":
- Make sure you completed the payment on Khalti portal
- Khalti redirects you back automatically - don't close the window
- Your payment expires after 30 minutes

## For Production

When ready for live payments:
1. Register at https://admin.khalti.com/
2. Get production keys from Khalti
3. Change `KHALTI_API_BASE` to `https://khalti.com/api/v2`
4. Use production Secret Key in .env
5. Update `KHALTI_WEBSITE_URL` and `KHALTI_RETURN_URL` to your live domain
