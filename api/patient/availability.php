<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

date_default_timezone_set('Asia/Kathmandu');

release_expired_payment_holds($conn);

$action = $_GET['action'] ?? '';
$doctor_id = $_GET['doctor_id'] ?? '';

if ($doctor_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'doctor_id required']);
    $conn->close();
    exit;
}

if ($action === 'dates') {
    $today = date('Y-m-d');
    $current_hour = (int)date('H');

    if ($current_hour >= 17) {
        // After 5 PM, exclude today
        $stmt = $conn->prepare("
            SELECT DISTINCT available_date
            FROM doctor_availability
            WHERE doctor_id = ?
              AND status = 'Available'
              AND available_date > ?
            ORDER BY available_date ASC
        ");
        $stmt->bind_param("ss", $doctor_id, $today);
    } else {
        // Before 5 PM, include today
        $stmt = $conn->prepare("
            SELECT DISTINCT available_date
            FROM doctor_availability
            WHERE doctor_id = ?
              AND status = 'Available'
              AND available_date >= ?
            ORDER BY available_date ASC
        ");
        $stmt->bind_param("ss", $doctor_id, $today);
    }

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

    $today = date('Y-m-d');
    $current_hour = (int)date('H');

    // If requesting slots for today after 5 PM, return empty slots
    if ($date === $today && $current_hour >= 17) {
        echo json_encode(['status' => 'success', 'data' => []]);
        $conn->close();
        exit;
    }

    $current_time = date('H:i:s');
    
    if ($date === $today) {
        // Update any 'Available' slots that are in the past to 'Closed'
        $close_stmt = $conn->prepare("
            UPDATE doctor_availability
            SET status = 'Closed'
            WHERE doctor_id = ?
              AND available_date = ?
              AND status = 'Available'
              AND end_time <= ?
        ");
        $close_stmt->bind_param("sss", $doctor_id, $today, $current_time);
        $close_stmt->execute();
        $close_stmt->close();
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
