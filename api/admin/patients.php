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
        // Get all patients
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        $patient_id = $_GET['patient_id'] ?? null;

        if ($patient_id) {
            // Get specific patient with appointment history
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    pp.dob,
                    pp.blood_group,
                    pp.contact_number,
                    pp.address
                FROM users u
                LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
                WHERE u.user_id = ? AND u.role = 'Patient'
            ");
            $stmt->bind_param("s", $patient_id);
            $stmt->execute();
            $patient = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$patient) {
                throw new Exception('Patient not found');
            }

            // Get appointment history
            $stmt = $conn->prepare("
                SELECT 
                    a.appointment_id,
                    a.app_date,
                    a.app_time,
                    a.status,
                    a.reason_for_visit,
                    a.doctor_comments,
                    u_doctor.full_name as doctor_name,
                    dp.specialization
                FROM appointments a
                JOIN users u_doctor ON a.doctor_id = u_doctor.user_id
                LEFT JOIN doctor_profiles dp ON u_doctor.user_id = dp.user_id
                WHERE a.patient_id = ?
                ORDER BY a.app_date DESC
            ");
            $stmt->bind_param("s", $patient_id);
            $stmt->execute();
            $appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            echo json_encode([
                'status' => 'success',
                'data' => array_merge($patient, ['appointments' => $appointments])
            ]);

        } else {
            // Get all patients list
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    pp.dob,
                    pp.blood_group,
                    pp.contact_number,
                    pp.address,
                    (SELECT COUNT(*) FROM appointments WHERE patient_id = u.user_id) as total_appointments
                FROM users u
                LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
                WHERE u.role = 'Patient'
                ORDER BY u.full_name ASC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $patients = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            // Get total count
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Patient'");
            $stmt->execute();
            $count_result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            echo json_encode([
                'status' => 'success',
                'data' => $patients,
                'total' => $count_result['total'],
                'page' => $page,
                'pages' => ceil($count_result['total'] / $limit)
            ]);
        }

    } elseif ($method === 'PUT') {
        // Update patient
        $input = json_decode(file_get_contents("php://input"), true);
        
        $patient_id = $input['patient_id'] ?? null;
        $full_name = $input['full_name'] ?? null;
        $email = $input['email'] ?? null;

        if (!$patient_id) {
            throw new Exception('Patient ID required');
        }

        $stmt = $conn->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ?");
        $stmt->bind_param("sss", $full_name, $email, $patient_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Patient updated successfully'
        ]);

    } elseif ($method === 'DELETE') {
        // Delete patient
        $input = json_decode(file_get_contents("php://input"), true);
        $patient_id = $input['patient_id'] ?? null;

        if (!$patient_id) {
            throw new Exception('Patient ID required');
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ? AND role = 'Patient'");
        $stmt->bind_param("s", $patient_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Patient deleted successfully'
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
