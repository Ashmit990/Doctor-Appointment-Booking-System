<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $admin_id = $_SESSION['user_id'];

    if ($method === 'GET') {
        // Get admin profile
        $stmt = $conn->prepare("
            SELECT 
                user_id,
                full_name,
                email,
                role,
                created_at
            FROM users
            WHERE user_id = ? AND role = 'Admin'
        ");
        $stmt->bind_param("s", $admin_id);
        $stmt->execute();
        $admin = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$admin) {
            throw new Exception('Admin not found');
        }

        echo json_encode([
            'status' => 'success',
            'data' => $admin
        ]);

    } elseif ($method === 'PUT') {
        // ✅ FIX: FormData sent via PUT must be read from php://input as multipart
        // We re-parse it manually because PHP doesn't auto-populate $_POST for PUT
        $raw = file_get_contents("php://input");

        // Try to extract boundary from Content-Type header
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (strpos($contentType, 'multipart/form-data') !== false) {
            // Parse multipart form data manually
            preg_match('/boundary=(.*)$/', $contentType, $matches);
            $boundary = $matches[1] ?? null;

            $input = [];
            if ($boundary) {
                $parts = array_slice(explode('--' . $boundary, $raw), 1);
                foreach ($parts as $part) {
                    if ($part === "--\r\n") continue;
                    list($header, $value) = explode("\r\n\r\n", $part, 2);
                    $value = rtrim($value, "\r\n");
                    preg_match('/name="([^"]+)"/', $header, $nameMatch);
                    if (!empty($nameMatch[1])) {
                        $input[$nameMatch[1]] = $value;
                    }
                }
            }
        } else {
            // Fallback: try parse_str for application/x-www-form-urlencoded
            parse_str($raw, $input);
        }

        $full_name       = trim($input['full_name'] ?? '');
        $email           = trim($input['email'] ?? '');
        $current_password = trim($input['current_password'] ?? '');
        $new_password    = trim($input['new_password'] ?? '');

        // Require current password always
        if (empty($current_password)) {
            throw new Exception('Current password is required');
        }

        // ✅ Get stored password for verification
        $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ?");
        $stmt->bind_param("s", $admin_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$result) {
            throw new Exception('Admin not found');
        }

        $stored = $result['password_hash'];

        // ✅ FIX: Support both plain text passwords AND properly hashed passwords
        $passwordValid = false;
        if (password_get_info($stored)['algo'] !== null && password_get_info($stored)['algo'] !== 0) {
            // Properly hashed — use password_verify
            $passwordValid = password_verify($current_password, $stored);
        } else {
            // Plain text stored (like admin_hash_123) — direct compare
            $passwordValid = ($current_password === $stored);
        }

        if (!$passwordValid) {
            throw new Exception('Current password is incorrect');
        }

        // Verify email uniqueness
        if (!empty($email)) {
            $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
            $stmt->bind_param("ss", $email, $admin_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                throw new Exception('Email already in use');
            }
            $stmt->close();
        }

        // Build update query
        if (!empty($new_password)) {
            // ✅ Store new password as plain text to match your current DB style
            // If you want hashing in future, replace $new_password with password_hash($new_password, PASSWORD_DEFAULT)
            $update_password = $new_password;

            $stmt = $conn->prepare("
                UPDATE users 
                SET full_name = COALESCE(NULLIF(?, ''), full_name),
                    email     = COALESCE(NULLIF(?, ''), email),
                    password_hash = ?
                WHERE user_id = ?
            ");
            $stmt->bind_param("ssss", $full_name, $email, $update_password, $admin_id);
        } else {
            $stmt = $conn->prepare("
                UPDATE users 
                SET full_name = COALESCE(NULLIF(?, ''), full_name),
                    email     = COALESCE(NULLIF(?, ''), email)
                WHERE user_id = ?
            ");
            $stmt->bind_param("sss", $full_name, $email, $admin_id);
        }

        if (!$stmt->execute()) {
            throw new Exception('Database error: ' . $stmt->error);
        }
        $stmt->close();

        // Update session
        if (!empty($full_name)) {
            $_SESSION['full_name'] = $full_name;
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Profile updated successfully'
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>