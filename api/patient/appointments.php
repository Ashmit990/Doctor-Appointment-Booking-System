<?php
require_once __DIR__ . '/bootstrap.php';

$filter = strtolower($_GET['status'] ?? 'all');
$q = trim($_GET['q'] ?? '');

$allowed = ['all', 'upcoming', 'completed', 'missed', 'cancelled'];
if (!in_array($filter, $allowed, true)) {
    $filter = 'all';
}

$statusMap = [
    'upcoming' => 'Upcoming',
    'completed' => 'Completed',
    'missed' => 'Missed',
    'cancelled' => 'Cancelled',
];

$sql = "
    SELECT
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.app_date,
        a.app_time,
        a.room_num,
        a.reason_for_visit,
        a.doctor_comments,
        a.prescribed_medicines,
        a.status,
        a.rating,
        a.created_at,
        u.full_name AS doctor_name,
        dp.specialization,
        dp.consultation_fee
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.patient_id = ?
";
$params = [$patient_id];
$types = 's';

if ($filter !== 'all') {
    $sql .= " AND a.status = ?";
    $params[] = $statusMap[$filter];
    $types .= 's';
}

if ($q !== '') {
    $sql .= " AND (u.full_name LIKE ? OR dp.specialization LIKE ?)";
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
    $types .= 'ss';
}

$sql .= " ORDER BY a.app_date DESC, a.app_time DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

foreach ($rows as &$row) {
    $row['status_key'] = strtolower($row['status']);
}
unset($row);

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
