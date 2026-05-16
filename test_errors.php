<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- Testing Includes ---\n";
echo "Checking db.php: ";
if (file_exists('api/config/db.php')) {
    include 'api/config/db.php';
    echo "OK\n";
} else {
    echo "MISSING\n";
}

echo "Checking csrf_protection.php: ";
if (file_exists('api/includes/csrf_protection.php')) {
    include 'api/includes/csrf_protection.php';
    echo "OK\n";
} else {
    echo "MISSING\n";
}

echo "--- Testing Connection ---\n";
if (isset($conn)) {
    echo "Connection status: " . ($conn->connect_error ? "Failed" : "Connected") . "\n";
} else {
    echo "Connection variable not found\n";
}
?>
