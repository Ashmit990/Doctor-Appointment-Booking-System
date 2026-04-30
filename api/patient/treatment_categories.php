<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$res = $conn->query("SELECT id, name, description, estimated_cost FROM treatment_categories ORDER BY name ASC");
$categories = [];
while ($row = $res->fetch_assoc()) {
    $categories[] = $row;
}

echo json_encode(['status' => 'success', 'data' => $categories]);
$conn->close();
