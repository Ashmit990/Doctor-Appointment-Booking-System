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
    // Get all completed appointments
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.patient_id,
            a.app_date,
            a.app_time,
            a.room_num,
            a.reason_for_visit,
            a.status,
            a.doctor_comments,
            a.prescribed_medicines,
            u.full_name as patient_name,
            pp.contact_number,
            pp.blood_group
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
        WHERE a.doctor_id = ? AND a.status = 'Completed'
        ORDER BY a.app_date DESC, a.app_time DESC
    ");
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Group by date for the calendar
    $completedDates = [];
    foreach ($appointments as $apt) {
        $completedDates[] = $apt['app_date'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $appointments,
        'dates' => array_unique($completedDates)
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
