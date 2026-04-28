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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
        exit;
    }
    
    $schedule = $data['schedule'] ?? [];
    $start_date = $data['start_date'] ?? date('Y-m-d');
    
    if (empty($schedule)) {
        echo json_encode(['status' => 'error', 'message' => 'No schedule data provided']);
        exit;
    }
    
    // Validate that at least one day has been configured
    $has_valid_day = false;
    foreach ($schedule as $day => $times) {
        if (!empty($times) && is_array($times)) {
            foreach ($times as $time_slot) {
                if (!empty($time_slot['start_time']) && !empty($time_slot['end_time'])) {
                    $has_valid_day = true;
                    break 2;
                }
            }
        }
    }
    
    if (!$has_valid_day) {
        echo json_encode(['status' => 'error', 'message' => 'At least one day with time slots must be configured']);
        exit;
    }
    
    try {
        $conn->begin_transaction();
        
        // Calculate 7 dates starting from the provided start_date (ONE WEEK ONLY)
        // Schedule setup creates slots for THIS WEEK ONLY, not recurring
        // Doctor must set schedule again for the next week if needed
        $base_date = strtotime($start_date);
        $dates_to_create = [];
        for ($i = 0; $i < 7; $i++) {
            $dates_to_create[$i] = date('Y-m-d', strtotime("+$i days", $base_date));
        }
        
        // Map day names to indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        $day_to_index = [
            'Sunday' => 0,
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6
        ];
        
        // Insert availability slots
        $inserted_count = 0;
        $stmt = $conn->prepare("INSERT INTO doctor_availability (doctor_id, available_date, start_time, end_time, status) VALUES (?, ?, ?, ?, 'Available')");
        
        foreach ($schedule as $day_name => $time_slots) {
            if (empty($time_slots) || !is_array($time_slots)) {
                continue;
            }
            
            // Find which day index this is
            $day_index = $day_to_index[$day_name] ?? null;
            if ($day_index === null) {
                continue;
            }
            
            // Get the date for this day of the week
            $target_date = $dates_to_create[$day_index];
            
            // Track inserted times for this day to prevent duplicates
            $inserted_times = [];
            
            // Insert each time slot for this day
            foreach ($time_slots as $time_slot) {
                if (empty($time_slot['start_time']) || empty($time_slot['end_time'])) {
                    continue;
                }
                
                // Create a key for this time slot
                $time_key = $time_slot['start_time'] . '-' . $time_slot['end_time'];
                
                // Skip if this exact time slot already inserted for this day
                if (in_array($time_key, $inserted_times)) {
                    error_log("Skipped duplicate slot for $day_name at $time_key");
                    continue;
                }
                
                $inserted_times[] = $time_key;
                
                $stmt->bind_param("ssss", $user_id, $target_date, $time_slot['start_time'], $time_slot['end_time']);
                if ($stmt->execute()) {
                    $inserted_count++;
                } else {
                    throw new Exception("Failed to insert availability slot: " . $stmt->error);
                }
            }
        }
        
        $stmt->close();
        
        if ($inserted_count === 0) {
            throw new Exception("No valid availability slots were created");
        }
        
        // Mark setup as complete
        $update_stmt = $conn->prepare("UPDATE users SET schedule_setup_completed = TRUE WHERE user_id = ?");
        $update_stmt->bind_param("s", $user_id);
        if (!$update_stmt->execute()) {
            throw new Exception("Failed to mark schedule setup as complete");
        }
        $update_stmt->close();
        
        $conn->commit();
        
        echo json_encode([
            'status' => 'success',
            'message' => "Schedule setup complete! Created $inserted_count availability slots.",
            'inserted_count' => $inserted_count
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}

$conn->close();
?>
