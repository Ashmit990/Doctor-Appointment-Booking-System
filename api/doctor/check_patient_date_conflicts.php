<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Doctor') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$patient_id = trim($input['patient_id'] ?? '');
$check_date = trim($input['check_date'] ?? '');

if (empty($patient_id) || empty($check_date)) {
    echo json_encode(['status' => 'error', 'message' => 'Patient ID and date are required']);
    exit;
}

try {
    // Check if patient has ANY appointments (with any doctor) on that date
    $stmt = $conn->prepare("
        SELECT 
            appointment_id,
            doctor_id,
            app_time,
            status
        FROM appointments
        WHERE patient_id = ?
          AND app_date = ?
          AND status IN ('Upcoming', 'Pending', 'Completed')
        ORDER BY app_time ASC
    ");
    
    $stmt->bind_param("ss", $patient_id, $check_date);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = [];
    
    while ($row = $result->fetch_assoc()) {
        $appointments[] = $row;
    }
    
    $stmt->close();
    
    if (count($appointments) > 0) {
        // Patient has existing appointments on this date
        echo json_encode([
            'status' => 'conflict',
            'has_conflict' => true,
            'appointments' => $appointments,
            'message' => 'Patient already has ' . count($appointments) . ' appointment(s) on this date'
        ]);
    } else {
        // No conflicts
        echo json_encode([
            'status' => 'success',
            'has_conflict' => false,
            'appointments' => [],
            'message' => 'No appointments found on this date'
        ]);
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    $conn->close();
}
?>
