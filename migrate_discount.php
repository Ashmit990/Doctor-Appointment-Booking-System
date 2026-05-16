<?php
require_once 'api/config/db.php';

// Add discount_amount column to appointments table
$sql = "ALTER TABLE appointments ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00";
if ($conn->query($sql)) {
    echo "Column discount_amount added successfully.\n";
    
    // Optional: Seed some dummy data for demonstration
    $conn->query("UPDATE appointments SET discount_amount = RAND() * 100 WHERE appointment_id % 3 = 0");
    echo "Dummy discount data seeded.\n";
} else {
    echo "Error or column already exists: " . $conn->error . "\n";
}

$conn->close();
?>
