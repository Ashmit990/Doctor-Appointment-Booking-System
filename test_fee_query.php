<?php
require 'api/config/db.php';

// Test the query logic
$specialization = "Orthopedic";

$treatStmt = $conn->prepare("
    SELECT estimated_cost, name
    FROM treatment_categories 
    WHERE name = ? OR name LIKE CONCAT('%', ?, '%')
    LIMIT 1
");
$treatStmt->bind_param('ss', $specialization, $specialization);
$treatStmt->execute();
$result = $treatStmt->get_result()->fetch_assoc();
$treatStmt->close();

echo "Specialization: " . $specialization . "<br>";
echo "Found: <pre>";
print_r($result);
echo "</pre>";

// Also try case-insensitive
$treatStmt2 = $conn->prepare("
    SELECT estimated_cost, name
    FROM treatment_categories 
    WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE CONCAT('%', LOWER(?), '%')
    LIMIT 1
");
$treatStmt2->bind_param('ss', $specialization, $specialization);
$treatStmt2->execute();
$result2 = $treatStmt2->get_result()->fetch_assoc();
$treatStmt2->close();

echo "Found (case-insensitive): <pre>";
print_r($result2);
echo "</pre>";
?>
