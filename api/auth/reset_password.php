<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

if (empty($_SESSION['otp_email']) || empty($_SESSION['otp_verified'])) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please restart the process.']);
    exit;
}

$email    = $_SESSION['otp_email'];
$password = $_POST['password']         ?? '';
$confirm  = $_POST['confirm_password'] ?? '';

if (empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Password cannot be empty.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

// Update password in users table
$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->bind_param("ss", $password, $email);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    $stmt->close();
    echo json_encode(['success' => false, 'message' => 'Failed to update password. Please try again.']);
    exit;
}
$stmt->close();

// Mark all OTPs for this email as used
$stmt = $conn->prepare("UPDATE otp_tokens SET used = 1 WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->close();

// Clear session state
unset($_SESSION['otp_email'], $_SESSION['otp_verified']);

echo json_encode(['success' => true, 'message' => 'Password reset successfully!']);
