<?php
require_once __DIR__ . '/bootstrap.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id < 1) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid id']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
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
         END LIMIT 1) AS consultation_fee
    FROM appointments a
    INNER JOIN users u ON a.doctor_id = u.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.appointment_id = ? AND a.patient_id = ?
");
$stmt->bind_param("is", $id, $patient_id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    echo json_encode(['status' => 'error', 'message' => 'Not found']);
    $conn->close();
    exit;
}

$row['status_key'] = strtolower($row['status']);
echo json_encode(['status' => 'success', 'data' => $row]);
$conn->close();
