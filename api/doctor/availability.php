<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    //Get availability by date
    $date = $_GET['date'] ?? null;
    
    if ($date) {
        $stmt = $conn->prepare("SELECT avail_id, start_time, end_time, status FROM doctor_availability WHERE doctor_id = ? AND available_date = ? ORDER BY start_time ASC");
        $stmt->bind_param("ss", $doctor_id, $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $availability = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        echo json_encode(['status' => 'success', 'data' => $availability]);
    } else {
        // Get all availability
        $stmt = $conn->prepare("SELECT avail_id, available_date, start_time, end_time, status FROM doctor_availability WHERE doctor_id = ? ORDER BY available_date DESC");
        $stmt->bind_param("s", $doctor_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $availability = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        echo json_encode(['status' => 'success', 'data' => $availability]);
    }
} 
elseif ($method === 'POST') {
    // Add new availability
    $data = json_decode(file_get_contents('php://input'), true);
    
    $date = $data['avail_date'] ?? $data['date'] ?? null;
    $start_time = $data['start_time'] ?? null;
    $end_time = $data['end_time'] ?? null;
    
    if (!$date || !$start_time || !$end_time) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }
    
    $status = 'Available';
    $stmt = $conn->prepare("INSERT INTO doctor_availability (doctor_id, available_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $doctor_id, $date, $start_time, $end_time, $status);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Availability added']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add availability']);
    }
    $stmt->close();
}
elseif ($method === 'PUT') {
    // Update availability
    $data = json_decode(file_get_contents('php://input'), true);
    
    $avail_id = $data['avail_id'] ?? null;
    $start_time = $data['start_time'] ?? null;
    $end_time = $data['end_time'] ?? null;
    
    if (!$avail_id || !$start_time || !$end_time) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }
    
    // Verify ownership
    $verify = $conn->prepare("SELECT avail_id FROM doctor_availability WHERE avail_id = ? AND doctor_id = ?");
    $verify->bind_param("is", $avail_id, $doctor_id);
    $verify->execute();
    
    if ($verify->get_result()->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $verify->close();
    
    $stmt = $conn->prepare("UPDATE doctor_availability SET start_time = ?, end_time = ? WHERE avail_id = ?");
    $stmt->bind_param("ssi", $start_time, $end_time, $avail_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Availability updated']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update']);
    }
    $stmt->close();
}
elseif ($method === 'DELETE') {
    // Delete availability
    $avail_id = $_GET['avail_id'] ?? null;
    
    if (!$avail_id) {
        // Try to get from request body if not in GET
        $data = json_decode(file_get_contents('php://input'), true);
        $avail_id = $data['avail_id'] ?? null;
    }
    
    if (!$avail_id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing avail_id']);
        exit;
    }
    
    // Verify ownership
    $verify = $conn->prepare("SELECT avail_id FROM doctor_availability WHERE avail_id = ? AND doctor_id = ?");
    $verify->bind_param("is", $avail_id, $doctor_id);
    $verify->execute();
    
    if ($verify->get_result()->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
    $verify->close();
    
    $stmt = $conn->prepare("DELETE FROM doctor_availability WHERE avail_id = ?");
    $stmt->bind_param("i", $avail_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Availability deleted']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete']);
    }
    $stmt->close();
}

$conn->close();
?>
