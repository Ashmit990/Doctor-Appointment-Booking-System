<?php
session_start();
require_once '../config/db.php';
require_once '../includes/csrf_protection.php';
require_once '../includes/password_helper.php';

header('Content-Type: application/json');

/**
 * Map DB role to canonical session role (trim / case-insensitive).
 */
function login_canonical_role(string $raw): ?string
{
    $t = trim($raw);
    $lower = strtolower($t);
    return match (true) {
        $lower === 'doctor' => 'Doctor',
        $lower === 'patient' => 'Patient',
        $lower === 'admin', $lower === 'administrator' => 'Admin',
        in_array($t, ['Doctor', 'Patient', 'Admin'], true) => $t,
        default => null,
    };
}

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

    $stmt = $conn->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if (app_verify_password($password, $user['password_hash'])) {
            if (!app_password_is_hashed($user['password_hash'])) {
                $newHash = app_hash_password($password);
                $up = $conn->prepare('UPDATE users SET password_hash = ? WHERE user_id = ?');
                if ($up) {
                    $up->bind_param('ss', $newHash, $user['user_id']);
                    $up->execute();
                    $up->close();
                }
            }

            $role = login_canonical_role((string) ($user['role'] ?? ''));
            if ($role === null) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Your account has an invalid role. Please contact support.',
                ]);
                $stmt->close();
                $conn->close();
                exit;
            }

            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $role;

            // Paths relative to pages/auth/login.html so they work on any host/folder name
            $redirect = match ($role) {
                'Doctor' => '../doctor/home.html',
                'Patient' => '../patient/homepage.html',
                'Admin' => '../admin/dashboard.html',
                default => '../../index.html',
            };

            echo json_encode([
                'status' => 'success',
                'role' => $role,
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