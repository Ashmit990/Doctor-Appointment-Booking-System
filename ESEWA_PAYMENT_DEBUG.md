# eSewa Payment Gateway - Debug & Issues

## Issue: "Service is Currently Unavailable"

### Root Cause Identified ✓
**File:** `api/patient/esewa_redirect.php`

The form submission endpoint was **hardcoded** instead of using the configuration from `.env`:

```php
// BEFORE (Hardcoded - Problem)
<form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">

// AFTER (Fixed - Uses config)
<form id="esewaForm" action="<?php echo htmlspecialchars($config['api_base'] . '/main/v2/form'); ?>" method="POST">
```

### Why This Causes Issues

1. **Configuration Bypass**: Even if you update `.env` variables, the form ignored them
2. **API Changes**: If eSewa updates their endpoints, the hardcoded URL would fail
3. **Environment Switching**: You couldn't easily switch between sandbox/production

### Fix Applied

✅ Updated `api/patient/esewa_redirect.php` to dynamically construct the form endpoint from:
- `ESEWA_API_BASE` environment variable  
- Appends `/main/v2/form` path

Now the form respects your `.env` configuration.

## Testing the Fix

After the fix, test a payment:

1. **Initiate a booking** on the patient portal
2. **Select eSewa Wallet** → **Pay with eSewa**
3. You should now reach the eSewa form (instead of "service unavailable")
4. **Test credentials** (sandbox):
   - Mobile: `9806800001`
   - Password: `Nepal@123`
   - MPIN: `1122`
   - OTP: `123456`

## Debug Logging

Added error logging to track payment flow. Check your PHP error log:

```bash
# Linux/macOS
tail -f /var/log/apache2/error.log | grep "eSewa"

# XAMPP (Windows)
cat C:\xampp\apache\logs\error.log | findstr "eSewa"
```

Log markers:
- `[eSewa Callback]` - Callback received
- `[eSewa Payment Init]` - Payment initiated
- Look for `FAILED:` messages for errors

## Configuration Checklist

Verify your `.env` file has:

```env
ESEWA_API_BASE=https://rc-epay.esewa.com.np/api/epay
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/esewa_payment_callback.php
```

⚠️ **If `.env` is missing**, defaults will be used from `payment_helpers.php`

## Common eSewa Error Messages

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| "Service is Currently Unavailable" | Wrong endpoint URL or API down | Check `ESEWA_API_BASE` in `.env` |
| "Merchant code not found" | Invalid `ESEWA_MERCHANT_CODE` | Use `EPAYTEST` for sandbox |
| "Signature verification failed" | Wrong `ESEWA_SECRET_KEY` | Use `8gBm/:&EnhH.1/q` for sandbox |
| "Invalid amount" | Amount format issue | Amounts should be in rupees (e.g., 500 not 50000) |
| "Transaction UUID mismatch" | UUID not generated correctly | Check `esewa_payment_init.php` line with `transaction_uuid` |

## Payment Flow

```
1. Patient selects booking → POST to esewa_payment_init.php
   ↓ Creates payment record, reserves slot
   ↓ Returns payment_id

2. Payment ID sent to esewa_redirect.php
   ↓ Fetches payment details from DB
   ↓ Constructs eSewa form (NOW USES CONFIG)
   ↓ Form auto-submits to eSewa

3. eSewa processes payment
   ↓ User completes payment in eSewa UI

4. eSewa redirects to esewa_payment_callback.php?data=<encoded>
   ↓ Callback verifies signature & amount
   ↓ Creates appointment record
   ↓ Shows success/failure page
```

## If Issue Persists

1. **Check PHP error log** for detailed error messages
2. **Verify eSewa sandbox is operational**: https://rc-epay.esewa.com.np/
3. **Test with cURL** to verify connectivity:
   ```bash
   curl -I https://rc-epay.esewa.com.np/api/epay/main/v2/form
   ```
4. **Check firewall/network** - may be blocking eSewa domain
5. **Contact eSewa support** if their sandbox is down

---
**Last Updated:** 2026-05-18
