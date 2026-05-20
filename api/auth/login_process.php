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

    if (preg_match('/\s/', $password)) {
        echo json_encode(['status' => 'error', 'message' => 'Password cannot contain spaces.']);
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

        $is_valid = password_verify($password, $user['password_hash']);

        if ($is_valid) {
            // Check if doctor is available
            if ($user['role'] === 'Doctor') {
                $check_avail = $conn->prepare("SELECT is_available FROM doctor_profiles WHERE user_id = ?");
                if ($check_avail) {
                    $check_avail->bind_param("s", $user['user_id']);
                    $check_avail->execute();
                    $avail_res = $check_avail->get_result()->fetch_assoc();
                    $check_avail->close();
                    if ($avail_res && isset($avail_res['is_available']) && (int)$avail_res['is_available'] === 0) {
                        echo json_encode(['status' => 'error', 'message' => 'Your account is currently set to unavailable. Please contact the administrator to log in.']);
                        exit;
                    }
                }
            }

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