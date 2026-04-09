<?php
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

if ($appointment_id < 1 || $avail_id < 1) {
    echo json_encode(['status' => 'error', 'message' => 'appointment_id and avail_id required']);
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

    $up = $conn->prepare("
        UPDATE appointments
        SET app_date = ?, app_time = ?, status = 'Upcoming'
        WHERE appointment_id = ? AND patient_id = ?
    ");
    $up->bind_param("ssis", $newDate, $newTime, $appointment_id, $patient_id);
    $up->execute();
    $up->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Appointment rescheduled']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
