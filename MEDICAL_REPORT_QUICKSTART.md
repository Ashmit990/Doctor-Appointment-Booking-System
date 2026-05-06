# Medical Report System - Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Create Database Table
```bash
# Run this command in your terminal
mysql -u root -p hospital < database/medical_reports_migration.sql
```

### Step 2: Verify Installation
- ✅ Check `api/doctor/medical_report.php` exists
- ✅ Check `api/doctor/generate_medical_report_pdf.php` exists
- ✅ Check `pages/doctor/schedules.html` has jsPDF CDN
- ✅ Check `pages/patient/dashboard.html` has medical report viewer

### Step 3: Test the Feature
1. **As Doctor:**
   - Complete an appointment (mark as "Completed")
   - Click "Generate Medical Report" button
   - Fill form and save
   - Download PDF

2. **As Patient:**
   - View completed appointments
   - Click "View Report" button
   - View and download report

---

## 🚀 Usage

### For Doctors
```
Schedules Page → Complete Appointment → "Generate Medical Report" Button → Fill Form → Save → Download PDF
```

### For Patients
```
Dashboard → Completed Appointments → "View Report" Button → View Details → Download PDF
```

---

## 📋 Form Fields

**Doctor Report Form:**
- Symptoms* (required) - Patient's reported symptoms
- Diagnosis* (required) - Medical diagnosis
- Blood Pressure (optional) - Format: 120/80
- Weight (optional) - In kg
- Medicines - Name, Dosage, Frequency
- Additional Notes (optional)

---

## 📊 Database Schema

```sql
medical_reports (
  report_id - Auto increment ID
  appointment_id - Foreign key to appointments
  patient_id - Foreign key to users
  doctor_id - Foreign key to users
  symptoms - Text
  diagnosis - Text
  blood_pressure - String
  weight - Decimal
  prescribed_medicines - JSON array
  additional_notes - Text
  created_at - Timestamp
  updated_at - Timestamp
)
```

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `api/doctor/medical_report.php` | POST | Save/update report |
| `api/doctor/medical_report.php?apt_id=X` | GET | Retrieve report |
| `api/doctor/generate_medical_report_pdf.php?apt_id=X` | GET | Get PDF data |

---

## 🎨 Components Added

**Files Modified:**
- ✅ `pages/doctor/schedules.html` - Added modal + jsPDF CDN
- ✅ `pages/doctor/schedules.js` - Added functions + button logic
- ✅ `pages/patient/dashboard.html` - Added viewer + scripts
- ✅ `pages/patient/dashboard.js` - Added button + event listener

**Files Created:**
- ✅ `api/doctor/medical_report.php` - Core API
- ✅ `api/doctor/generate_medical_report_pdf.php` - PDF API
- ✅ `pages/patient/medical_report_pdf_generator.js` - PDF util
- ✅ `database/medical_reports_migration.sql` - Schema

---

## ✅ Verification Checklist

After installation, verify:
- [ ] Database table created successfully
- [ ] Doctor can open report form for completed appointments
- [ ] All form fields work correctly
- [ ] Medicines can be added/removed
- [ ] Report saves without errors
- [ ] Patient can see "View Report" button
- [ ] Report viewer displays all information
- [ ] PDF downloads successfully
- [ ] PDF has correct formatting
- [ ] No console errors in browser

---

## 🔒 Security

- Only doctors can create reports for their appointments
- Only patients can view their own reports
- All API calls require authentication
- Database constraints prevent duplicate reports
- Automatic timestamp tracking

---

## 📞 Need Help?

1. **Check logs:** Browser console (F12) → Console tab
2. **Test API:** Use browser Network tab to verify API calls
3. **Database:** Use phpMyAdmin to check medical_reports table
4. **Documentation:** See MEDICAL_REPORT_SETUP.md for detailed guide

---

## 📄 Files Reference

```
Doctor-Appointment-Booking-System/
├── api/doctor/
│   ├── medical_report.php ⭐
│   └── generate_medical_report_pdf.php ⭐
├── pages/
│   ├── doctor/schedules.html ⭐ (UPDATED)
│   ├── doctor/schedules.js ⭐ (UPDATED)
│   ├── patient/dashboard.html ⭐ (UPDATED)
│   ├── patient/dashboard.js ⭐ (UPDATED)
│   └── patient/medical_report_pdf_generator.js ⭐
└── database/
    └── medical_reports_migration.sql ⭐
```

⭐ = New or Updated

---

## 🎯 Key Features at a Glance

✅ Generate professional medical reports  
✅ Store structured medical data in database  
✅ Download reports as formatted PDFs  
✅ Secure patient access to reports  
✅ Multiple medicine prescriptions  
✅ Vital signs tracking (BP, Weight)  
✅ Responsive design for all devices  
✅ Hospital branding in PDFs  

---

**Ready to use!** Start generating and viewing medical reports now. 🏥📋✅
