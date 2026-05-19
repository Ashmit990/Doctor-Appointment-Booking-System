<?php
require_once __DIR__ . '/bootstrap.php';

// Dynamic check: Check if 'is_available' exists in database. If not, fallback gracefully.
$has_avail = false;
$check_col = $conn->query("SHOW COLUMNS FROM doctor_profiles LIKE 'is_available'");
if ($check_col && $check_col->num_rows > 0) {
    $has_avail = true;
}
$avail_condition = $has_avail ? "AND COALESCE(dp.is_available, 1) = 1" : "";

$sql = "
    SELECT u.user_id AS doctor_id, u.full_name, dp.specialization,
        COALESCE(dp.consultation_fee, 500) AS consultation_fee,
        dp.contact_number, dp.experience_years, dp.qualifications, dp.bio, dp.age,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = u.user_id) AS total_appointments
    FROM users u
    INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
    WHERE u.role = 'Doctor' {$avail_condition}
    ORDER BY total_appointments DESC, consultation_fee DESC
";
$result = $conn->query($sql);
$rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];

echo json_encode(['status' => 'success', 'data' => $rows]);
$conn->close();
