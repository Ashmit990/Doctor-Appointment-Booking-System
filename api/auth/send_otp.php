<?php
session_start();
require_once '../config/db.php';
require_once '../config/mail_config.php';
require_once '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$email = trim($_POST['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

// Check email exists in users table
$stmt = $conn->prepare("SELECT user_id, full_name FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No account found with this email address.']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Invalidate any existing unused OTPs for this email
$stmt = $conn->prepare("UPDATE otp_tokens SET used = 1 WHERE email = ? AND used = 0");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->close();

// Generate 6-digit OTP and store in DB (MySQL computes expiry to avoid timezone mismatch)
$otp = sprintf('%06d', random_int(100000, 999999));

$stmt = $conn->prepare("INSERT INTO otp_tokens (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))");
$stmt->bind_param("ss", $email, $otp);
$stmt->execute();
$stmt->close();

// Send OTP email via PHPMailer
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($email, $user['full_name']);

    $mail->isHTML(true);
    $mail->Subject = 'Your Password Reset OTP - Healthcare';
    $mail->Body    = "
    <div style='font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;'>
        <div style='text-align:center; margin-bottom: 24px;'>
            <h1 style='color: #007E85; margin: 0; font-size: 26px;'>Healthcare</h1>
            <p style='color: #6b7280; margin: 4px 0 0;'>Password Reset Request</p>
        </div>
        <div style='background: #fff; border-radius: 10px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.07);'>
            <p style='color: #374151; font-size: 15px; margin: 0 0 16px;'>Hello <strong>{$user['full_name']}</strong>,</p>
            <p style='color: #374151; font-size: 15px; margin: 0 0 24px;'>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style='background: #f0fdfa; border: 2px dashed #007E85; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;'>
                <span style='font-size: 40px; font-weight: 900; letter-spacing: 14px; color: #007E85; font-family: monospace;'>{$otp}</span>
            </div>
            <p style='color: #9ca3af; font-size: 13px; margin: 0;'>If you did not request this, please ignore this email. Your password will not change.</p>
        </div>
    </div>";
    $mail->AltBody = "Your OTP for password reset is: {$otp}. It expires in 10 minutes.";

    $mail->send();

    $_SESSION['otp_email'] = $email;
    unset($_SESSION['otp_verified']);

    echo json_encode(['success' => true, 'message' => 'OTP sent to your email address.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please check mail configuration.']);
}
