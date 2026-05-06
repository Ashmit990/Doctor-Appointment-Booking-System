<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

try {
    $query = "
        SELECT 
            a.appointment_id,
            a.app_date,
            a.app_time,
            u.full_name as patient_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        WHERE a.doctor_id = ? 
        AND a.status = 'Completed'
        AND a.appointment_id NOT IN (SELECT appointment_id FROM medical_reports)
        ORDER BY a.app_date ASC, a.app_time ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $pending_reports = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    echo json_encode([
        'status' => 'success',
        'data' => $pending_reports
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
