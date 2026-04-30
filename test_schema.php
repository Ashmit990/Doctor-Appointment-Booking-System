<?php
$c = new mysqli('127.0.0.1', 'root', '', 'hospital');
if ($c->connect_error) die("error");
$res = $c->query('SHOW COLUMNS FROM doctor_availability');
while($r = $res->fetch_assoc()) echo $r['Field'] . " ";
$c->close();
?>
