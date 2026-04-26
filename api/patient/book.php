<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$doctor_id = $input['doctor_id'] ?? '';
$avail_id = isset($input['avail_id']) ? (int) $input['avail_id'] : 0;
$reason = trim($input['reason_for_visit'] ?? '');
$room_num = trim($input['room_num'] ?? 'Room A1');
if (strlen($room_num) > 10) {
    $room_num = substr($room_num, 0, 10);
}

if ($doctor_id === '' || $avail_id < 1) {
    echo json_encode(['status' => 'error', 'message' => 'doctor_id and avail_id are required']);
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    // Auto-close past slots first (for today only)
    $today = date('Y-m-d');
    $current_time = date('H:i:s');
    $close_stmt = $conn->prepare("
        UPDATE doctor_availability
        SET status = 'Closed'
        WHERE available_date = ?
          AND status = 'Available'
          AND start_time <= ?
    ");
    $close_stmt->bind_param("ss", $today, $current_time);
    $close_stmt->execute();
    $close_stmt->close();

    $stmt = $conn->prepare("
        SELECT avail_id, doctor_id, available_date, start_time, end_time, status
        FROM doctor_availability
        WHERE avail_id = ? FOR UPDATE
    ");
    $stmt->bind_param("i", $avail_id);
    $stmt->execute();
    $slot = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$slot || $slot['doctor_id'] !== $doctor_id || $slot['status'] !== 'Available') {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'This time slot is no longer available']);
        $conn->close();
        exit;
    }

    $upd = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ? AND status = 'Available'");
    $upd->bind_param("i", $avail_id);
    if (!$upd->execute()) {
        $msg = $upd->error ?: $conn->error;
        $upd->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Could not reserve slot: ' . $msg]);
        $conn->close();
        exit;
    }
    if ($upd->affected_rows !== 1) {
        $upd->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Could not reserve slot']);
        $conn->close();
        exit;
    }
    $upd->close();

    $app_date = (string) $slot['available_date'];
    $app_time = (string) $slot['start_time'];
    if (strlen($app_time) > 8) {
        $app_time = substr($app_time, 0, 8);
    }

    $ins = $conn->prepare("
        INSERT INTO appointments (patient_id, doctor_id, app_date, app_time, room_num, reason_for_visit, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Upcoming')
    ");
    $ins->bind_param("ssssss", $patient_id, $doctor_id, $app_date, $app_time, $room_num, $reason);

    if (!$ins->execute()) {
        $msg = $ins->error ?: $conn->error;
        $ins->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Could not save appointment: ' . $msg]);
        $conn->close();
        exit;
    }

    if ($ins->affected_rows !== 1) {
        $ins->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Appointment was not inserted']);
        $conn->close();
        exit;
    }

    $new_id = (int) $conn->insert_id;
    $ins->close();

    if ($new_id < 1) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Invalid appointment id after save']);
        $conn->close();
        exit;
    }

    $pn = $conn->prepare("SELECT full_name FROM users WHERE user_id = ?");
    $pn->bind_param("s", $patient_id);
    $pn->execute();
    $pn_res = $pn->get_result()->fetch_assoc();
    $pat_name = $pn_res ? $pn_res['full_name'] : 'A patient';
    $pn->close();

    $notif_title = "New Appointment";
    $notif_msg = "{$pat_name} has booked an appointment with you for {$app_date} at " . substr($app_time, 0, 5) . ".";
    
    $ns = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
    $ns->bind_param("sss", $doctor_id, $notif_title, $notif_msg);
    if (!$ns->execute()) {
        error_log("Failed to insert notification: " . $ns->error);
    }
    $ns->close();

    if (!$conn->commit()) {
        echo json_encode(['status' => 'error', 'message' => 'Could not finalize booking: ' . $conn->error]);
        $conn->close();
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Appointment booked',
        'appointment_id' => $new_id,
    ]);
} catch (Throwable $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
