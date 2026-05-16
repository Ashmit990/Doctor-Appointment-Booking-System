<?php
session_start();
require_once '../config/db.php';
require_once '../includes/csrf_protection.php';

header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF Token Validation
    if (!CSRFProtection::validateToken()) {
        echo json_encode(['success' => false, 'message' => 'Security token validation failed.']);
        exit;
    }

    $full_name = trim($_POST['full_name'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $phone = trim($_POST['phone'] ?? '');
    $age = intval($_POST['age'] ?? 0);
    $role = $_POST['role'] ?? 'Patient';
    $password = $_POST['password'] ?? '';

    if (empty($full_name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Required fields are missing.']);
        exit;
    }

    // Check if email exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit;
    }
    $stmt->close();

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    if ($role === 'Patient') {
        $user_id = 'PAT_' . strtoupper(substr(uniqid(), -4));
        
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'Patient')");
            $stmt->bind_param("ssss", $user_id, $full_name, $email, $password_hash);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare("INSERT INTO patient_profiles (user_id, contact_number, age) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $user_id, $phone, $age);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Registration successful!']);
            exit;
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
            exit;
        }
    } else if ($role === 'Medical Professional' || $role === 'Doctor') {
        $medical_id = $_POST['medical_id'] ?? '';
        $specialization = $_POST['specialization'] ?? '';
        $bio = $_POST['bio'] ?? '';

        $stmt = $conn->prepare("INSERT INTO doctor_approvals (full_name, email, password_hash, specialization, bio, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
        $stmt->bind_param("sssss", $full_name, $email, $password_hash, $specialization, $bio);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Doctor registration submitted for approval.']);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed.']);
            exit;
        }
        $stmt->close();
    }
}
$conn->close();