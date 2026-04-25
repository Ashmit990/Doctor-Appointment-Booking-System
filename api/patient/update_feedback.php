<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$apt_id  = isset($input['appointment_id']) ? (int) $input['appointment_id'] : 0;
$rating  = isset($input['rating'])         ? (int) $input['rating']         : 0;
$feedback = trim($input['feedback'] ?? '');

if ($apt_id < 1 || $rating < 1 || $rating > 5) {
    echo json_encode(['status' => 'error', 'message' => 'Valid appointment_id and 1-5 rating required']);
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    $stmt = $conn->prepare("SELECT status, rating FROM appointments WHERE appointment_id = ? AND patient_id = ? FOR UPDATE");
    $stmt->bind_param("is", $apt_id, $patient_id);
    $stmt->execute();
    $apt = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$apt) {
        throw new Exception('Appointment not found or unauthorized');
    }
    if ($apt['status'] !== 'Completed') {
        throw new Exception('Only completed appointments can be rated');
    }

    $up = $conn->prepare("UPDATE appointments SET rating = ?, feedback = ? WHERE appointment_id = ? AND patient_id = ?");
    $up->bind_param("isis", $rating, $feedback, $apt_id, $patient_id);
    $up->execute();
    $up->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Feedback updated successfully']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
