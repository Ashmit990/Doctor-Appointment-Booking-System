<?php
require_once 'api/config/db.php';
$res = $conn->query("DESCRIBE treatment_tickets");
while($row = $res->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
$conn->close();
?>
