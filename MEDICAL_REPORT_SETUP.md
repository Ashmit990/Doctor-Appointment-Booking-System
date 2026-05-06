# Medical Report Generation System - Setup Guide

## Overview
This document provides step-by-step instructions to implement the Medical Report Generation feature for the Doctor-Appointment-Booking-System.

## Prerequisites
- PHP 8.1+
- MySQL/MariaDB
- jsPDF Library (already included via CDN)

## Installation Steps

### 1. **Create Medical Reports Table**
Execute the SQL migration script in your MySQL database:

```bash
mysql -u root -p hospital < database/medical_reports_migration.sql
```

Or manually execute in phpMyAdmin:
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

### 2. **Backend API Endpoints**
The following new PHP files have been created:

#### a. `api/doctor/medical_report.php`
- **POST**: Save/update medical report for an appointment
- **GET**: Retrieve medical report for an appointment
- Access: Doctors can save, patients can view their own

#### b. `api/doctor/generate_medical_report_pdf.php`
- **GET**: Fetch formatted data for PDF generation
- Returns hospital info, patient details, doctor info, and report content
- Requires `appointment_id` parameter

### 3. **Frontend Components**

#### Doctor's Schedule Page (`pages/doctor/schedules.html`)
- Medical Report Modal HTML embedded
- jsPDF library CDN included
- PDF generator script linked

#### Doctor's Schedule JavaScript (`pages/doctor/schedules.js`)
- `openMedicalReportModal(appointmentData)` - Opens the report form
- `saveMedicalReport()` - Saves report to database
- `generateReportForCurrentAppointment()` - Triggers report generation
- `addMedicineField()` - Dynamically add medicine fields
- Button visibility logic for completed appointments

#### Patient Medical Report Viewer (`pages/patient/medical_report_viewer.html`)
- Modal to view medical reports
- `openPatientMedicalReportModal(appointmentId)` - Open viewer
- `loadPatientMedicalReport(appointmentId)` - Fetch and display
- `downloadMedicalReport(appointmentId)` - Generate and download PDF

#### PDF Generator Utility (`pages/patient/medical_report_pdf_generator.js`)
- `generateMedicalReportPDF(appointmentId)` - Main PDF generation function
- Professional PDF layout with hospital header
- Includes patient info, doctor details, appointment info, and medical findings

### 4. **Integration with Patient Dashboard**

#### Update `pages/patient/dashboard.html`
Add the medical report viewer modal to the page:
```html
<!-- Include before closing </body> -->
<div id="medical-report-modal-container"></div>
```

#### Update `pages/patient/dashboard.js`
Add button for completed appointments:
```javascript
${
  item.status_key === "completed"
    ? `<button type="button" data-view-report="${item.appointment_id}" class="view-report-btn w-full px-3 py-2 rounded-lg border border-[#007E85] bg-[#007E85] text-white hover:bg-[#006270] text-xs font-medium transition whitespace-nowrap text-center flex items-center justify-center gap-1">
        <i data-lucide="file-pdf" class="w-3 h-3"></i>
        View Report
      </button>`
    : ""
}
```

Add event listener:
```javascript
document.querySelectorAll(".view-report-btn").forEach((button) => {
  button.addEventListener("click", () => {
    openPatientMedicalReportModal(Number(button.dataset.viewReport));
  });
});
```

### 5. **File Structure**

```
Doctor-Appointment-Booking-System/
├── api/
│   └── doctor/
│       ├── medical_report.php (NEW)
│       └── generate_medical_report_pdf.php (NEW)
├── database/
│   └── medical_reports_migration.sql (NEW)
├── pages/
│   ├── doctor/
│   │   ├── schedules.html (UPDATED - Added modal)
│   │   ├── schedules.js (UPDATED - Added functions)
│   │   └── medical_report_modal.html (NEW)
│   └── patient/
│       ├── dashboard.html (UPDATE REQUIRED)
│       ├── dashboard.js (UPDATE REQUIRED)
│       ├── medical_report_viewer.html (NEW)
│       └── medical_report_pdf_generator.js (NEW)
```

## Features

### For Doctors:
✅ Fill medical reports during consultation for completed appointments
✅ Add symptoms, diagnosis, vital signs (BP/Weight)
✅ Prescribe multiple medicines with dosage and frequency
✅ Add additional notes
✅ Save reports to database
✅ Download reports as professional PDF

### For Patients:
✅ View medical reports for completed appointments
✅ See doctor's findings and prescriptions
✅ Download report as PDF for records
✅ Secure access (only their own reports)

## Usage

### Doctor Workflow:
1. Navigate to Doctor's Schedule page
2. Complete a consultation for an appointment
3. Click "Complete Consultation"
4. If status is "Completed", "Generate Medical Report" button appears
5. Click button to open the report form
6. Fill in symptoms, diagnosis, vital signs, and medicines
7. Click "Save Report"
8. Report is saved to database

### Patient Workflow:
1. Navigate to Patient Dashboard
2. View list of completed appointments
3. For completed appointments, "View Report" button is available
4. Click to open report viewer
5. View all medical findings
6. Click "Download PDF" to save a copy

## Security

- ✅ Doctors can only save reports for their own appointments
- ✅ Patients can only view their own reports
- ✅ Reports linked to specific appointments
- ✅ Unique constraint prevents duplicate reports per appointment
- ✅ Automatic timestamp tracking (created/updated)

## PDF Features

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

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- Requires modern JavaScript ES6+ support

## Troubleshooting

### Report not saving:
- Check that appointment status is "Completed"
- Verify database connection
- Check browser console for errors

### PDF not generating:
- Ensure jsPDF library is loaded (check network tab)
- Check that appointment_id is correct
- Verify backend API is accessible

### Report not loading for patient:
- Confirm appointment is marked as "Completed"
- Verify report was saved successfully
- Check session credentials

## Future Enhancements

- [ ] Add digital signature for doctors
- [ ] Email reports to patients automatically
- [ ] Add report templates
- [ ] Add medical history comparison
- [ ] Add follow-up reminders based on reports
- [ ] Add analytics dashboard

