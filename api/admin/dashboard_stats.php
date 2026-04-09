<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    // Get total patients
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Patient'");
    $stmt->execute();
    $patients = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get total doctors
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Doctor'");
    $stmt->execute();
    $doctors = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get total upcoming appointments
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'Upcoming'");
    $stmt->execute();
    $upcoming = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get total completed appointments
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM appointments WHERE status = 'Completed'");
    $stmt->execute();
    $completed = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get recent appointments (last 5)
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.app_date,
            a.app_time,
            a.status,
            a.reason_for_visit,
            u_patient.full_name as patient_name,
            u_doctor.full_name as doctor_name,
            dp.specialization
        FROM appointments a
        JOIN users u_patient ON a.patient_id = u_patient.user_id
        JOIN users u_doctor ON a.doctor_id = u_doctor.user_id
        LEFT JOIN doctor_profiles dp ON u_doctor.user_id = dp.user_id
        ORDER BY a.app_date DESC, a.app_time DESC
        LIMIT 5
    ");
    $stmt->execute();
    $recent_apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Get appointment dates for calendar
    $current_month = date('Y-m');
    $stmt = $conn->prepare("
        SELECT DISTINCT DAY(app_date) as day, status
        FROM appointments
        WHERE DATE_FORMAT(app_date, '%Y-%m') = ?
    ");
    $stmt->bind_param("s", $current_month);
    $stmt->execute();
    $appointment_dates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'total_patients' => $patients['total'],
            'total_doctors' => $doctors['total'],
            'total_upcoming' => $upcoming['total'],
            'total_completed' => $completed['total'],
            'recent_appointments' => $recent_apps,
            'appointment_dates' => $appointment_dates
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
