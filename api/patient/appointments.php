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
        a.doctor_notes,
        a.prescriptions,
        a.status,
        a.feedback,
        a.created_at,
        u.full_name AS doctor_name,
        dp.specialization,
        (SELECT estimated_cost FROM treatment_categories
         WHERE name = CASE
             WHEN LOWER(dp.specialization) LIKE '%cardio%'  THEN 'Cardiology'
             WHEN LOWER(dp.specialization) LIKE '%ortho%'   THEN 'Orthopedics'
             WHEN LOWER(dp.specialization) LIKE '%derma%'   THEN 'Dermatology'
             WHEN LOWER(dp.specialization) LIKE '%neuro%'   THEN 'Neurology'
             WHEN LOWER(dp.specialization) LIKE '%ediatri%' THEN 'Pediatrics'
             WHEN LOWER(dp.specialization) LIKE '%gynec%'   THEN 'Gynecology'
             WHEN LOWER(dp.specialization) LIKE '%ophthal%' THEN 'Ophthalmology'
             WHEN LOWER(dp.specialization) LIKE '%physio%'  THEN 'Physiotherapy'
             WHEN LOWER(dp.specialization) LIKE '%dent%'    THEN 'Dentistry'
             ELSE 'General Consultation'
         END LIMIT 1) AS consultation_fee,
        tt.ticket_number,
        tc.name AS ticket_category,
        tt.cost AS ticket_cost,
        tt.generated_at AS ticket_generated_at
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    LEFT JOIN treatment_tickets tt ON a.appointment_id = tt.appointment_id
    LEFT JOIN treatment_categories tc ON tt.category_id = tc.id
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
