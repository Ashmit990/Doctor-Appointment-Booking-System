<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

// Get all availability dates for calendar highlighting (from doctor_availability table)
$stmt = $conn->prepare("
    SELECT DISTINCT available_date 
    FROM doctor_availability 
    WHERE doctor_id = ? AND status IN ('Available', 'Booked')
    ORDER BY available_date ASC
");

$stmt->bind_param("s", $doctor_id);
$stmt->execute();
$result = $stmt->get_result();

$dates = [];
while ($row = $result->fetch_assoc()) {
    // Return full date in YYYY-MM-DD format for accurate month/year matching
    $dates[] = $row['available_date'];
}

$stmt->close();

echo json_encode(['status' => 'success', 'data' => $dates]);

$conn->close();
?>
