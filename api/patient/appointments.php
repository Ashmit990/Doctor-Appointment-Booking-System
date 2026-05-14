<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

ensure_appointment_payments_table($conn);
release_expired_payment_holds($conn);

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
        COALESCE(
            (SELECT tc.estimated_cost 
             FROM treatment_categories tc 
             WHERE LOWER(tc.name) = LOWER(dp.specialization) 
             OR LOWER(tc.name) LIKE CONCAT('%', LOWER(dp.specialization), '%')
             OR LOWER(dp.specialization) LIKE CONCAT('%', SUBSTRING(LOWER(tc.name), 1, 5), '%')
             LIMIT 1),
            (SELECT tc.estimated_cost 
             FROM treatment_categories tc 
             WHERE tc.name = 'General Consultation' 
             LIMIT 1),
            500
        ) AS consultation_fee,
        tt.ticket_number,
        tc.name AS ticket_category,
        tt.cost AS ticket_cost,
        tt.generated_at AS ticket_generated_at,
        ap.payment_id,
        ap.payment_method,
        ap.pidx AS payment_pidx,
        ap.transaction_id AS payment_transaction_id,
        ap.amount_rupees AS payment_amount,
        ap.payment_status,
        ap.verified_at AS payment_verified_at,
        IF(EXISTS (SELECT 1 FROM appointments fu_parent WHERE fu_parent.next_followup_id = a.appointment_id), 1, 0) AS is_followup_visit
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    LEFT JOIN treatment_tickets tt ON a.appointment_id = tt.appointment_id
    LEFT JOIN treatment_categories tc ON tt.category_id = tc.id
    LEFT JOIN appointment_payments ap ON a.appointment_id = ap.appointment_id
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
    $isFollowupVisit = !empty($row['is_followup_visit']);
    unset($row['is_followup_visit']);
    patient_apply_payment_display_fields($row, $isFollowupVisit);
}
unset($row);

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
