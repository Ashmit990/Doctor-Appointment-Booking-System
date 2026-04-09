<?php
require_once __DIR__ . '/bootstrap.php';

$year = isset($_GET['year']) ? (int) $_GET['year'] : (int) date('Y');
$month = isset($_GET['month']) ? (int) $_GET['month'] : (int) date('n');

if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid year/month']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
    SELECT DISTINCT app_date
    FROM appointments
    WHERE patient_id = ?
      AND YEAR(app_date) = ?
      AND MONTH(app_date) = ?
");
$stmt->bind_param("sii", $patient_id, $year, $month);
$stmt->execute();
$res = $stmt->get_result();
$dates = [];
while ($row = $res->fetch_assoc()) {
    $dates[] = $row['app_date'];
}
$stmt->close();

echo json_encode(['status' => 'success', 'data' => ['dates' => $dates]]);
$conn->close();
