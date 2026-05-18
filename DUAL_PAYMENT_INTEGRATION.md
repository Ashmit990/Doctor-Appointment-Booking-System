# Dual Payment Gateway Integration Guide

## Overview
The booking system now supports **two payment methods**:
- **eSewa** - Mobile banking/wallet payments (Green)
- **Khalti** - Digital wallet payments (Purple)

Patients can select their preferred payment method during checkout.

## Configuration

### eSewa Setup (Already Integrated)
```env
ESEWA_API_BASE=https://rc-epay.esewa.com.np/api/epay
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/esewa_payment_callback.php
```

**Test Credentials (Sandbox):**
- Mobile: `9806800001` (or `9806800002-9806800005`)
- Password: `Nepal@123`
- MPIN: `1122`
- OTP: `123456`

### Khalti Setup (NEW)
```env
KHALTI_PUBLIC_KEY=3c1ddff45abd4f13ae9ff17051c305c7
KHALTI_SECRET_KEY=34276386a1a346d4b9f43cacb99fc0d6
KHALTI_API_BASE=https://a.khalti.com/api/v2
KHALTI_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/khalti_payment_callback.php
```

**Test Credentials (Sandbox):**
- MPIN: `1111`
- OTP: `987654`
- Test Mobile Numbers: `9800000000`, `9800000001`, `9800000002`, etc.

## Payment Flow

### 1. Patient Booking Flow
```
Patient clicks "Book Appointment"
    ↓
Payment Page Loads (displays both options)
    ↓
Patient selects payment method (eSewa or Khalti)
    ↓
Button text & color changes dynamically
    ↓
Click "Pay Now"
```

### 2. Backend Processing (Payment Init)

**eSewa Path:**
- `POST /api/patient/esewa_payment_init.php`
- Creates payment record in `appointment_payments` table
- Reserves doctor availability slot
- Returns `payment_id`

**Khalti Path:**
- `POST /api/patient/khalti_payment_init.php`
- Same logic as eSewa
- Stores transaction UUID in `pidx` column

### 3. Payment Gateway Redirect

**eSewa:**
- Redirects to: `api/patient/esewa_redirect.php?payment_id=X`
- Auto-submits form to: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- User completes payment in eSewa UI

**Khalti:**
- Redirects to: `api/patient/khalti_redirect.php?payment_id=X`
- Redirects to: `https://test-pay.khalti.com/?pidx=X&public_key=KEY`
- User completes payment in Khalti UI

### 4. Payment Verification & Callback

**eSewa Callback:**
- URL: `/api/patient/esewa_payment_callback.php?data=<base64_encoded_data>`
- Decodes & verifies signature
- Checks amount match
- Creates appointment if successful

**Khalti Callback:**
- URL: `/api/patient/khalti_payment_callback.php?pidx=X&transaction_id=Y&status=Completed`
- Verifies transaction with Khalti API
- Checks amount match
- Creates appointment if successful

### 5. Success/Failure Handling
Both gateways:
- Display success/failure confirmation page
- Post message to parent window (for popup scenarios)
- Redirect to dashboard after 5 seconds
- Release slot and mark as failed if unsuccessful

## API Endpoints

### Payment Initialization
```bash
POST /api/patient/esewa_payment_init.php
POST /api/patient/khalti_payment_init.php

Request Body:
{
  "doctor_id": "DOC_ABC123",
  "avail_id": 1234,
  "reason_for_visit": "Consultation reason"
}

Response:
{
  "status": "success",
  "payment_id": 42,
  "payment_url": "api/patient/[esewa|khalti]_redirect.php?payment_id=42",
  "transaction_uuid": "APT-PAT_123-1234567890",
  "amount_rupees": 500.00
}
```

### Payment Redirect
```bash
GET /api/patient/esewa_redirect.php?payment_id=42
GET /api/patient/khalti_redirect.php?payment_id=42

Returns: HTML form that auto-redirects to payment gateway
```

### Payment Callback
```bash
# eSewa
GET /api/patient/esewa_payment_callback.php?data=<base64_encoded_data>

# Khalti
GET /api/patient/khalti_payment_callback.php?pidx=X&transaction_id=Y&status=Completed
```

## Frontend Changes

### Payment Selection UI
- Two radio button options in `pages/patient/payment.html`
- Real-time button text update
- Dynamic color scheme based on selection:
  - eSewa: Green (#60bb46)
  - Khalti: Purple (#5B3CC4)

### JavaScript Logic (`pages/patient/payment.js`)
- Listeners on payment method radio buttons
- Dynamic button styling & text
- Route to correct payment init endpoint
- Updated loading messages

## Database Schema

### appointment_payments Table
```sql
- payment_id: INT (Primary Key)
- patient_id: VARCHAR
- doctor_id: VARCHAR
- avail_id: INT
- payment_method: VARCHAR (eSewa / Khalti)
- amount_paisa: INT (stored in paisa/paise)
- amount_rupees: DECIMAL
- pidx: VARCHAR (Transaction UUID for both gateways)
- payment_status: VARCHAR (Pending, Completed, Failed, etc.)
- booking_payload: JSON (slot details)
- callback_status: VARCHAR
- transaction_id: VARCHAR
- expires_at: DATETIME (30 min expiry)
- created_at: DATETIME
- updated_at: DATETIME
```

## Testing Checklist

### eSewa Payment
- [ ] Select eSewa option
- [ ] Click Pay Now
- [ ] Redirects to eSewa form
- [ ] Enter test credentials
- [ ] Complete payment in eSewa UI
- [ ] Receive success confirmation
- [ ] Appointment created in dashboard

### Khalti Payment
- [ ] Select Khalti option
- [ ] Button changes to "Pay with Khalti" (purple)
- [ ] Click Pay Now
- [ ] Redirects to Khalti payment page
- [ ] Enter test credentials
- [ ] Complete payment in Khalti UI
- [ ] Receive success confirmation
- [ ] Appointment created in dashboard

### Error Scenarios
- [ ] Cancel payment mid-way (eSewa/Khalti)
- [ ] Wrong amount verification
- [ ] Expired payment (>30 min)
- [ ] Network error during callback
- [ ] Duplicate payment attempt

## Logs & Debugging

### Error Logs
Check PHP error log for `[eSewa]` or `[Khalti]` markers:

**Linux/macOS:**
```bash
tail -f /var/log/apache2/error.log | grep -E "eSewa|Khalti"
```

**XAMPP (Windows):**
```bash
tail -f C:\xampp\apache\logs\error.log | findstr "eSewa Khalti"
```

### Log Markers
- `[Khalti Init]` - Payment initialization
- `[Khalti Callback]` - Callback processing
- `[eSewa Init]` - eSewa initialization
- `[eSewa Callback]` - eSewa callback processing

## Production Checklist

- [ ] Update `KHALTI_PUBLIC_KEY` with production key
- [ ] Update `KHALTI_SECRET_KEY` with production secret
- [ ] Change `KHALTI_API_BASE` to: `https://a.khalti.com/api/v2` (if not already)
- [ ] Update return URLs to production domain
- [ ] Test both payment methods end-to-end
- [ ] Verify slot reservation and release logic
- [ ] Check appointment creation in database
- [ ] Monitor error logs for integration issues
- [ ] Set up email notifications for failed payments
- [ ] Configure webhook handlers if needed

## Troubleshooting

### "Service is Currently Unavailable" (eSewa)
- Check `ESEWA_API_BASE` is correct
- Verify eSewa sandbox is operational
- Check firewall allows eSewa domain

### Khalti Payment Not Processing
- Verify `KHALTI_PUBLIC_KEY` is correct
- Ensure `KHALTI_SECRET_KEY` matches your merchant account
- Check if Khalti sandbox is operational
- Verify callback URL is accessible

### Appointment Not Created After Payment
- Check payment status in DB (should be "Completed")
- Review error logs for callback issues
- Verify slot hasn't expired (30 min limit)
- Ensure patient profile has required fields

### Amount Mismatch Errors
- eSewa uses rupees (direct amount)
- Khalti uses paisa (multiply by 100)
- Verify `consultation_fee` in `doctor_profiles` table

## File Structure

```
api/patient/
├── esewa_payment_init.php        (eSewa init)
├── esewa_redirect.php             (eSewa form)
├── esewa_payment_callback.php      (eSewa callback)
├── khalti_payment_init.php        (Khalti init) [NEW]
├── khalti_redirect.php             (Khalti form) [NEW]
├── khalti_payment_callback.php     (Khalti callback) [NEW]
├── payment_helpers.php             (Shared helpers)
└── bootstrap.php

pages/patient/
├── payment.html                   (Payment page - UPDATED)
└── payment.js                     (Payment logic - UPDATED)
```

## Support

For issues or questions:
1. Check error logs with appropriate markers
2. Verify .env configuration
3. Test with sandbox credentials
4. Review database records in `appointment_payments` table
5. Check payment gateway status pages

---
**Last Updated:** 2026-05-18
**Version:** 2.0 (Dual Gateway)
