<?php
session_start();
require_once '../includes/csrf_protection.php';

header('Content-Type: application/json');

// Generate or retrieve CSRF token
$token = CSRFProtection::getToken();

echo json_encode(['token' => $token]);
?>
