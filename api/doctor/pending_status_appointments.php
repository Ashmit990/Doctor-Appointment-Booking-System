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
    // Get current date and time using server timezone
    $currentDateTime = new DateTime('now');
    $today = $currentDateTime->format('Y-m-d');
    $currentTime = $currentDateTime->format('H:i:s');
    
    // DEBUG: Log the current time
    error_log("DEBUG: Current DateTime: {$today} {$currentTime} for doctor_id: {$doctor_id}");
    
    // Get appointments that need status updates
    // - Appointment date is today or earlier
    // - Status is still 'Upcoming' (not completed)
    // - Appointment time has passed
    $stmt = $conn->prepare("
        SELECT 
            DISTINCT
            a.appointment_id as apt_id,
            a.patient_id,
            a.app_date,
            a.app_time as appointment_time,
            a.room_num as room_number,
            a.reason_for_visit,
            a.doctor_comments,
            a.status,
            u.full_name as patient_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.user_id
        WHERE a.doctor_id = ? 
        AND a.status = 'Upcoming'
        AND (
            a.app_date < CURDATE() 
            OR (a.app_date = CURDATE() AND a.app_time < CURTIME())
        )
        ORDER BY a.app_date ASC, a.app_time ASC
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // DEBUG: Log the appointments found
    error_log("DEBUG: Found " . count($appointments) . " pending appointments");
    
    // Group appointments by date
    $appointmentsByDate = [];
    foreach ($appointments as $apt) {
        $date = $apt['app_date'];
        if (!isset($appointmentsByDate[$date])) {
            $appointmentsByDate[$date] = [];
        }
        $appointmentsByDate[$date][] = $apt;
    }
    
    // Sort dates in ascending order
    ksort($appointmentsByDate);
    
    echo json_encode([
        'status' => 'success',
        'data' => $appointments,
        'groupedByDate' => $appointmentsByDate,
        'count' => count($appointments),
        'dateCount' => count($appointmentsByDate),
        'debug' => [
            'currentDate' => $today,
            'currentTime' => $currentTime,
            'doctorId' => $doctor_id
        ]
    ]);
} catch (Exception $e) {
    error_log("ERROR in pending_status_appointments.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error fetching pending appointments: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
