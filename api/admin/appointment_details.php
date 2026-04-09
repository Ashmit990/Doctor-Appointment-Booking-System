<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $date = $_GET['date'] ?? null;

    if (!$date) {
        throw new Exception('Date parameter required');
    }

    // Get appointments for specific date
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.app_date,
            a.app_time,
            a.status,
            a.reason_for_visit,
            a.room_num,
            a.doctor_comments,
            u_patient.full_name as patient_name,
            u_patient.user_id as patient_id,
            u_doctor.full_name as doctor_name,
            u_doctor.user_id as doctor_id,
            dp.specialization
        FROM appointments a
        JOIN users u_patient ON a.patient_id = u_patient.user_id
        JOIN users u_doctor ON a.doctor_id = u_doctor.user_id
        LEFT JOIN doctor_profiles dp ON u_doctor.user_id = dp.user_id
        WHERE DATE(a.app_date) = ?
        ORDER BY a.app_time ASC
    ");
    $stmt->bind_param("s", $date);
    $stmt->execute();
    $appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => $appointments
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
