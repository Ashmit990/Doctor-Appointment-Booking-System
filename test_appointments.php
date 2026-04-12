<?php
$c = new mysqli('127.0.0.1', 'root', '', 'hospital');
if ($c->connect_error) die("error");
try {
   $c->query("ALTER TABLE appointments ADD doctor_notes TEXT NULL, ADD prescriptions TEXT NULL, ADD rating INT DEFAULT 0, ADD feedback TEXT NULL");
   echo "Added columns";
} catch(Exception $e) {
   echo "Error/Already exists: " . $e->getMessage();
}
$res = $c->query('SHOW COLUMNS FROM appointments');
while($r = $res->fetch_assoc()) echo $r['Field'] . " ";
$c->close();
?>
