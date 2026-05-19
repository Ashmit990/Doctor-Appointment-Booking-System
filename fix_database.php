<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'api/config/db.php';

echo "<h2>🔧 Healthcare Database Sync Tool</h2>";

// Check if 'is_available' column exists
$check = $conn->query("SHOW COLUMNS FROM doctor_profiles LIKE 'is_available'");
if ($check && $check->num_rows > 0) {
    echo "<p style='color: green; font-weight: bold;'>✓ Column 'is_available' already exists in 'doctor_profiles' table! No action needed.</p>";
} else {
    // Add the column
    $sql = "ALTER TABLE doctor_profiles ADD COLUMN is_available TINYINT DEFAULT 1";
    if ($conn->query($sql)) {
        echo "<p style='color: green; font-weight: bold;'>✓ Successfully added 'is_available' column to 'doctor_profiles' table!</p>";
        echo "<p>Your doctors list and dashboard should now load perfectly!</p>";
    } else {
        echo "<p style='color: red; font-weight: bold;'>❌ Error updating table: " . $conn->error . "</p>";
    }
}

$conn->close();
?>
