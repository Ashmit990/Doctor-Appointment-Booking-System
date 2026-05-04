<?php
require 'api/config/db.php';

$result = $conn->query('SELECT * FROM treatment_categories');
$data = $result->fetch_all(MYSQLI_ASSOC);
echo "<pre>";
print_r($data);
echo "</pre>";
?>
