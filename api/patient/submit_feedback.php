<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$apt_id = isset($input['appointment_id']) ? (int) $input['appointment_id'] : 0;
$rating = isset($input['rating']) ? (int) $input['rating'] : 0;
$feedback = trim($input['feedback'] ?? '');

if ($apt_id < 1 || $rating < 1 || $rating > 5) {
    echo json_encode(['status' => 'error', 'message' => 'Valid appointment_id and 1-5 rating required']);
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    // Verify appointment
    $stmt = $conn->prepare("SELECT doctor_id, status, rating FROM appointments WHERE appointment_id = ? AND patient_id = ? FOR UPDATE");
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
    if ($apt['rating'] > 0) {
        throw new Exception('Feedback has already been submitted');
    }

    $doctor_id = $apt['doctor_id'];

    $up = $conn->prepare("UPDATE appointments SET rating = ?, feedback = ? WHERE appointment_id = ?");
    $up->bind_param("isi", $rating, $feedback, $apt_id);
    $up->execute();
    $up->close();

    // Fetch patient name
    $pn = $conn->prepare("SELECT full_name FROM users WHERE user_id = ?");
    $pn->bind_param("s", $patient_id);
    $pn->execute();
    $pn_res = $pn->get_result()->fetch_assoc();
    $pat_name = $pn_res ? $pn_res['full_name'] : 'A patient';
    $pn->close();

    $msg = "Patient {$pat_name} left a {$rating}-star review.";
    $n = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, 'New Feedback', ?, 0, NOW())");
    $n->bind_param("ss", $doctor_id, $msg);
    $n->execute();
    $n->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Feedback submitted successfully']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
