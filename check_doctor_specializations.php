<?php
require 'api/config/db.php';

$result = $conn->query("SELECT dp.specialization, u.full_name FROM doctor_profiles dp JOIN users u ON dp.user_id = u.user_id");
$data = $result->fetch_all(MYSQLI_ASSOC);
echo "<pre>";
print_r($data);
echo "</pre>";
?>
