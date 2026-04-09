<?php
session_start();
require_once '../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT approval_id, full_name, email, specialization, consultation_fee, bio, submitted_at FROM doctor_approvals WHERE status = 'Pending' ORDER BY submitted_at DESC");
    $stmt->execute();
    echo json_encode(['status' => 'success', 'data' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
    $stmt->close();
} 
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input['action'] ?? null;
    $approval_id = $input['approval_id'] ?? null;

    if ($action === 'approve') {
        $conn->begin_transaction();
        try {
            // 1. Fetch data from staging
            $stmt = $conn->prepare("SELECT * FROM doctor_approvals WHERE approval_id = ?");
            $stmt->bind_param("i", $approval_id);
            $stmt->execute();
            $data = $stmt->get_result()->fetch_assoc();

            if (!$data) throw new Exception("Request not found.");

            // 2. Create official ID
            $user_id = 'DOC_' . strtoupper(substr(uniqid(), -6));

            // 3. Move to Users Table (Using plain 'password' from data)
            $stmt = $conn->prepare("INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'Doctor')");
            $stmt->bind_param("ssss", $user_id, $data['full_name'], $data['email'], $data['password_hash']);
            $stmt->execute();

            // 4. Move to Doctor Profiles
            $stmt = $conn->prepare("INSERT INTO doctor_profiles (user_id, specialization, consultation_fee, bio) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssds", $user_id, $data['specialization'], $data['consultation_fee'], $data['bio']);
            $stmt->execute();

            // 5. Update Staging Status
            $stmt = $conn->prepare("UPDATE doctor_approvals SET status = 'Accepted', reviewed_at = NOW() WHERE approval_id = ?");
            $stmt->bind_param("i", $approval_id);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Doctor has been approved and activated.']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'reject') {
        $stmt = $conn->prepare("UPDATE doctor_approvals SET status = 'Rejected', reviewed_at = NOW() WHERE approval_id = ?");
        $stmt->bind_param("i", $approval_id);
        $stmt->execute();
        echo json_encode(['status' => 'success', 'message' => 'Application rejected.']);
    }
}
?>