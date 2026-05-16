<?php
require_once 'api/config/db.php';
header('Content-Type: application/json');

$response = [];
$res = $conn->query("DESCRIBE users");
while($row = $res->fetch_assoc()) $response[] = $row;

echo json_encode($response, JSON_PRETTY_PRINT);
?>
