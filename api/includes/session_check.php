<?php
/**
 * Session Verification Script
 * Include this at the top of all protected pages to ensure user is authenticated
 * Prevents access to restricted areas after logout
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user_id exists in session
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    // Session is invalid or expired - redirect to login
    session_destroy();
    header("Location: /Doctor-Appointment-Booking-System/pages/auth/login.html");
    exit();
}

// Optional: Validate user role if needed (additional security layer)
// Uncomment and modify based on your needs:
// $allowed_roles = ['patient', 'doctor', 'admin'];
// if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $allowed_roles)) {
//     session_destroy();
//     header("Location: /Doctor-Appointment-Booking-System/pages/auth/login.html");
//     exit();
// }
?>
