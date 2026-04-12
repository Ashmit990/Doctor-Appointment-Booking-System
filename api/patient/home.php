<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../includes/appointment_reminder_sync.php';

$today = date('Y-m-d');

$stmt = $conn->prepare("SELECT COUNT(*) AS c FROM appointments WHERE patient_id = ?");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$total = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

$stmt = $conn->prepare("
    SELECT COUNT(*) AS c FROM appointments
    WHERE patient_id = ? AND app_date = ? AND status = 'Upcoming'
");
$stmt->bind_param("ss", $patient_id, $today);
$stmt->execute();
$today_bookings = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

$stmt = $conn->prepare("
    SELECT COUNT(*) AS c FROM appointments
    WHERE patient_id = ? AND status = 'Upcoming' AND app_date > ?
");
$stmt->bind_param("ss", $patient_id, $today);
$stmt->execute();
$upcoming_future = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

$stmt = $conn->prepare("
    SELECT COUNT(*) AS c FROM appointments
    WHERE patient_id = ? AND status = 'Upcoming' AND app_date >= ?
");
$stmt->bind_param("ss", $patient_id, $today);
$stmt->execute();
$upcoming_all = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

$stmt = $conn->prepare("
    SELECT COUNT(*) AS c FROM appointments
    WHERE patient_id = ? AND status = 'Completed'
");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$completed = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

$today_appt = null;
$stmt = $conn->prepare("
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.app_date, a.app_time, a.room_num,
           a.reason_for_visit, a.status, u.full_name AS doctor_name, dp.specialization
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.patient_id = ? AND a.app_date = ? AND a.status = 'Upcoming'
    ORDER BY a.app_time ASC
    LIMIT 1
");
$stmt->bind_param("ss", $patient_id, $today);
$stmt->execute();
$today_appt = $stmt->get_result()->fetch_assoc();
$stmt->close();

$next_appt = null;
$stmt = $conn->prepare("
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.app_date, a.app_time, a.room_num,
           a.reason_for_visit, a.status, u.full_name AS doctor_name, dp.specialization
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.patient_id = ? AND a.status = 'Upcoming'
      AND TIMESTAMP(a.app_date, a.app_time) >= NOW()
    ORDER BY a.app_date ASC, a.app_time ASC
    LIMIT 1
");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$next_appt = $stmt->get_result()->fetch_assoc();
$stmt->close();

sync_patient_appointment_reminders($conn, $patient_id);

$unread = 0;
$stmt = $conn->prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$unread = (int) ($stmt->get_result()->fetch_assoc()['c'] ?? 0);
$stmt->close();

echo json_encode([
    'status' => 'success',
    'data' => [
        'total_appointments' => $total,
        'today_bookings_count' => $today_bookings,
        'upcoming_count' => $upcoming_all,
        'completed_count' => $completed,
        'has_booking_today' => $today_bookings > 0,
        'today_appointment' => $today_appt,
        'next_appointment' => $next_appt,
        'unread_notifications' => $unread,
    ],
]);
$conn->close();
