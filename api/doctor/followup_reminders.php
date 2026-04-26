<?php
/**
 * Follow-up Reminder Cron Job Script
 * This script should be executed daily to check for follow-ups scheduled for tomorrow
 * Can be set up as a cron job: 0 8 * * * /usr/bin/php /path/to/followup_reminders.php
 * 
 * Or called via HTTP: curl http://yourdomain.com/api/doctor/followup_reminders.php?key=your_secret_key
 */

require_once __DIR__ . '/../config/db.php';

// Optional security key - set this to match your cron job or HTTP call
$SECRET_KEY = 'your_secret_cron_key_123'; // Change this to your own secret
if (isset($_GET['key'])) {
    if ($_GET['key'] !== $SECRET_KEY) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
} else if (php_sapi_name() === 'cli') {
    // Running from command line - allow it
} else {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

try {
    $conn->begin_transaction();

    // Get tomorrow's date
    $tomorrow = date('Y-m-d', strtotime('+1 day'));

    // Find all appointments scheduled for tomorrow that don't have a reminder already sent
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.patient_id,
            a.app_time,
            u.full_name as doctor_name,
            d.specialization
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        LEFT JOIN doctor_profiles d ON a.doctor_id = d.user_id
        WHERE a.app_date = ? 
        AND a.status IN ('Upcoming', 'Completed')
        AND a.appointment_id NOT IN (
            SELECT user_id FROM notifications 
            WHERE title = 'Follow-up Reminder: Tomorrow'
            AND DATE(created_at) = CURDATE()
        )
    ");

    $stmt->bind_param("s", $tomorrow);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $remindersCount = 0;

    // Insert reminder notifications for each upcoming follow-up
    foreach ($appointments as $apt) {
        $patient_id = $apt['patient_id'];
        $doctor_name = $apt['doctor_name'] ?? 'Your Doctor';
        $app_time = $apt['app_time'];
        $appointment_id = $apt['appointment_id'];

        $message = "Reminder: You have a follow-up appointment with {$doctor_name} tomorrow at " . 
                   date('h:i A', strtotime($app_time)) . ". Appointment ID: #{$appointment_id}";

        $ins = $conn->prepare("
            INSERT INTO notifications (user_id, title, message, is_read, created_at) 
            VALUES (?, 'Follow-up Reminder: Tomorrow', ?, 0, NOW())
        ");

        $ins->bind_param("ss", $patient_id, $message);
        if ($ins->execute()) {
            $remindersCount++;
        }
        $ins->close();
    }

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'message' => "Sent {$remindersCount} follow-up reminders for appointments on {$tomorrow}",
        'reminders_sent' => $remindersCount
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
