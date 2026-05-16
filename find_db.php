<?php
$host = "127.0.0.1";
$username = "root";
$password = "";
$possible_names = ["hospital_offical", "hospital_official", "hospital_officals", "hospital"];

header('Content-Type: application/json');
$results = [];

foreach ($possible_names as $name) {
    $conn = @new mysqli($host, $username, $password, $name);
    if ($conn->connect_error) {
        $results[$name] = "error: " . $conn->connect_error;
    } else {
        $results[$name] = "success";
        $tables = [];
        $tRes = $conn->query("SHOW TABLES");
        while($r = $tRes->fetch_array()) $tables[] = $r[0];
        $results[$name . "_tables"] = $tables;
        $conn->close();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
