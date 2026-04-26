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
    // Get all appointments for the doctor (upcoming and completed only)
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id as apt_id,
            a.patient_id,
            a.app_date,
            a.app_time as appointment_time,
            a.room_num as room_number,
            a.reason_for_visit,
            a.doctor_comments,
            a.prescribed_medicines,
            a.doctor_notes,
            a.prescriptions,
            a.feedback,
            a.status,
            u.full_name as patient_name,
            pp.contact_number,
            pp.blood_group
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
        WHERE a.doctor_id = ? AND a.status IN ('Upcoming', 'Completed')
        ORDER BY a.app_date DESC, a.app_time ASC
    ");
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => $appointments
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error fetching appointments: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
