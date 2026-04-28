<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Check if user is logged in and is a doctor
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Doctor') {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

// Get ALL availability slots for this doctor (not just today)
$stmt = $conn->prepare("SELECT avail_id, available_date, start_time, end_time, status FROM doctor_availability WHERE doctor_id = ? ORDER BY available_date DESC, start_time ASC LIMIT 30");
$stmt->bind_param("s", $doctor_id);
$stmt->execute();
$result = $stmt->get_result();
$availability = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Get user schedule setup status
$user_stmt = $conn->prepare("SELECT schedule_setup_completed FROM users WHERE user_id = ?");
$user_stmt->bind_param("s", $doctor_id);
$user_stmt->execute();
$user_result = $user_stmt->get_result();
$user = $user_result->fetch_assoc();
$user_stmt->close();

echo json_encode([
    'status' => 'success',
    'doctor_id' => $doctor_id,
    'schedule_setup_completed' => (bool)($user['schedule_setup_completed'] ?? false),
    'total_slots' => count($availability),
    'slots' => $availability
]);
?>
