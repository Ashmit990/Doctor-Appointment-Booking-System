<?php
require_once __DIR__ . '/bootstrap.php';

$sql = "
    SELECT u.user_id AS doctor_id, u.full_name, dp.specialization, dp.consultation_fee, dp.contact_number, dp.experience_years, dp.qualifications, dp.bio, dp.age
    FROM users u
    INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
    WHERE u.role = 'Doctor'
    ORDER BY u.full_name ASC
";
$result = $conn->query($sql);
$rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
