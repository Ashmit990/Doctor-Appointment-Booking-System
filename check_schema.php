<?php
require_once 'api/config/db.php';
$res = $conn->query("SHOW COLUMNS FROM doctor_profiles LIKE 'is_available'");
while($row = $res->fetch_assoc()) {
    print_r($row);
}
$conn->close();
?>
