<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting Debug...\n";

try {
    echo "Including db.php...\n";
    require_once '../config/db.php';
    echo "db.php included. DB: " . $dbname . "\n";
    
    echo "Including csrf_protection.php...\n";
    require_once '../includes/csrf_protection.php';
    echo "csrf_protection.php included.\n";
    
    echo "Checking connection...\n";
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    echo "Connection OK.\n";
    
    echo "Querying users table...\n";
    $res = $conn->query("SELECT * FROM users LIMIT 1");
    if (!$res) {
        die("Query failed: " . $conn->error);
    }
    echo "Query OK. Found " . $res->num_rows . " user(s).\n";
    
    $row = $res->fetch_assoc();
    echo "Columns found: " . implode(', ', array_keys($row)) . "\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
