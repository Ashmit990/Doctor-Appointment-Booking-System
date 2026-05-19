<?php
require_once __DIR__ . '/../api/config/db.php';

$sql = "
    UPDATE appointments 
    SET status = 'Completed' 
    WHERE status = 'Upcoming' 
      AND (app_date < CURDATE() OR (app_date = CURDATE() AND app_time <= CURTIME()))
";

if ($conn->query($sql)) {
    echo "SUCCESS: Updated " . $conn->affected_rows . " past appointments to Completed!\n";
} else {
    echo "ERROR: " . $conn->error . "\n";
}
$conn->close();
