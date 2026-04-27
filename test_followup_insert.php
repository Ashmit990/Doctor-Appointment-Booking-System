<?php
/**
 * Test script to add followup data to an existing appointment
 * This is just for testing the followup pre-population fix
 */

require_once 'api/config/db.php';
session_start();

// Simulating a doctor session
$_SESSION['user_id'] = 'DOC_SARAH';

$appointment_id = 21; // The appointment from the screenshot
$next_followup_date = '2026-05-10';
$next_followup_time = '14:00:00';

try {
    $stmt = $conn->prepare("UPDATE appointments SET next_followup_date = ?, next_followup_time = ? WHERE appointment_id = ?");
    $stmt->bind_param("ssi", $next_followup_date, $next_followup_time, $appointment_id);
    
    if ($stmt->execute()) {
        echo "✓ Successfully added followup data to appointment " . $appointment_id . "\n";
        echo "  - Followup Date: " . $next_followup_date . "\n";
        echo "  - Followup Time: " . $next_followup_time . "\n";
        echo "\nNow open the appointment modal and check if the followup fields are populated!\n";
    } else {
        echo "✗ Failed to update appointment: " . $stmt->error;
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage();
}

$conn->close();
?>
