<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $admin_id = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT 
            user_id,
            full_name,
            email,
            role,
            created_at
        FROM users
        WHERE user_id = ? AND role = 'Admin'
    ");
    $stmt->bind_param("s", $admin_id);
    $stmt->execute();
    $admin = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$admin) {
        throw new Exception('Admin not found');
    }

    echo json_encode([
        'status' => 'success',
        'data' => $admin
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
