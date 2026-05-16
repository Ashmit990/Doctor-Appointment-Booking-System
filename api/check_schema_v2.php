<?php
require_once 'config/db.php';
$tables = ['treatment_tickets', 'treatment_categories'];
$output = [];
foreach($tables as $table) {
    $res = $conn->query("DESCRIBE $table");
    $fields = [];
    while($row = $res->fetch_assoc()) $fields[] = $row;
    $output[$table] = $fields;
}
echo json_encode($output);
?>
