<?php
$host = "localhost";
$username = "root";
$password = ""; // Default for XAMPP is empty
$dbname = "hospital";

// Create connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8mb4 to match your database collation
$conn->set_charset("utf8mb4"); 
?>