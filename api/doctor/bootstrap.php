<?php
session_start();
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'Doctor') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

// Check if doctor is active/available
$check_avail = $conn->prepare("SELECT is_available FROM doctor_profiles WHERE user_id = ?");
if ($check_avail) {
    $check_avail->bind_param("s", $doctor_id);
    $check_avail->execute();
    $avail_res = $check_avail->get_result()->fetch_assoc();
    $check_avail->close();
    if ($avail_res && isset($avail_res['is_available']) && (int)$avail_res['is_available'] === 0) {
        session_destroy();
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Your account is set to unavailable. You have been logged out.']);
        exit;
    }
}

