<?php
require_once __DIR__ . '/bootstrap.php';

$sql = "
    SELECT u.user_id AS doctor_id, u.full_name, dp.specialization,
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
        dp.contact_number, dp.experience_years, dp.qualifications, dp.bio, dp.age
    FROM users u
    INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
    WHERE u.role = 'Doctor'
    ORDER BY u.full_name ASC
";
$result = $conn->query($sql);
$rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
