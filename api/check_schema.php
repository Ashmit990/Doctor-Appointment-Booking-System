<?php
require_once 'config/db.php';
$res = $conn->query("DESCRIBE treatment_categories");
$fields = [];
while($row = $res->fetch_assoc()) $fields[] = $row;
echo json_encode($fields);
?>
