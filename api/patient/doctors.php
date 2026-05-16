<?php
require_once __DIR__ . '/bootstrap.php';

$sql = "
    SELECT u.user_id AS doctor_id, u.full_name, dp.specialization,
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
        dp.contact_number, dp.experience_years, dp.qualifications, dp.bio, dp.age,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = u.user_id) AS total_appointments
    FROM users u
    INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
    WHERE u.role = 'Doctor'
    ORDER BY total_appointments DESC, consultation_fee DESC
";
$result = $conn->query($sql);
$rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
