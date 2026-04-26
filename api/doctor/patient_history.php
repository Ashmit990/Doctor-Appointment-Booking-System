<?php
require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json');

if (!isset($_GET['patient_id']) || empty($_GET['patient_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Patient ID is required']);
    $conn->close();
    exit;
}

$patient_id = $_GET['patient_id'];

try {
    // Fetch all COMPLETED appointments for the patient (ordered by date descending - most recent first)
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.app_date,
            a.app_time,
            a.reason_for_visit,
            a.doctor_comments,
            a.prescribed_medicines,
            a.doctor_notes,
            a.prescriptions,
            a.status,
            u.full_name as doctor_name,
            dp.specialization,
            a.created_at
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
        WHERE a.patient_id = ? AND a.status = 'Completed'
        ORDER BY a.app_date DESC, a.app_time DESC
    ");
    
    $stmt->bind_param("s", $patient_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $history = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => $history,
        'count' => count($history)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
