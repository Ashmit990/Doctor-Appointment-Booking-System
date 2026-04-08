<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch appointment details
    if (!isset($_GET['apt_id']) || empty($_GET['apt_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required']);
        exit;
    }

    $apt_id = $_GET['apt_id'];

    try {
        $stmt = $conn->prepare("
            SELECT 
                a.appointment_id,
                a.patient_id,
                a.app_date,
                a.app_time as appointment_time,
                a.room_num as room_number,
                a.reason_for_visit,
                a.status,
                a.doctor_comments,
                a.prescribed_medicines,
                u.full_name as patient_name,
                pp.contact_number,
                pp.blood_group
            FROM appointments a
            JOIN users u ON a.patient_id = u.user_id
            LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
            WHERE a.appointment_id = ? AND a.doctor_id = ?
        ");
        
        $stmt->bind_param("is", $apt_id, $doctor_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Appointment not found']);
            exit;
        }

        $appointment = $result->fetch_assoc();
        $stmt->close();

        echo json_encode([
            'status' => 'success',
            'data' => $appointment
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update appointment details
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['appointment_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required']);
        exit;
    }

    $apt_id = $input['appointment_id'];
    $status = $input['status'] ?? null;
    $doctor_comments = $input['doctor_comments'] ?? null;
    $prescribed_medicines = $input['prescribed_medicines'] ?? null;

    try {
        $stmt = $conn->prepare("
            UPDATE appointments 
            SET status = ?, doctor_comments = ?, prescribed_medicines = ?
            WHERE appointment_id = ? AND doctor_id = ?
        ");

        $stmt->bind_param(
            "sssii",
            $status,
            $doctor_comments,
            $prescribed_medicines,
            $apt_id,
            $doctor_id
        );

        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Appointment updated successfully'
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update appointment']);
        }

        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}

$conn->close();
?>
