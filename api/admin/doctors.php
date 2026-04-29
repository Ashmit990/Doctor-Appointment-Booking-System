<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;
        $doctor_id = $_GET['doctor_id'] ?? null;

        if ($doctor_id) {
            // Get single doctor with ALL details - Using correct column names
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.created_at,
                    dp.medical_id,
                    dp.specialization,
                    dp.contact_number,
                    dp.experience_years,
                    dp.qualifications,
                    dp.consultation_fee,
                    dp.bio,
                    dp.age,
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
                echo json_encode(['status' => 'error', 'message' => 'Doctor not found']);
                exit;
            }

            echo json_encode([
                'status' => 'success',
                'data' => $doctor
            ]);

        } else {
            // Get all doctors for listing
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    COALESCE(dp.specialization, 'Not Specified') as specialization,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id) as total_appointments
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
            $total_result = $stmt->get_result()->fetch_assoc();
            $total = $total_result['total'];
            $stmt->close();

            echo json_encode([
                'status' => 'success',
                'data' => $doctors,
                'total' => $total,
                'page' => $page,
                'pages' => ceil($total / $limit)
            ]);
        }

    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents("php://input"), true);
        $doctor_id = $input['doctor_id'] ?? null;

        if (!$doctor_id) {
            echo json_encode(['status' => 'error', 'message' => 'Doctor ID required']);
            exit;
        }

        // Delete from doctor_profiles first
        $stmt = $conn->prepare("DELETE FROM doctor_profiles WHERE user_id = ?");
        $stmt->bind_param("s", $doctor_id);
        $stmt->execute();
        $stmt->close();
        
        // Delete from users
        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $doctor_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Doctor deleted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete doctor']);
        }
        $stmt->close();

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>