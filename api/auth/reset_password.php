<?php
session_start();
require_once '../config/db.php';
require_once '../includes/password_helper.php';

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

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

if (!preg_match('/[A-Z]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'Password must include an uppercase letter.']);
    exit;
}

if (!preg_match('/[0-9]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'Password must include a number.']);
    exit;
}

if (!preg_match('/[!@#$%^&*()\-_=+\[\]{};\':"\\\\|,.<>\/? ]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'Password must include a special character.']);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

// Update password in users table (bcrypt hash)
$password_hash = app_hash_password($password);
$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->bind_param("ss", $password_hash, $email);
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
