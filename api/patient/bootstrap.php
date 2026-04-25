<?php
try {
    session_start();
    require_once __DIR__ . '/../config/db.php';

    // Check if database connection was successful
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? "Connection object not created"));
    }

    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: user_id not set']);
        exit;
    }

    $role = $_SESSION['role'] ?? '';
    if ($role !== 'Patient') {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized: user is not a patient']);
        exit;
    }

    $patient_id = $_SESSION['user_id'];
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    error_log("Bootstrap error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
}
