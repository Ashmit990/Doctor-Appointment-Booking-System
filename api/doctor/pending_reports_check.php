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
    // Get completed appointments WITHOUT generated reports
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.app_date,
            a.app_time,
            a.patient_id,
            a.reason_for_visit,
            u.full_name as patient_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        WHERE a.doctor_id = ? 
        AND a.status = 'Completed'
        AND a.appointment_id NOT IN (
            SELECT appointment_id FROM medical_reports WHERE appointment_id IS NOT NULL
        )
        ORDER BY a.app_date DESC, a.app_time DESC
        LIMIT 1
    ");
    
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $appointment = $result->fetch_assoc();
        echo json_encode([
            'status' => 'success',
            'has_pending_reports' => true,
            'appointment' => $appointment
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'has_pending_reports' => false,
            'appointment' => null
        ]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
