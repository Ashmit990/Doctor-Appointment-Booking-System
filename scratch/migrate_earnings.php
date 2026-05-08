<?php
require_once __DIR__ . '/../api/config/db.php';

echo "Starting migration of earnings from existing completed appointments...\n";

$res = $conn->query("SELECT appointment_id, doctor_id, status FROM appointments WHERE status = 'Completed'");

if (!$res) {
    die("Error fetching appointments: " . $conn->error . "\n");
}

$count = 0;
while ($row = $res->fetch_assoc()) {
    $apt_id = $row['appointment_id'];
    $doc_id = $row['doctor_id'];
    
    // Check if already in earnings
    $chk = $conn->query("SELECT earning_id FROM earnings WHERE appointment_id = $apt_id");
    if ($chk && $chk->num_rows > 0) {
        continue;
    }
    
    // Try to get amount from ticket
    $tkt = $conn->query("SELECT cost FROM treatment_tickets WHERE appointment_id = $apt_id")->fetch_assoc();
    if ($tkt) {
        $amount = $tkt['cost'];
    } else {
        // Get doctor fee
        $feeRes = $conn->query("SELECT consultation_fee FROM doctor_profiles WHERE user_id = '$doc_id'")->fetch_assoc();
        $amount = $feeRes ? $feeRes['consultation_fee'] : 500.00;
    }
    
    $ins = $conn->query("INSERT INTO earnings (doctor_id, appointment_id, amount) VALUES ('$doc_id', $apt_id, $amount)");
    if ($ins) {
        $count++;
        echo "Recorded earning for Appointment #$apt_id (Doctor: $doc_id, Amount: $amount)\n";
    } else {
        echo "Failed to record earning for Appointment #$apt_id: " . $conn->error . "\n";
    }
}

echo "Migration completed. Total records added: $count\n";
?>
