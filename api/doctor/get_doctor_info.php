<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'No session found', 'debug' => 'Not logged in']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("
        SELECT u.full_name, u.email, dp.specialization, dp.consultation_fee, dp.bio 
        FROM users u 
        LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id 
        WHERE u.user_id = ? AND u.role = 'Doctor'
    ");
    
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Prepare failed', 'debug' => $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    $stmt->close();
    
    if ($profile) {
        echo json_encode(['status' => 'success', 'data' => $profile]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Doctor profile not found', 'debug' => 'Query returned no rows']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'debug' => 'Exception caught']);
}

$conn->close();
?>
