<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Please fill in all fields.']);
        exit;
    }

    $stmt = $conn->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if ($password === $user['password_hash']) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $user['role'];

            // FIX: Using paths relative to the project root
            $redirect = '';
            switch ($user['role']) {
                case 'Doctor':
                    $redirect = '/Dummy/pages/doctor/home.html';
                    break;
                case 'Patient':
                    $redirect = '/Dummy/pages/patient/homepage.html';
                    break;
                case 'Admin':
                    $redirect = '/Dummy/pages/admin/dashboard.html';
                    break;
                default:
                    $redirect = '/Dummy/index.html';
            }

            echo json_encode([
                'status' => 'success',
                'role' => $user['role'],
                'redirect' => $redirect
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found.']);
    }
    $stmt->close();
}
$conn->close();
?>