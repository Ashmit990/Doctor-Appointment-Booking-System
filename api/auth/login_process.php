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
        echo json_encode(['status' => 'error', 'message' => 'Security token validation failed. Please try again.']);
        exit;
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Please fill in all fields.']);
        exit;
    }

    // Check for user in database
    // Note: The column name is 'password_hash' in this database
    $stmt = $conn->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email = ?");
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Database error.']);
        exit;
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password_hash'])) {
            $is_valid = true;
        } else if ($password === $user['password_hash']) {
            $is_valid = true;
        }

        if ($is_valid) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $user['role'];

            $redirect = '';
            switch ($user['role']) {
                case 'Doctor':
                    $redirect = '/Doctor-Appointment-Booking-System/pages/doctor/home.html';
                    break;
                case 'Patient':
                    $redirect = '/Doctor-Appointment-Booking-System/pages/patient/homepage.html';
                    break;
                case 'Admin':
                    $redirect = '/Doctor-Appointment-Booking-System/pages/admin/dashboard.html';
                    break;
                default:
                    $redirect = '/Doctor-Appointment-Booking-System/index.html';
            }

            echo json_encode([
                'status' => 'success',
                'role' => $user['role'],
                'redirect' => $redirect
            ]);
            exit;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
            exit;
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
        exit;
    }
    $stmt->close();
}
$conn->close();