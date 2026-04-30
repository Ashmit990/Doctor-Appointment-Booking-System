<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$apt_id = isset($input['appointment_id']) ? (int) $input['appointment_id'] : 0;
$doctor_notes = trim($input['doctor_notes'] ?? '');
$prescriptions = trim($input['prescriptions'] ?? '');
$followup_date = trim($input['followup_date'] ?? '');
$followup_time = trim($input['followup_time'] ?? '');
$new_status = trim($input['status'] ?? 'Completed'); // Fallback for safety

$doctor_id = $_SESSION['user_id'] ?? '';

if ($apt_id < 1 || $doctor_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'Valid appointment_id required']);
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    // Verify the appointment belongs to this doctor
    $stmt = $conn->prepare("SELECT patient_id, status, next_followup_date, next_followup_time, next_followup_id FROM appointments WHERE appointment_id = ? AND doctor_id = ? FOR UPDATE");
    $stmt->bind_param("is", $apt_id, $doctor_id);
    $stmt->execute();
    $apt = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$apt) {
        throw new Exception('Appointment not found or unauthorized');
    }
    $isAlreadyCompleted = ($apt['status'] === 'Completed');

    $patient_id = $apt['patient_id'];
    $old_followup_date = $apt['next_followup_date'];
    $old_followup_time = $apt['next_followup_time'];
    $old_followup_id = $apt['next_followup_id'];

    // Update appointment with consultation data AND follow-up dates if provided
    if ($followup_date !== '' && $followup_time !== '') {
        $up = $conn->prepare("UPDATE appointments SET status = ?, doctor_comments = ?, prescribed_medicines = ?, next_followup_date = ?, next_followup_time = ? WHERE appointment_id = ?");
        $up->bind_param("sssssi", $new_status, $doctor_notes, $prescriptions, $followup_date, $followup_time, $apt_id);
    } else {
        $up = $conn->prepare("UPDATE appointments SET status = ?, doctor_comments = ?, prescribed_medicines = ? WHERE appointment_id = ?");
        $up->bind_param("sssi", $new_status, $doctor_notes, $prescriptions, $apt_id);
    }
    
    if (!$up->execute()) {
        throw new Exception('Failed to update consultation notes');
    }
    $up->close();

    // Fetch Doctor Name for notifications
    $dnItem = $conn->prepare("SELECT full_name FROM users WHERE user_id = ?");
    $dnItem->bind_param("s", $doctor_id);
    $dnItem->execute();
    $dn_res = $dnItem->get_result()->fetch_assoc();
    $doc_name = $dn_res ? $dn_res['full_name'] : 'Your Doctor';
    $dnItem->close();

    // Notification for Completion
    if ($new_status === 'Completed' && !$isAlreadyCompleted) {
        $msg = "Your appointment with {$doc_name} has been marked as Completed. Please provide feedback on your dashboard.";
        $n1 = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, 'Consultation Completed', ?, 0, NOW())");
        $n1->bind_param("ss", $patient_id, $msg);
        $n1->execute();
        $n1->close();
    }

    // Follow-up logic
    if (!$isAlreadyCompleted && $followup_date !== '' && $followup_time !== '') {
        // Check if followup dates have CHANGED
        $followup_changed = ($old_followup_date !== $followup_date || $old_followup_time !== $followup_time);
        
        // If there's an existing followup appointment, UPDATE it instead of creating new one
        if ($old_followup_id) {
            // UPDATE the existing followup appointment with new date/time
            $update_apt = $conn->prepare("UPDATE appointments SET app_date = ?, app_time = ? WHERE appointment_id = ?");
            $update_apt->bind_param("ssi", $followup_date, $followup_time, $old_followup_id);
            $update_apt->execute();
            $update_apt->close();
            
            // If old slot exists, restore it to Available
            if ($old_followup_date && $old_followup_time) {
                $restore_slot = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE doctor_id = ? AND available_date = ? AND start_time = ? AND status = 'Booked'");
                $restore_slot->bind_param("sss", $doctor_id, $old_followup_date, $old_followup_time);
                $restore_slot->execute();
                $restore_slot->close();
            }
            
            // Block the new followup slot if it exists
            $chk = $conn->prepare("SELECT avail_id, status FROM doctor_availability WHERE doctor_id = ? AND available_date = ? AND start_time = ? FOR UPDATE");
            $chk->bind_param("sss", $doctor_id, $followup_date, $followup_time);
            $chk->execute();
            $slot = $chk->get_result()->fetch_assoc();
            $chk->close();
            
            if ($slot && $slot['status'] === 'Available') {
                $bk = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ?");
                $bk->bind_param("i", $slot['avail_id']);
                $bk->execute();
                $bk->close();
            }
            
            // Send notification about the update
            if ($followup_changed) {
                $old_date_formatted = date('M d, Y', strtotime($old_followup_date));
                $old_time_formatted = date('h:i A', strtotime($old_followup_time));
                $new_date_formatted = date('M d, Y', strtotime($followup_date));
                $new_time_formatted = date('h:i A', strtotime($followup_time));
                
                $fmsg = "Your follow-up appointment with {$doc_name} has been CHANGED from {$old_date_formatted} at {$old_time_formatted} to {$new_date_formatted} at {$new_time_formatted}.";
                $title = 'Follow-up Appointment Updated';
                
                $n2 = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
                $n2->bind_param("sss", $patient_id, $title, $fmsg);
                $n2->execute();
                $n2->close();
            }
        } else {
            // No existing followup appointment - create a NEW one
            // Try to book available slot for follow-up
            $chk = $conn->prepare("SELECT avail_id, status FROM doctor_availability WHERE doctor_id = ? AND available_date = ? AND start_time = ? FOR UPDATE");
            $chk->bind_param("sss", $doctor_id, $followup_date, $followup_time);
            $chk->execute();
            $slot = $chk->get_result()->fetch_assoc();
            $chk->close();

            // Send notification about new followup
            $fmsg = "{$doc_name} has scheduled a follow-up appointment for you on " . date('M d, Y', strtotime($followup_date)) . " at " . date('h:i A', strtotime($followup_time)) . ".";
            $title = 'Follow-up Scheduled';
            
            $n2 = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
            $n2->bind_param("sss", $patient_id, $title, $fmsg);
            $n2->execute();
            $n2->close();

            // If slot exists and is available, create new appointment for follow-up
            if ($slot && $slot['status'] === 'Available') {
                // Block the slot
                $bk = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ?");
                $bk->bind_param("i", $slot['avail_id']);
                $bk->execute();
                $bk->close();

                // Insert new appointment for follow-up
                $reason = "Follow-up consultation";
                $ins = $conn->prepare("INSERT INTO appointments (patient_id, doctor_id, app_date, app_time, reason_for_visit, status) VALUES (?, ?, ?, ?, ?, 'Upcoming')");
                $ins->bind_param("sssss", $patient_id, $doctor_id, $followup_date, $followup_time, $reason);
                $ins->execute();
                
                // Get the ID of the new followup appointment and update the original appointment
                $new_followup_id = $conn->insert_id;
                $update_fid = $conn->prepare("UPDATE appointments SET next_followup_id = ? WHERE appointment_id = ?");
                $update_fid->bind_param("ii", $new_followup_id, $apt_id);
                $update_fid->execute();
                $update_fid->close();
                
                $ins->close();
            }
        }
    }

    $conn->commit();
    $successMessage = $isAlreadyCompleted
        ? 'Appointment details updated successfully'
        : 'Consultation completed successfully';
    echo json_encode(['status' => 'success', 'message' => $successMessage]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
