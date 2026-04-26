<?php
/**
 * Patient Dashboard Follow-up Reminder Check
 * This endpoint checks if the current patient has any follow-up appointments tomorrow
 * and creates reminder notifications if needed.
 * Called from patient dashboard on page load.
 */

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    $conn->close();
    exit;
}

$patient_id = $_SESSION['user_id'];
$tomorrow = date('Y-m-d', strtotime('+1 day'));

try {
    // Check if a reminder for tomorrow has already been sent today
    $check = $conn->prepare("
        SELECT notification_id FROM notifications
        WHERE user_id = ?
        AND title = 'Follow-up Reminder: Tomorrow'
        AND DATE(created_at) = CURDATE()
        LIMIT 1
    ");
    $check->bind_param("s", $patient_id);
    $check->execute();
    $existing = $check->get_result()->fetch_assoc();
    $check->close();

    if ($existing) {
        // Reminder already sent today
        echo json_encode(['status' => 'success', 'message' => 'Reminder already sent today']);
        $conn->close();
        exit;
    }

    // Find appointments scheduled for tomorrow
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.app_time,
            u.full_name as doctor_name
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.patient_id = ? 
        AND a.app_date = ?
        AND a.status IN ('Upcoming', 'Completed')
        ORDER BY a.app_time ASC
        LIMIT 1
    ");

    $stmt->bind_param("ss", $patient_id, $tomorrow);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointment = $result->fetch_assoc();
    $stmt->close();

    if ($appointment) {
        // There's an appointment tomorrow - send reminder
        $doctor_name = $appointment['doctor_name'] ?? 'Your Doctor';
        $app_time = $appointment['app_time'];
        $message = "Reminder: You have a follow-up appointment with {$doctor_name} tomorrow at " . 
                   date('h:i A', strtotime($app_time)) . ". Please arrive 10 minutes early.";

        $ins = $conn->prepare("
            INSERT INTO notifications (user_id, title, message, is_read, created_at) 
            VALUES (?, 'Follow-up Reminder: Tomorrow', ?, 0, NOW())
        ");

        $ins->bind_param("ss", $patient_id, $message);
        $ins->execute();
        $ins->close();

        echo json_encode(['status' => 'success', 'message' => 'Follow-up reminder sent', 'has_followup' => true]);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'No follow-up appointments tomorrow', 'has_followup' => false]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
