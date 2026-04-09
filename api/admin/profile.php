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
        // Update admin profile
        parse_str(file_get_contents("php://input"), $input);
        
        $full_name = $input['full_name'] ?? null;
        $email = $input['email'] ?? null;
        $current_password = $input['current_password'] ?? null;
        $new_password = $input['new_password'] ?? null;

        // Verify current password if changing password
        if ($new_password) {
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->bind_param("s", $admin_id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if ($result['password_hash'] !== $current_password) {
                throw new Exception('Current password is incorrect');
            }
        }

        // Verify email uniqueness if changing email
        if ($email) {
            $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
            $stmt->bind_param("ss", $email, $admin_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                throw new Exception('Email already in use');
            }
            $stmt->close();
        }

        // Update user info
        if ($full_name || $email) {
            $update_full_name = $full_name ?? null;
            $update_email = $email ?? null;
            $update_password = $new_password ?? null;

            if ($update_password) {
                $stmt = $conn->prepare("
                    UPDATE users 
                    SET full_name = COALESCE(?, full_name),
                        email = COALESCE(?, email),
                        password_hash = COALESCE(?, password_hash)
                    WHERE user_id = ?
                ");
                $stmt->bind_param("ssss", $update_full_name, $update_email, $update_password, $admin_id);
            } else {
                $stmt = $conn->prepare("
                    UPDATE users 
                    SET full_name = COALESCE(?, full_name),
                        email = COALESCE(?, email)
                    WHERE user_id = ?
                ");
                $stmt->bind_param("sss", $update_full_name, $update_email, $admin_id);
            }
            
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $stmt->close();

            // Update session
            if ($full_name) {
                $_SESSION['full_name'] = $full_name;
            }
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
