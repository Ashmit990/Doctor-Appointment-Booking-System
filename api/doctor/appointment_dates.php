<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

// Get all appointment dates for calendar highlighting (upcoming and completed)
$stmt = $conn->prepare("
    SELECT DISTINCT app_date 
    FROM appointments 
    WHERE doctor_id = ? AND status IN ('Upcoming', 'Completed')
    ORDER BY app_date ASC
");

$stmt->bind_param("s", $doctor_id);
$stmt->execute();
$result = $stmt->get_result();

$dates = [];
while ($row = $result->fetch_assoc()) {
    // Return full date in YYYY-MM-DD format for accurate month/year matching
    $dates[] = $row['app_date'];
}

$stmt->close();

echo json_encode(['status' => 'success', 'data' => $dates]);

$conn->close();
?>
