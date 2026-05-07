<?php
require_once 'api/config/db.php';

// Check if medical_reports table exists
$result = $conn->query("SHOW TABLES LIKE 'medical_reports'");

if ($result->num_rows > 0) {
    echo "✅ medical_reports table EXISTS\n";
    
    // Get table structure
    $structure = $conn->query("DESCRIBE medical_reports");
    echo "\nTable Structure:\n";
    while ($row = $structure->fetch_assoc()) {
        echo "- {$row['Field']}: {$row['Type']}\n";
    }
} else {
    echo "❌ medical_reports table DOES NOT EXIST\n";
    echo "\nRun this command to create it:\n";
    echo "mysql -u root -p hospital < database/medical_reports_migration.sql\n";
}

$conn->close();
?>
