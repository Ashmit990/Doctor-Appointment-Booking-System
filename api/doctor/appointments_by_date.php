<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

if (!isset($_GET['date']) || empty($_GET['date'])) {
    echo json_encode(['status' => 'error', 'message' => 'Date parameter is required']);
    exit;
}

$doctor_id = $_SESSION['user_id'];
$appointment_date = $_GET['date'];

// Validate date format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $appointment_date)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid date format']);
    exit;
}

try {
    // Get all appointments for the doctor on the specified date
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id as apt_id,
            a.app_date,
            a.app_time as appointment_time,
            a.room_num as room_number,
            a.reason_for_visit,
            a.status,
            u.full_name as patient_name,
            pp.contact_number,
            pp.blood_group
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
        WHERE a.doctor_id = ? AND a.app_date = ? AND a.status != 'Cancelled'
        ORDER BY a.app_time ASC
    ");
    
    $stmt->bind_param("ss", $doctor_id, $appointment_date);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = $result->fetch_all(MYSQLI_ASSOC);
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
