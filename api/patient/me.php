<?php
require_once __DIR__ . '/bootstrap.php';

$stmt = $conn->prepare("
    SELECT u.user_id, u.full_name, u.email, u.role
    FROM users u WHERE u.user_id = ?
");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

echo json_encode(['status' => 'success', 'data' => $user]);
$conn->close();
