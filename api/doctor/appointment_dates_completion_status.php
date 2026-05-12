<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

try {
    // Get all appointments grouped by date with completion status
    $stmt = $conn->prepare("
        SELECT 
            app_date,
            status
        FROM appointments 
        WHERE doctor_id = ? AND status IN ('Upcoming', 'Completed', 'Missed')
        ORDER BY app_date ASC
    ");
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Group appointments by date and check completion
    $dateCompletionStatus = [];
    
    while ($row = $result->fetch_assoc()) {
        $date = $row['app_date'];
        $status = $row['status'];
        
        if (!isset($dateCompletionStatus[$date])) {
            $dateCompletionStatus[$date] = [
                'total' => 0,
                'completed' => 0,
                'has_pending' => false
            ];
        }
        
        $dateCompletionStatus[$date]['total']++;
        
        if ($status === 'Completed') {
            $dateCompletionStatus[$date]['completed']++;
        } else {
            $dateCompletionStatus[$date]['has_pending'] = true;
        }
    }
    
    // Categorize dates
    $allCompletedDates = [];
    $hasPendingDates = [];
    
    foreach ($dateCompletionStatus as $date => $info) {
        if ($info['has_pending']) {
            $hasPendingDates[] = $date;
        } else if ($info['completed'] === $info['total'] && $info['total'] > 0) {
            $allCompletedDates[] = $date;
        }
    }
    
    $stmt->close();
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'all_completed' => $allCompletedDates,
            'has_pending' => $hasPendingDates
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
