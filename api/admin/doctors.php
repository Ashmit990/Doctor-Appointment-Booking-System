<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Debug logging
error_log('Session user_id: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET'));
error_log('Session role: ' . (isset($_SESSION['role']) ? $_SESSION['role'] : 'NOT SET'));

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized - Session: ' . json_encode($_SESSION)]);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Get all doctors
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        $doctor_id = $_GET['doctor_id'] ?? null;
        $status_filter = $_GET['status'] ?? 'all'; // all, approved, pending

        if ($doctor_id) {
            // Get specific doctor with details
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    dp.specialization,
                    dp.consultation_fee,
                    dp.bio,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id) as total_appointments,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id AND status = 'Completed') as completed_appointments
                FROM users u
                LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
                WHERE u.user_id = ? AND u.role = 'Doctor'
            ");
            $stmt->bind_param("s", $doctor_id);
            $stmt->execute();
            $doctor = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$doctor) {
                throw new Exception('Doctor not found');
            }

            echo json_encode([
                'status' => 'success',
                'data' => $doctor
            ]);

        } else {
            // Get all doctors list - we need to add an 'approved' field to track approval status
            // For now, we'll assume all registered doctors are approved
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.created_at,
                    dp.specialization,
                    dp.consultation_fee,
                    dp.bio,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id) as total_appointments,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id AND status = 'Completed') as completed_appointments
                FROM users u
                LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
                WHERE u.role = 'Doctor'
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $doctors = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            // Get total count
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Doctor'");
            $stmt->execute();
            $count_result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            echo json_encode([
                'status' => 'success',
                'data' => $doctors,
                'total' => $count_result['total'],
                'page' => $page,
                'pages' => ceil($count_result['total'] / $limit)
            ]);
        }

    } elseif ($method === 'PUT') {
        // Update doctor
        $input = json_decode(file_get_contents("php://input"), true);
        
        $doctor_id = $input['doctor_id'] ?? null;
        $full_name = $input['full_name'] ?? null;
        $email = $input['email'] ?? null;
        $specialization = $input['specialization'] ?? null;
        $consultation_fee = $input['consultation_fee'] ?? null;
        $bio = $input['bio'] ?? null;

        if (!$doctor_id) {
            throw new Exception('Doctor ID required');
        }

        $stmt = $conn->prepare("SELECT full_name, email FROM users WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $doctor_id);
        $stmt->execute();
        $before = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$before) {
            throw new Exception('Doctor not found');
        }

        // Update user info
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("sss", $full_name, $email, $doctor_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        $nameChanged = trim((string) $before['full_name']) !== trim((string) $full_name);
        $emailChanged = strcasecmp(trim((string) $before['email']), trim((string) $email)) !== 0;
        if ($nameChanged || $emailChanged) {
            $msg = 'An administrator updated your account. Your display name is now: '
                . $full_name . '. Your email is now: ' . $email . '.';
            $n = $conn->prepare(
                "INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, 'Account updated by admin', ?, 0, NOW())"
            );
            $n->bind_param("ss", $doctor_id, $msg);
            $n->execute();
            $n->close();
        }

        // Update doctor profile
        if ($specialization !== null || $consultation_fee !== null || $bio !== null) {
            $stmt = $conn->prepare("
                UPDATE doctor_profiles 
                SET specialization = COALESCE(?, specialization),
                    consultation_fee = COALESCE(?, consultation_fee),
                    bio = COALESCE(?, bio)
                WHERE user_id = ?
            ");
            $stmt->bind_param("sdss", $specialization, $consultation_fee, $bio, $doctor_id);
            
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $stmt->close();
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Doctor updated successfully'
        ]);

    } elseif ($method === 'DELETE') {
        // Delete doctor
        $input = json_decode(file_get_contents("php://input"), true);
        $doctor_id = $input['doctor_id'] ?? null;

        if (!$doctor_id) {
            throw new Exception('Doctor ID required');
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $doctor_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Doctor deleted successfully'
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
