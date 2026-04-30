<?php
session_start();
require_once '../config/db.php';
require_once __DIR__ . '/../includes/appointment_reminder_sync.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];
$today = date('Y-m-d');

try {
    // 1. Doctor Profile Info
    $stmt = $conn->prepare("
        SELECT u.full_name, u.email, dp.specialization, dp.bio,
            (SELECT estimated_cost FROM treatment_categories
             WHERE name = CASE
                 WHEN LOWER(dp.specialization) LIKE '%cardio%'  THEN 'Cardiology'
                 WHEN LOWER(dp.specialization) LIKE '%ortho%'   THEN 'Orthopedics'
                 WHEN LOWER(dp.specialization) LIKE '%derma%'   THEN 'Dermatology'
                 WHEN LOWER(dp.specialization) LIKE '%neuro%'   THEN 'Neurology'
                 WHEN LOWER(dp.specialization) LIKE '%ediatri%' THEN 'Pediatrics'
                 WHEN LOWER(dp.specialization) LIKE '%gynec%'   THEN 'Gynecology'
                 WHEN LOWER(dp.specialization) LIKE '%ophthal%' THEN 'Ophthalmology'
                 WHEN LOWER(dp.specialization) LIKE '%physio%'  THEN 'Physiotherapy'
                 WHEN LOWER(dp.specialization) LIKE '%dent%'    THEN 'Dentistry'
                 ELSE 'General Consultation'
             END LIMIT 1) AS consultation_fee 
        FROM users u 
        LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id 
        WHERE u.user_id = ?
    ");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // 2. Today's Appointments Count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND app_date = ? AND status != 'Cancelled'");
    $stmt->bind_param("ss", $doctor_id, $today);
    $stmt->execute();
    $today_appts = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();

    // 3. Total Upcoming Appointments
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Upcoming'");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $upcoming = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();

    // 4. Total Completed Appointments
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Completed'");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $completed = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();

    // 5. Total Earnings
    $stmt = $conn->prepare("SELECT SUM(amount) as total FROM earnings WHERE doctor_id = ?");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $earnings_data = $stmt->get_result()->fetch_assoc();
    $total_earnings = $earnings_data['total'] ?? 0;
    $stmt->close();

    sync_doctor_appointment_reminders($conn, $doctor_id);

    // 6. Unread Notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $notifications = $stmt->get_result()->fetch_assoc()['count'];
    $stmt->close();

    // 7. Today's Appointment Details  
    $stmt = $conn->prepare("
        SELECT a.appointment_id, a.app_time, a.room_num, a.reason_for_visit, a.status,
               u.full_name, pp.blood_group, pp.contact_number
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
        WHERE a.doctor_id = ? AND a.app_date = ? AND a.status != 'Cancelled'
        ORDER BY a.app_time ASC
    ");
    $stmt->bind_param("ss", $doctor_id, $today);
    $stmt->execute();
    $today_appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 8. Upcoming Appointments (next 7 days)
    $next_week = date('Y-m-d', strtotime('+7 days'));
    $stmt = $conn->prepare("
        SELECT a.appointment_id, a.app_date, a.app_time, a.status,
               u.full_name, pp.blood_group
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
        WHERE a.doctor_id = ? AND a.app_date BETWEEN ? AND ? AND a.status = 'Upcoming'
        ORDER BY a.app_date ASC, a.app_time ASC
        LIMIT 10
    ");
    $stmt->bind_param("sss", $doctor_id, $today, $next_week);
    $stmt->execute();
    $upcoming_appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 9. Available Slots Today
    // Auto-close past slots first
    $current_time = date('H:i:s');
    $close_stmt = $conn->prepare("
        UPDATE doctor_availability
        SET status = 'Closed'
        WHERE doctor_id = ? AND available_date = ? AND status = 'Available' AND start_time <= ?
    ");
    $close_stmt->bind_param("sss", $doctor_id, $today, $current_time);
    $close_stmt->execute();
    $close_stmt->close();

    $stmt = $conn->prepare("
        SELECT avail_id, start_time, end_time, status
        FROM doctor_availability
        WHERE doctor_id = ? AND available_date = ?
        ORDER BY start_time ASC
    ");
    $stmt->bind_param("ss", $doctor_id, $today);
    $stmt->execute();
    $availability = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'profile' => $profile,
            'stats' => [
                'today_appointments' => $today_appts,
                'upcoming_total' => $upcoming,
                'completed_total' => $completed,
                'total_earnings' => floatval($total_earnings),
                'unread_notifications' => $notifications
            ],
            'today_appointments' => $today_appointments,
            'upcoming_appointments' => $upcoming_appointments,
            'availability_today' => $availability
        ]
    ]);

    $conn->close();

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
?>
