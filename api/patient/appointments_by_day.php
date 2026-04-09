<?php
require_once __DIR__ . '/bootstrap.php';

$day = $_GET['date'] ?? '';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid date']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
    SELECT
        a.appointment_id,
        a.app_date,
        a.app_time,
        a.room_num,
        a.reason_for_visit,
        a.doctor_comments,
        a.prescribed_medicines,
        a.status,
        u.full_name AS doctor_name,
        dp.specialization
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.patient_id = ? AND a.app_date = ?
    ORDER BY a.app_time ASC
");
$stmt->bind_param("ss", $patient_id, $day);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

foreach ($rows as &$row) {
    $row['status_key'] = strtolower($row['status']);
}
unset($row);

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
