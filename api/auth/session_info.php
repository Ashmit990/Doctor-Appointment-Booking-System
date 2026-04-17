<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Check if user is authenticated
$is_authenticated = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);

if (!$is_authenticated) {
    echo json_encode([
        'status' => 'success',
        'logged_in' => false,
        'is_authenticated' => false,
        'user_id' => null
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'logged_in' => true,
    'is_authenticated' => true,
    'user_id' => $_SESSION['user_id'],
    'full_name' => $_SESSION['full_name'] ?? '',
    'role' => $_SESSION['role'] ?? '',
]);
?>
