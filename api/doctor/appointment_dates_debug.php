<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

// Get all appointment dates for calendar highlighting
$stmt = $conn->prepare("
    SELECT DISTINCT app_date 
    FROM appointments 
    WHERE doctor_id = ? AND status != 'Cancelled'
    ORDER BY app_date ASC
");

$stmt->bind_param("s", $doctor_id);
$stmt->execute();
$result = $stmt->get_result();

$dates = [];
$debug = [];
while ($row = $result->fetch_assoc()) {
    $date = trim($row['app_date']);
    $dates[] = $date;
    $debug[] = [
        'raw' => $row['app_date'],
        'trimmed' => $date,
        'parsed' => [
            'year' => (int)substr($date, 0, 4),
            'month' => (int)substr($date, 5, 2),
            'day' => (int)substr($date, 8, 2)
        ]
    ];
}

$stmt->close();

// Return both the dates and debug information
echo json_encode([
    'status' => 'success', 
    'data' => $dates,
    'debug' => $debug,
    'total_appointments' => count($dates),
    'unique_dates' => count(array_unique($dates))
]);

$conn->close();
?>
