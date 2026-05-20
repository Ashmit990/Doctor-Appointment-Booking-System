<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$appointment_id = isset($input['appointment_id']) ? (int) $input['appointment_id'] : 0;
$avail_id = isset($input['avail_id']) ? (int) $input['avail_id'] : 0;
$direct_date = trim($input['app_date'] ?? '');
$direct_time = trim($input['app_time'] ?? '');

// Direct mode: follow-up reschedule passes app_date + app_time without a slot
$direct_mode = ($avail_id < 1 && $direct_date !== '' && $direct_time !== '');

if ($appointment_id < 1 || ($avail_id < 1 && !$direct_mode)) {
    echo json_encode(['status' => 'error', 'message' => 'appointment_id and avail_id (or app_date + app_time) required']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
    SELECT appointment_id, patient_id, doctor_id, app_date, app_time, status
    FROM appointments
    WHERE appointment_id = ? AND patient_id = ?
");
$stmt->bind_param("is", $appointment_id, $patient_id);
$stmt->execute();
$apt = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$apt) {
    echo json_encode(['status' => 'error', 'message' => 'Appointment not found']);
    $conn->close();
    exit;
}

$st = $apt['status'];
if ($st !== 'Missed' && $st !== 'Upcoming') {
    echo json_encode(['status' => 'error', 'message' => 'Only upcoming or missed appointments can be rescheduled']);
    $conn->close();
    exit;
}

$doctor_id = $apt['doctor_id'];

$conn->begin_transaction();

try {
    if ($direct_mode) {
        // ── Direct mode (follow-up reschedule): just update the date/time ──────
        $newDate = $direct_date;
        $newTime = strlen($direct_time) === 5 ? $direct_time . ':00' : $direct_time;

        // Silently free the old slot if it exists
        $free = $conn->prepare("
            UPDATE doctor_availability SET status = 'Available'
            WHERE doctor_id = ? AND available_date = ? AND start_time = ? AND status = 'Booked'
        ");
        $free->bind_param("sss", $doctor_id, $apt['app_date'], $apt['app_time']);
        $free->execute();
        $free->close();
    } else {
    // ── Slot mode (normal reschedule) ────────────────────────────────────────
    $slotStmt = $conn->prepare("
        SELECT avail_id, doctor_id, available_date, start_time, status
        FROM doctor_availability
        WHERE avail_id = ? FOR UPDATE
    ");
    $slotStmt->bind_param("i", $avail_id);
    $slotStmt->execute();
    $slot = $slotStmt->get_result()->fetch_assoc();
    $slotStmt->close();

    if (!$slot || $slot['doctor_id'] !== $doctor_id || $slot['status'] !== 'Available') {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Selected slot is not available']);
        $conn->close();
        exit;
    }

    $free = $conn->prepare("
        UPDATE doctor_availability
        SET status = 'Available'
        WHERE doctor_id = ?
          AND available_date = ?
          AND start_time = ?
          AND status = 'Booked'
    ");
    $free->bind_param("sss", $doctor_id, $apt['app_date'], $apt['app_time']);
    $free->execute();
    $free->close();

    $book = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ? AND status = 'Available'");
    $book->bind_param("i", $avail_id);
    $book->execute();
    if ($book->affected_rows !== 1) {
        $book->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Could not book new slot']);
        $conn->close();
        exit;
    }
    $book->close();

    $newDate = $slot['available_date'];
    $newTime = $slot['start_time'];
    } // end slot mode

        // Prevent double booking: one active appointment per patient per day.
        $conf = $conn->prepare("
            SELECT a.appointment_id, COALESCE(u.full_name, a.doctor_id) AS doctor_name
            FROM appointments a
            LEFT JOIN users u ON a.doctor_id = u.user_id
            WHERE a.patient_id = ?
              AND a.app_date = ?
              AND a.status <> 'Cancelled'
              AND a.appointment_id <> ?
            LIMIT 1
        ");
        $conf->bind_param("ssi", $patient_id, $newDate, $appointment_id);
        $conf->execute();
        $conflict_row = $conf->get_result()->fetch_assoc();
        $conf->close();

        if ($conflict_row) {
            $existing_doctor = trim((string) ($conflict_row['doctor_name'] ?? 'another doctor'));
            $conn->rollback();
            echo json_encode([
                'status' => 'error',
                'message' => 'You already have an appointment on this date with ' . $existing_doctor . '. Multiple appointments on the same day are not allowed.'
            ]);
            $conn->close();
            exit;
        }

    $up = $conn->prepare("
        UPDATE appointments
        SET app_date = ?, app_time = ?, status = 'Upcoming'
        WHERE appointment_id = ? AND patient_id = ?
    ");
    $up->bind_param("ssis", $newDate, $newTime, $appointment_id, $patient_id);
    $up->execute();
    $up->close();

    $pn = $conn->prepare("SELECT full_name FROM users WHERE user_id = ?");
    $pn->bind_param("s", $patient_id);
    $pn->execute();
    $pn_res = $pn->get_result()->fetch_assoc();
    $pat_name = $pn_res ? $pn_res['full_name'] : 'A patient';
    $pn->close();

    $notif_title = "Appointment Rescheduled";
    $notif_msg = "{$pat_name} has rescheduled their appointment to {$newDate} at " . substr($newTime, 0, 5) . ".";
    
    $ns = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
    $ns->bind_param("sss", $doctor_id, $notif_title, $notif_msg);
    if (!$ns->execute()) {
        error_log("Failed to insert notification: " . $ns->error);
    }
    $ns->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Appointment rescheduled']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
