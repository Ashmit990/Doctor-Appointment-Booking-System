# Doctor Appointment Booking System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Payment Gateway Integration](#payment-gateway-integration)
4. [Medical Report System](#medical-report-system)
5. [Admin Dashboard](#admin-dashboard)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

The Doctor Appointment Booking System is a comprehensive healthcare platform that allows patients to book appointments with doctors, process payments through multiple gateways, and manage medical records. Doctors can manage their schedules, consultations, and generate medical reports. Admins have full system management capabilities.

### Key Features
- ✅ Patient appointment booking system
- ✅ Doctor schedule management
- ✅ Dual payment gateway integration (eSewa & Khalti)
- ✅ Medical report generation and storage
- ✅ Admin dashboard with analytics
- ✅ Role-based access control
- ✅ Real-time appointment management
- ✅ Responsive design for all devices

---

## Project Structure

```
Doctor-Appointment-Booking-System/
├── api/
│   ├── admin/              (Admin-specific APIs)
│   ├── auth/               (Authentication endpoints)
│   ├── config/             (Database & mail configuration)
│   ├── doctor/             (Doctor-specific APIs)
│   ├── includes/           (Shared utilities)
│   └── patient/            (Patient-specific APIs)
├── database/
│   ├── hospital_official.sql (Main schema)
│   └── medical_reports_migration.sql (Reports table)
├── pages/
│   ├── admin/              (Admin interface pages)
│   ├── auth/               (Login/signup pages)
│   ├── doctor/             (Doctor dashboard pages)
│   └── patient/            (Patient portal pages)
├── src/
│   ├── assets/             (Images, icons)
│   ├── css/                (Stylesheets)
│   └── js/                 (Shared JavaScript)
├── uploads/
│   └── patient_docs/       (Patient document uploads)
└── vendor/                 (Composer dependencies)
```

---

## Payment Gateway Integration

### Overview
The system supports **two payment methods**:
- **eSewa** - Mobile banking/wallet payments (Green)
- **Khalti** - Digital wallet payments (Purple)

Patients can select their preferred payment method during checkout.

### Configuration

#### eSewa Setup
```env
# .env configuration
ESEWA_API_BASE=https://rc-epay.esewa.com.np/api/epay
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/esewa_payment_callback.php
```

**Sandbox Test Credentials:**
- Mobile: `9806800001` (or `9806800002-9806800005`)
- Password: `Nepal@123`
- MPIN: `1122`
- OTP: `123456`

#### Khalti Setup
```env
KHALTI_PUBLIC_KEY=3c1ddff45abd4f13ae9ff17051c305c7
KHALTI_SECRET_KEY=34276386a1a346d4b9f43cacb99fc0d6
KHALTI_API_BASE=https://a.khalti.com/api/v2
KHALTI_RETURN_URL=http://localhost/Doctor-Appointment-Booking-System/api/patient/khalti_payment_callback.php
```

**Sandbox Test Credentials:**
- MPIN: `1111`
- OTP: `987654`
- Test Mobile: `9800000000-9800000002`

### Payment Flow

```
1. Patient Booking
   ├─ Clicks "Book Appointment"
   ├─ Selects payment method (eSewa or Khalti)
   └─ Button text & color changes dynamically

2. Backend Processing
   ├─ Creates payment record in appointment_payments table
   ├─ Reserves doctor availability slot
   └─ Returns payment_id

3. Payment Gateway Redirect
   ├─ Redirects to appropriate gateway
   └─ User completes payment

4. Payment Verification
   ├─ Callback validates transaction
   ├─ Verifies signature & amount
   ├─ Creates appointment record
   └─ Shows success/failure confirmation

5. Post-Payment
   ├─ Display success/failure page
   ├─ Post message to parent window
   ├─ Redirect to dashboard after 5 seconds
   └─ Release slot if failed
```
a

### API Endpoints

#### Payment Initialization
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

#### Payment Callback
```bash
# eSewa
GET /api/patient/esewa_payment_callback.php?data=<base64_encoded_data>

# Khalti
GET /api/patient/khalti_payment_callback.php?pidx=X&transaction_id=Y&status=Completed
```

### Database Schema: appointment_payments

```sql
- payment_id: INT (Primary Key)
- patient_id: VARCHAR
- doctor_id: VARCHAR
- avail_id: INT
- payment_method: VARCHAR (eSewa / Khalti)
- amount_paisa: INT (stored in paisa/paise)
- amount_rupees: DECIMAL
- pidx: VARCHAR (Transaction UUID)
- payment_status: VARCHAR (Pending, Completed, Failed)
- booking_payload: JSON (slot details)
- callback_status: VARCHAR
- transaction_id: VARCHAR
- expires_at: DATETIME (30 min expiry)
- created_at: DATETIME
- updated_at: DATETIME
```

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Service is Currently Unavailable" | Wrong endpoint URL or API down | Check ESEWA_API_BASE in .env |
| "Merchant code not found" | Invalid ESEWA_MERCHANT_CODE | Use EPAYTEST for sandbox |
| "Signature verification failed" | Wrong ESEWA_SECRET_KEY | Use 8gBm/:&EnhH.1/q for sandbox |
| "Invalid amount" | Amount format issue | Amounts should be in rupees (e.g., 500 not 50000) |
| Khalti Payment Not Processing | Wrong keys or sandbox down | Verify KHALTI_PUBLIC_KEY & KHALTI_SECRET_KEY |
| Appointment Not Created After Payment | Payment status not completed | Check database appointment_payments table |

### Testing Checklist

#### eSewa Payment
- [ ] Select eSewa option
- [ ] Click Pay Now
- [ ] Redirects to eSewa form
- [ ] Enter test credentials
- [ ] Complete payment in eSewa UI
- [ ] Receive success confirmation
- [ ] Appointment created in dashboard

#### Khalti Payment
- [ ] Select Khalti option
- [ ] Button changes to "Pay with Khalti" (purple)
- [ ] Click Pay Now
- [ ] Redirects to Khalti payment page
- [ ] Enter test credentials
- [ ] Complete payment in Khalti UI
- [ ] Receive success confirmation
- [ ] Appointment created in dashboard

#### Error Scenarios
- [ ] Cancel payment mid-way (eSewa/Khalti)
- [ ] Wrong amount verification
- [ ] Expired payment (>30 min)
- [ ] Network error during callback
- [ ] Duplicate payment attempt

---

## Medical Report System

### Overview
A complete Medical Report Generation system that allows doctors to generate professional medical reports during patient consultations and enables patients to securely view and download these reports.

### Features

#### For Doctors
Location: `pages/doctor/schedules.html`

- ✅ Generate medical reports only for completed appointments
- ✅ Fill in detailed patient information:
  - **Symptoms** - Chief complaints reported by patient
  - **Diagnosis** - Medical diagnosis from doctor
  - **Vital Signs** - Blood Pressure and Weight measurements
  - **Prescribed Medicines** - Add multiple medicines with dosage and frequency
  - **Additional Notes** - Extra clinical observations
- ✅ Save reports to database
- ✅ Download reports as professional PDF

#### For Patients
Location: `pages/patient/dashboard.html`

- ✅ View "View Report" button for completed appointments
- ✅ Securely view complete medical findings
- ✅ Download complete medical report as PDF
- ✅ Secure access (only their own reports)

### Database Schema: medical_reports

```sql
CREATE TABLE `medical_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` int(11) NOT NULL,
  `patient_id` varchar(20) NOT NULL,
  `doctor_id` varchar(20) NOT NULL,
  `symptoms` text NOT NULL,
  `diagnosis` text NOT NULL,
  `blood_pressure` varchar(20),
  `weight` decimal(5,2),
  `prescribed_medicines` json,
  `additional_notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`doctor_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `appointment_report` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### Installation

#### Step 1: Create Database Table
```bash
mysql -u root -p hospital < database/medical_reports_migration.sql
```

#### Step 2: Verify Installation
- ✅ Check `api/doctor/medical_report.php` exists
- ✅ Check `api/doctor/generate_medical_report_pdf.php` exists
- ✅ Check `pages/doctor/schedules.html` has jsPDF CDN
- ✅ Check `pages/patient/dashboard.html` has medical report viewer

#### Step 3: Test the Feature
1. **As Doctor:**
   - Complete an appointment (mark as "Completed")
   - Click "Generate Medical Report" button
   - Fill form and save
   - Download PDF

2. **As Patient:**
   - View completed appointments
   - Click "View Report" button
   - View and download report

### API Endpoints

#### Save/Update Medical Report
```
POST /api/doctor/medical_report.php

Request Body:
{
  "appointment_id": 123,
  "symptoms": "Persistent cough, fever",
  "diagnosis": "Acute bronchitis",
  "blood_pressure": "120/80",
  "weight": 72.5,
  "prescribed_medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3x daily for 7 days"
    }
  ],
  "additional_notes": "Follow-up in 1 week if symptoms persist"
}

Response:
{
  "status": "success",
  "message": "Medical report saved successfully",
  "report_id": 1
}
```

#### Retrieve Medical Report
```
GET /api/doctor/medical_report.php?appointment_id=123

Response:
{
  "status": "success",
  "data": {
    "report_id": 1,
    "appointment_id": 123,
    "patient_id": "PAT_001",
    "doctor_id": "DOC_001",
    "doctor_name": "Dr. Smith",
    "symptoms": "...",
    "diagnosis": "...",
    "prescribed_medicines": [...]
  }
}
```

#### Generate PDF Data
```
GET /api/doctor/generate_medical_report_pdf.php?appointment_id=123

Returns: Formatted report data for PDF generation
```

### Security Features
- ✅ Role-Based Access Control: Only logged-in users can access
- ✅ Doctor Authorization: Doctors can only create/edit reports for their own appointments
- ✅ Patient Privacy: Patients can only view their own reports
- ✅ Appointment Validation: Reports are linked to specific appointments
- ✅ Unique Constraint: Only one report per appointment
- ✅ Data Integrity: Foreign keys ensure referential integrity
- ✅ Audit Trail: Automatic timestamp tracking

### User Workflows

**Doctor Workflow:**
```
1. Navigate to Schedules
2. Complete consultation for appointment
3. Click "Complete Consultation" button
4. Mark status as "Completed"
5. "Generate Medical Report" button becomes visible
6. Click button to open report form
7. Fill in symptoms, diagnosis, vital signs, medicines, notes
8. Click "Save Report"
9. Report saved to database
10. Optional: Download PDF
```

**Patient Workflow:**
```
1. Navigate to Dashboard
2. View completed appointments
3. Find appointment with "View Report" button
4. Click "View Report"
5. Report viewer modal opens
6. Review all medical information
7. Optional: Click "Download PDF" to save
```

### PDF Features
- Professional hospital header
- Hospital contact information
- Patient personal information
- Doctor information
- Appointment details
- Medical findings (symptoms, diagnosis)
- Vital signs (BP, Weight)
- Prescribed medicines with dosages
- Additional clinical notes
- Report generation timestamp

### Files Modified/Created

**Backend:**
- ✅ `api/doctor/medical_report.php` (NEW)
- ✅ `api/doctor/generate_medical_report_pdf.php` (NEW)
- ✅ `database/medical_reports_migration.sql` (NEW)

**Frontend - Doctor:**
- ✅ `pages/doctor/schedules.html` (UPDATED - Added modal)
- ✅ `pages/doctor/schedules.js` (UPDATED - Added functions)

**Frontend - Patient:**
- ✅ `pages/patient/dashboard.html` (UPDATED - Added viewer)
- ✅ `pages/patient/dashboard.js` (UPDATED - Added button)
- ✅ `pages/patient/medical_report_pdf_generator.js` (NEW)

---

## Admin Dashboard

### Overview
The Admin Dashboard provides comprehensive management tools for overseeing the entire healthcare booking system. Admins can manage doctors, patients, appointments, and view analytics.

### Header Consistency Analysis

The admin pages maintain a standardized header structure with minor variations:

**Base Header Classes (ALL PAGES):**
```html
class="bg-white px-4 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30"
```

#### Identified Inconsistencies

| Issue | Pages Affected | Status |
|-------|----------------|--------|
| Missing `transition-colors` on toggle button | doctor.html, users.html, doctor_approvals.html, treatment_tickets.html, reports.html, adminprofile.html | ⚠️ Minor |
| EXTRA: `uppercase tracking-wider` on H1 | treatment_tickets.html | ❌ Critical |
| EXTRA: `font-medium` on date span | treatment_tickets.html | ⚠️ Minor |
| Inline vs. Multiline H1 format | doctor.html, doctor_approvals.html, reports.html | ⚠️ Minor |

#### Recommendations for Consistency

**Priority 1: Critical (Fix treatment_tickets.html)**
- Remove `uppercase tracking-wider` from h1 to match other pages
- Remove `font-medium` from date span to match standard
- Add `transition-colors` to toggle button

**Priority 2: Medium (Standardize Button Transition)**
- Add `transition-colors` to toggle button in: doctor.html, users.html, doctor_approvals.html, reports.html, adminprofile.html
- Use dashboard.html pattern as standard

**Priority 3: Low (Code Formatting)**
- Standardize h1 to multiline format across all pages
- Current inconsistencies: doctor.html, doctor_approvals.html, reports.html

### Admin Pages Summary

All 10 admin pages follow a consistent structure:
- **dashboard.html** - System overview and statistics
- **appointments.html** - Appointment management with filtering & pagination
- **doctor.html** - Doctor profile management
- **doctors.php** - Doctor listing and CRUD operations
- **users.html** - User management
- **leaderboard.html** - Performance rankings
- **patient_leaderboard.html** - Patient activity rankings
- **doctor_approvals.html** - Doctor approval workflow
- **treatment_tickets.html** - Issue/ticket management
- **reports.html** - Analytics and reporting
- **adminprofile.html** - Admin profile management

### Appointments Management

**Features:**
- ✅ View all appointments with pagination (10 items per page)
- ✅ Filter appointments by status (Upcoming, Completed, Missed)
- ✅ Search appointments by patient/doctor name
- ✅ Edit past appointments
- ✅ Add doctor comments to consultations
- ✅ Auto-refresh every 30 seconds for real-time updates
- ✅ Real-time page count updates

**Pagination System:**
- Unfiltered view: Uses API pagination (page-by-page loading)
- Filtered view: Loads all results, paginate locally
- Handles both scenarios seamlessly

**Recent Fixes:**
- ✅ Fixed page count display for unfiltered appointments
- ✅ Fixed filter to show all matching appointments
- ✅ Added auto-refresh to show new bookings
- ✅ Fixed Next/Previous button navigation

---

## Testing Guide

### Prerequisites
- XAMPP running (Apache + MySQL)
- Database with `hospital` schema populated
- Doctor and patient accounts ready

### First-Time Doctor Login Schedule Setup

#### Test Scenario 1: First-Time Login (Schedule NOT Setup)

**Setup:** Create test doctor with `schedule_setup_completed = FALSE`

**Steps:**
1. Log in with doctor credentials
2. System shows modal: "Set Your Weekly Schedule"
3. Modal is non-dismissible (cannot interact with dashboard)

**Expected Result:**
- ✅ Redirects to home.html
- ✅ Modal appears immediately
- ✅ Cannot interact with dashboard behind modal
- ✅ Shows info box with requirements

#### Test Scenario 2: Schedule Selection

**Steps:**
1. Click on "Monday" day selector
2. Verify Monday section appears with 3 default time slots
3. Click on "Wednesday" and "Friday"

**Expected Result:**
- ✅ Selected days highlighted in teal (#007E85)
- ✅ Time slot sections appear for each day
- ✅ Default slots: 09:00-10:00, 10:00-11:00, 14:00-15:00

#### Test Scenario 3: Validation Testing

**Test 3a: No Days Selected**
- Click "Save Schedule & Continue" without selecting days
- Expected: Error message "Please select at least one working day."

**Test 3b: Invalid Time Range**
- Select Monday with end time before start time
- Expected: Error message "Start time must be before end time"

**Test 3c: Successful Schedule Save**
- Select days and valid times
- Click "Save Schedule & Continue"
- Expected: Modal closes, dashboard loads, `schedule_setup_completed` updated in DB

#### Test Scenario 4: Second Login (Schedule Already Setup)

**Steps:**
1. Log out and log back in
2. Expected: Modal does NOT appear, dashboard loads normally

### Payment Testing

#### eSewa Payment Flow
```
1. Patient clicks "Book Appointment"
2. Selects date, time, and doctor
3. Chooses eSewa payment
4. Click "Pay Now"
5. Redirects to eSewa form
6. Use test credentials (9806800001 / Nepal@123)
7. Complete payment
8. Redirected back
9. Appointment created in dashboard
```

#### Khalti Payment Flow
```
1. Patient clicks "Book Appointment"
2. Selects date, time, and doctor
3. Chooses Khalti payment
4. Click "Pay Now"
5. Redirects to Khalti payment page
6. Use test credentials (9800000000 / 1111)
7. Complete payment
8. Redirected back
9. Appointment created in dashboard
```

### Medical Report Testing

#### Doctor Report Creation
```
1. Go to Schedules
2. Complete an appointment (mark as "Completed")
3. "Generate Medical Report" button appears
4. Fill form with:
   - Symptoms
   - Diagnosis
   - Blood Pressure (e.g., 120/80)
   - Weight (e.g., 72.5 kg)
   - Medicines (add at least one)
   - Additional Notes
5. Click "Save Report"
6. Verify in database: medical_reports table
7. Download PDF to test generation
```

#### Patient Report Viewing
```
1. Go to Patient Dashboard
2. View completed appointments
3. Click "View Report" button
4. Verify all information displays correctly
5. Click "Download PDF"
6. Verify PDF downloads and opens correctly
```

### Admin Dashboard Testing

#### Appointment Management
```
1. Go to Admin → Appointments
2. View 10 appointments on page 1
3. Click "Next" → shows page 2
4. Filter by "Completed" status
5. Verify only completed appointments show
6. Check page count updates correctly
7. Search by doctor name
8. Verify search results paginate correctly
9. Edit an appointment
10. Add doctor comments and save
```

#### Doctor Management
```
1. Go to Admin → Doctors
2. View list of doctors
3. Create new doctor
4. Edit existing doctor profile
5. Delete doctor (verify cascading delete works)
6. Verify no foreign key errors
```

#### User Management
```
1. Go to Admin → Users/Patients
2. View list of patients
3. Filter by status
4. Search by name/email
5. Edit patient information
```

---

## Troubleshooting

### General Issues

#### "Service is Currently Unavailable" (eSewa)
**Cause:** Hardcoded or incorrect API endpoint

**Solution:**
1. Check `ESEWA_API_BASE` in `.env`
2. Verify `esewa_redirect.php` uses config value
3. Ensure eSewa sandbox is operational
4. Check firewall allows eSewa domain

#### Khalti Payment Not Processing
**Cause:** Incorrect keys or sandbox down

**Solution:**
1. Verify `KHALTI_PUBLIC_KEY` is correct
2. Ensure `KHALTI_SECRET_KEY` matches your merchant account
3. Check if Khalti sandbox is operational
4. Verify callback URL is accessible

#### Appointment Not Created After Payment
**Cause:** Payment status not marked as completed

**Solution:**
1. Check `appointment_payments` table for record
2. Verify payment status is "Completed"
3. Review error logs for callback issues
4. Ensure slot hasn't expired (30 min limit)
5. Confirm patient profile has required fields

#### Amount Mismatch Errors
**Cause:** Incorrect amount format

**Solution:**
- eSewa uses rupees (direct amount)
- Khalti uses paisa (multiply by 100)
- Verify `consultation_fee` in `doctor_profiles` table

### Doctor Issues

#### Doctor Cannot See Schedule Setup Modal
**Cause:** `schedule_setup_completed` is already TRUE

**Solution:**
1. SQL: `UPDATE users SET schedule_setup_completed = 0 WHERE user_id = 'DOC_ID'`
2. Log out and log back in
3. Modal should appear

#### Doctor Cannot Generate Medical Report
**Cause:** Appointment not marked as "Completed"

**Solution:**
1. Go to completed appointments only
2. Complete a consultation
3. Mark status as "Completed"
4. "Generate Medical Report" button should appear

### Admin Issues

#### "Cannot delete or update a parent row" (Foreign Key Error)
**Cause:** Records in child tables preventing deletion

**Solution:**
1. Error occurs when deleting doctors with appointments
2. Check cascading delete order:
   - payment_records → earnings → appointments → availability → profile → user
3. Verify foreign key constraints are set to CASCADE
4. Delete child records manually if needed

#### Appointments Not Updating in Real-Time
**Cause:** Auto-refresh not working or page cached

**Solution:**
1. Page auto-refreshes every 30 seconds
2. Manual refresh: Press F5
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check Network tab for API calls
5. Verify API response status is 200

#### Filter Showing Wrong Results
**Cause:** Filter only checking current page data

**Solution:**
1. System now loads all data before filtering
2. Filters apply to entire dataset
3. If still wrong: Clear cache and refresh
4. Check database for data integrity

### Patient Issues

#### Cannot See "View Report" Button
**Cause:** Appointment not marked as "Completed"

**Solution:**
1. Confirm appointment date has passed
2. Mark appointment as "Completed"
3. Refresh dashboard page
4. Button should appear

#### PDF Not Downloading
**Cause:** jsPDF library not loaded or API error

**Solution:**
1. Check Network tab in DevTools
2. Verify jsPDF library loads (check for CDN errors)
3. Check API endpoint returns data
4. Try different browser
5. Clear cache and try again

#### Report Data Not Loading
**Cause:** Report doesn't exist or access denied

**Solution:**
1. Verify report was saved successfully
2. Check `medical_reports` table in database
3. Ensure it's your own report (patient can only see own)
4. Verify appointment_id is correct

### Database Issues

#### Database Connection Failed
**Cause:** Incorrect database credentials or MySQL not running

**Solution:**
1. Check MySQL is running (XAMPP control panel)
2. Verify credentials in `api/config/db.php`
3. Test connection: `mysql -u root -p` (from terminal)
4. Ensure `hospital` database exists

#### Table Not Found: medical_reports
**Cause:** Migration not run

**Solution:**
```bash
mysql -u root -p hospital < database/medical_reports_migration.sql
```

#### Missing Columns in appointment_payments
**Cause:** Database schema not updated

**Solution:**
1. Verify `appointment_payments` table structure
2. Should have: payment_method, pidx, payment_status columns
3. Run migrations if missing
4. Add columns manually if needed

### Performance Issues

#### Page Loading Slowly
**Cause:** Large dataset or unoptimized queries

**Solution:**
1. Check if 9999 appointment fetch is needed only when filtering
2. Consider implementing pagination for all scenarios
3. Add database indexes on frequently queried columns
4. Check server error logs for slow queries

#### Auto-Refresh Using Too Much Bandwidth
**Cause:** 30-second refresh interval too aggressive

**Solution:**
1. Change refresh interval in `appointments.js` line 569
2. Current: `setInterval(..., 30000)` (30 seconds)
3. Increase to 60000 (1 minute) or adjust as needed

---

## Additional Resources

### Database Queries

**Get All Completed Appointments:**
```sql
SELECT * FROM appointments 
WHERE status = 'Completed' OR (app_date < CURDATE() AND status = 'Upcoming')
ORDER BY app_date DESC;
```

**Get Medical Reports for Patient:**
```sql
SELECT * FROM medical_reports 
WHERE patient_id = 'PAT_001'
ORDER BY created_at DESC;
```

**Get Payment History:**
```sql
SELECT * FROM appointment_payments 
WHERE patient_id = 'PAT_001'
ORDER BY created_at DESC;
```

### Useful Commands

**Check MySQL Connection:**
```bash
mysql -u root -p -h localhost
```

**View Error Logs (XAMPP):**
```bash
tail -f C:\xampp\apache\logs\error.log
```

**Backup Database:**
```bash
mysqldump -u root -p hospital > backup.sql
```

**Restore Database:**
```bash
mysql -u root -p hospital < backup.sql
```

---

## Production Checklist

- [ ] Update `.env` with production payment gateway credentials
- [ ] Update ESEWA_RETURN_URL to production domain
- [ ] Update KHALTI_RETURN_URL to production domain
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure email notifications
- [ ] Test all payment methods end-to-end
- [ ] Verify appointment creation workflow
- [ ] Test medical report generation and PDF
- [ ] Review error logs for issues
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Test all admin features
- [ ] Performance test with realistic data
- [ ] Security audit (SQL injection, XSS, etc.)
- [ ] Load testing for concurrent users
- [ ] Documentation review and updates

---

**Last Updated:** May 20, 2026  
**Version:** 2.0  
**Status:** Production Ready Application ✅✅ ✅✅
