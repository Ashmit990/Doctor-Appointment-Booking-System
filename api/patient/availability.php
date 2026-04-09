<?php
require_once __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? '';
$doctor_id = $_GET['doctor_id'] ?? '';

if ($doctor_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'doctor_id required']);
    $conn->close();
    exit;
}

if ($action === 'dates') {
    $stmt = $conn->prepare("
        SELECT DISTINCT available_date
        FROM doctor_availability
        WHERE doctor_id = ?
          AND status = 'Available'
          AND available_date >= CURDATE()
        ORDER BY available_date ASC
    ");
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $dates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $out = array_map(function ($r) {
        return $r['available_date'];
    }, $dates);
    echo json_encode(['status' => 'success', 'data' => $out]);
    $conn->close();
    exit;
}

if ($action === 'slots') {
    $date = $_GET['date'] ?? '';
    if ($date === '') {
        echo json_encode(['status' => 'error', 'message' => 'date required']);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare("
        SELECT avail_id, available_date, start_time, end_time, status
        FROM doctor_availability
        WHERE doctor_id = ?
          AND available_date = ?
          AND status = 'Available'
        ORDER BY start_time ASC
    ");
    $stmt->bind_param("ss", $doctor_id, $date);
    $stmt->execute();
    $slots = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    echo json_encode(['status' => 'success', 'data' => $slots]);
    $conn->close();
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
$conn->close();
