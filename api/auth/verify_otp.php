<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$email = $_SESSION['otp_email'] ?? '';
$otp   = trim($_POST['otp'] ?? '');

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please start over.']);
    exit;
}

if (empty($otp) || strlen($otp) !== 6) {
    echo json_encode(['success' => false, 'message' => 'Please enter the complete 6-digit OTP.']);
    exit;
}

$stmt = $conn->prepare(
    "SELECT id FROM otp_tokens
     WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1"
);
$stmt->bind_param("ss", $email, $otp);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP. Please try again.']);
    exit;
}

$_SESSION['otp_verified'] = true;
echo json_encode(['success' => true, 'message' => 'OTP verified successfully.']);
