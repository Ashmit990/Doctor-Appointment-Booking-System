<?php
$dir = 'c:\\xampp\\htdocs\\Doctor-Appointment-Booking-System\\pages\\patient';

// HOMEPAGE
$f = "$dir\\homepage.html";
if (file_exists($f)) {
    $c = file_get_contents($f);
    $c = str_replace('<h3 id="todayBookingsCount" class="text-4xl font-bold">0</h3>', '<h3 id="todayBookingsCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="upcomingCount" class="text-4xl font-bold">0</h3>', '<h3 id="upcomingCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="completedCount" class="text-4xl font-bold">0</h3>', '<h3 id="completedCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('id="todayDoctorName">
                      Dr. Kim', 'id="todayDoctorName">
                      Loading...', $c);
    $c = str_replace('id="todayDoctorMeta">
                    Cardiologist • Heart Care', 'id="todayDoctorMeta">
                    Loading...', $c);
    $c = str_replace('id="todayBookingDate">
                        2026-03-25', 'id="todayBookingDate">
                        Loading...', $c);
    $c = str_replace('id="todayBookingTime">
                        10:30 AM', 'id="todayBookingTime">
                        Loading...', $c);
    $c = str_replace('id="todayBookingLocation">
                        Room 203', 'id="todayBookingLocation">
                        Loading...', $c);
    $c = str_replace('id="nextDoctorName">
                      Dr. Sarah Lee', 'id="nextDoctorName">
                      Loading...', $c);
    $c = str_replace('id="nextDoctorMeta">
                      Dermatologist • Skin Care', 'id="nextDoctorMeta">
                      Loading...', $c);
    $c = str_replace('id="nextBookingDate">
                      2026-03-27', 'id="nextBookingDate">
                      Loading...', $c);
    $c = str_replace('id="nextBookingTime">
                      02:00 PM', 'id="nextBookingTime">
                      Loading...', $c);
    $c = str_replace('id="nextBookingLocation">
                      Room 105', 'id="nextBookingLocation">
                      Loading...', $c);
    $c = str_replace('id="totalAppointments" class="font-semibold text-slate-800">
                    0', 'id="totalAppointments" class="font-semibold text-slate-800">
                    ...', $c);
    $c = str_replace('id="todayBookingStatus" class="font-semibold text-teal-600">
                    No', 'id="todayBookingStatus" class="font-semibold text-teal-600">
                    ...', $c);
    $c = str_replace('id="nextDoctorSummary" class="font-semibold text-slate-800">
                    -', 'id="nextDoctorSummary" class="font-semibold text-slate-800">
                    ...', $c);
    file_put_contents($f, $c);
}

// DASHBOARD
$f = "$dir\\dashboard.html";
if (file_exists($f)) {
    $c = file_get_contents($f);
    $c = str_replace('<h3 id="upcomingCount" class="text-4xl font-bold">0</h3>', '<h3 id="upcomingCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="completedCount" class="text-4xl font-bold">0</h3>', '<h3 id="completedCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="missedCount" class="text-4xl font-bold">0</h3>', '<h3 id="missedCount" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('id="totalCount" class="font-semibold text-slate-800">0</span>', 'id="totalCount" class="font-semibold text-slate-800">...</span>', $c);
    $c = str_replace('id="nextAppointment" class="font-semibold text-teal-600">-</span>', 'id="nextAppointment" class="font-semibold text-teal-600">...</span>', $c);
    file_put_contents($f, $c);
}

// PROFILE
$f = "$dir\\profile.html";
if (file_exists($f)) {
    $c = file_get_contents($f);
    $c = str_replace('<h3 id="profileCompletion" class="text-4xl font-bold">0%</h3>', '<h3 id="profileCompletion" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="verifiedFields" class="text-4xl font-bold">0</h3>', '<h3 id="verifiedFields" class="text-4xl font-bold">...</h3>', $c);
    $c = str_replace('<h3 id="lastUpdatedHero" class="text-2xl font-bold">Today</h3>', '<h3 id="lastUpdatedHero" class="text-2xl font-bold">...</h3>', $c);
    
    $c = preg_replace('/id="summaryName"[^>]*>\s*Sirjeet Dahal\s*<\/p>/sm', 'id="summaryName" class="font-semibold text-slate-800 text-base">Loading...<\/p>', $c);
    $c = preg_replace('/id="summaryEmail"[^>]*>\s*sirjeet@example\.com\s*<\/p>/sm', 'id="summaryEmail" class="text-sm text-slate-400">Loading...<\/p>', $c);
    
    $c = preg_replace('/id="lastUpdatedSide"[^>]*>\s*Today\s*<\/span>/sm', 'id="lastUpdatedSide" class="font-semibold text-teal-600">...<\/span>', $c);
    $c = preg_replace('/id="filledFields"[^>]*>\s*0\/9\s*<\/span>/sm', 'id="filledFields" class="font-semibold text-slate-800">...<\/span>', $c);
    
    file_put_contents($f, $c);
}

echo "Done\n";
?>
