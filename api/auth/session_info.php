<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'success', 'logged_in' => false]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'logged_in' => true,
    'user_id' => $_SESSION['user_id'],
    'full_name' => $_SESSION['full_name'] ?? '',
    'role' => $_SESSION['role'] ?? '',
]);
?>
