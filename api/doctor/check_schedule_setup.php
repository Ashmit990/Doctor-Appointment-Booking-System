<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Check if user is logged in and is a doctor
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Doctor') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if doctor has slots set for THIS WEEK
    // Calculate this week's Sunday and Saturday
    $today = new DateTime();
    $dayOfWeek = (int)$today->format('w'); // 0 = Sunday, 1 = Monday, etc.
    
    $weekStart = new DateTime();
    $weekStart->setDate($today->format('Y'), $today->format('m'), $today->format('d'));
    $weekStart->modify('-' . $dayOfWeek . ' days'); // Set to Sunday
    
    $weekEnd = new DateTime($weekStart->format('Y-m-d'));
    $weekEnd->modify('+6 days'); // Set to Saturday
    
    $weekStartStr = $weekStart->format('Y-m-d');
    $weekEndStr = $weekEnd->format('Y-m-d');
    
    // Check if doctor has any AVAILABLE slots for this week
    // Only count slots patients can actually book (Available status)
    // Don't count Blocked/Closed/Booked as these don't allow new bookings
    $stmt = $conn->prepare("
        SELECT COUNT(*) as slot_count 
        FROM doctor_availability 
        WHERE doctor_id = ? 
          AND available_date >= ? 
          AND available_date <= ? 
          AND status = 'Available'
    ");
    $stmt->bind_param("sss", $user_id, $weekStartStr, $weekEndStr);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    $has_slots_this_week = $row['slot_count'] > 0;
    
    // Return true if doctor has available slots for this week
    // This determines if schedule setup popup should be shown
    // (popup appears when there are NO available slots for the current week)
    
    echo json_encode([
        'status' => 'success',
        'schedule_setup_completed' => $has_slots_this_week,
        'week_start' => $weekStartStr,
        'week_end' => $weekEndStr,
        'slots_found' => $row['slot_count']
    ]);
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Mark schedule setup as complete
    $action = $_POST['action'] ?? '';
    
    if ($action === 'complete') {
        $stmt = $conn->prepare("UPDATE users SET schedule_setup_completed = TRUE WHERE user_id = ? AND role = 'Doctor'");
        $stmt->bind_param("s", $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Schedule setup marked as complete'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update schedule setup status'
            ]);
        }
        $stmt->close();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}

$conn->close();
?>
