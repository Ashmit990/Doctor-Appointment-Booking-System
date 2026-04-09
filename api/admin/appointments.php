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
        // Get all appointments
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;

        $stmt = $conn->prepare("
            SELECT 
                a.appointment_id,
                a.app_date,
                a.app_time,
                a.status,
                a.reason_for_visit,
                a.room_num,
                a.doctor_comments,
                u_patient.full_name as patient_name,
                u_patient.user_id as patient_id,
                u_doctor.full_name as doctor_name,
                u_doctor.user_id as doctor_id,
                dp.specialization
            FROM appointments a
            JOIN users u_patient ON a.patient_id = u_patient.user_id
            JOIN users u_doctor ON a.doctor_id = u_doctor.user_id
            LEFT JOIN doctor_profiles dp ON u_doctor.user_id = dp.user_id
            ORDER BY a.app_date DESC, a.app_time DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();
        $appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        // Get total count
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM appointments");
        $stmt->execute();
        $count_result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'data' => $appointments,
            'total' => $count_result['total'],
            'page' => $page,
            'pages' => ceil($count_result['total'] / $limit)
        ]);

    } elseif ($method === 'PUT') {
        // Update appointment
        $input = json_decode(file_get_contents("php://input"), true);
        
        $appointment_id = $input['appointment_id'] ?? null;
        $status = $input['status'] ?? null;
        $doctor_comments = $input['doctor_comments'] ?? '';

        if (!$appointment_id || !$status) {
            throw new Exception('Missing required fields');
        }

        $stmt = $conn->prepare("
            UPDATE appointments 
            SET status = ?, doctor_comments = ?
            WHERE appointment_id = ?
        ");
        $stmt->bind_param("ssi", $status, $doctor_comments, $appointment_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Appointment updated successfully'
        ]);

    } elseif ($method === 'DELETE') {
        // Delete appointment
        $input = json_decode(file_get_contents("php://input"), true);
        $appointment_id = $input['appointment_id'] ?? null;

        if (!$appointment_id) {
            throw new Exception('Appointment ID required');
        }

        $stmt = $conn->prepare("DELETE FROM appointments WHERE appointment_id = ?");
        $stmt->bind_param("i", $appointment_id);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'message' => 'Appointment deleted successfully'
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
