<?php
/**
 * eSewa Payment Initialization
 * Server-side payment initiation per eSewa Sandbox specifications
 */

// Ensure JSON response on any error
header('Content-Type: application/json; charset=utf-8');

// Set error handler to convert errors to JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $errstr,
        'debug' => defined('WP_DEBUG') ? ['file' => $errfile, 'line' => $errline] : null
    ]);
    exit;
});

set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Exception: ' . $e->getMessage(),
    ]);
    exit;
});

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

ensure_appointment_payments_table($conn);
release_expired_payment_holds($conn);

// Parse request
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$doctor_id = trim($input['doctor_id'] ?? '');
$avail_id = isset($input['avail_id']) ? (int)$input['avail_id'] : 0;
$reason = trim($input['reason_for_visit'] ?? '');

if (!$doctor_id || !$avail_id || !$reason) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Missing required: doctor_id, avail_id, reason_for_visit'
    ]);
    exit;
}

$config = esewa_payment_config();

// Fetch patient
$patientStmt = $conn->prepare("
    SELECT u.user_id, u.full_name, u.email, COALESCE(pp.contact_number, '') as contact_number
    FROM users u 
    LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id 
    WHERE u.user_id = ? AND u.role = 'Patient' 
    LIMIT 1
");
$patientStmt->bind_param('s', $patient_id);
$patientStmt->execute();
$patient = $patientStmt->get_result()->fetch_assoc();
$patientStmt->close();

if (!$patient) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
    exit;
}

if (!trim($patient['email']) || !trim($patient['contact_number'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Please complete your profile (email and phone required)'
    ]);
    exit;
}

$conn->begin_transaction();

try {
    // Lock slot and verify availability
    $slotStmt = $conn->prepare("
        SELECT avail_id, doctor_id, available_date, start_time, end_time, status 
        FROM doctor_availability 
        WHERE avail_id = ? AND doctor_id = ? 
        FOR UPDATE
    ");
    $slotStmt->bind_param('is', $avail_id, $doctor_id);
    $slotStmt->execute();
    $slot = $slotStmt->get_result()->fetch_assoc();
    $slotStmt->close();

    if (!$slot || $slot['status'] !== 'Available') {
        $conn->rollback();
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'Slot no longer available']);
        exit;
    }

    // Double Conflict Rules:
    // 1. Cannot book the same doctor twice on the same day.
    // 2. Cannot book any doctor at the same time slot on the same day.
    $dateStr = $slot['available_date'];
    $timeStr = $slot['start_time'];
    $docId   = $slot['doctor_id'];

    $conf = $conn->prepare("
        SELECT a.appointment_id, u.full_name AS doctor_name, a.doctor_id, a.app_time
        FROM appointments a 
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.patient_id = ? 
          AND a.app_date = ? 
          AND (a.doctor_id = ? OR a.app_time = ?)
          AND a.status <> 'Cancelled' 
        LIMIT 1
    ");
    $conf->bind_param('ssss', $patient_id, $dateStr, $docId, $timeStr);
    $conf->execute();
    $conflict_row = $conf->get_result()->fetch_assoc();
    $conf->close();

    if ($conflict_row) {
        if ($conflict_row['doctor_id'] == $docId) {
            $msg = "You already have an appointment with " . $conflict_row['doctor_name'] . " on this date. Multiple bookings with the same doctor on the same day are not allowed.";
        } else {
            $msg = "You already have an appointment at " . date("h:i A", strtotime($timeStr)) . " with " . $conflict_row['doctor_name'] . " on this date.";
        }
        echo json_encode(['status' => 'error', 'message' => $msg]);
        $conn->close();
        exit;
    }

    // Reserve slot by marking as Booked
    $bookSlot = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ?");
    $bookSlot->bind_param('i', $avail_id);
    $bookSlot->execute();
    $bookSlot->close();

    // Get doctor fee directly from doctor_profiles
    $docProfileStmt = $conn->prepare("
        SELECT dp.specialization, dp.consultation_fee 
        FROM doctor_profiles dp
        WHERE dp.user_id = ? LIMIT 1
    ");
    $docProfileStmt->bind_param('s', $doctor_id);
    $docProfileStmt->execute();
    $docProfileData = $docProfileStmt->get_result()->fetch_assoc();
    $docProfileStmt->close();
    
    $specialization = $docProfileData['specialization'] ?? 'General Consultation';
    $fee = isset($docProfileData['consultation_fee']) ? (float)$docProfileData['consultation_fee'] : 500.00;
    
    error_log("eSewa Payment Init: doctor_id={$doctor_id}, specialization={$specialization}, fee={$fee}");
    
    $amount_paisa = $fee * 100; // Keep paisa internally for DB records

    // Generate unique transaction UUID
    $transaction_uuid = 'APT-' . $patient['user_id'] . '-' . time();

    // Store booking details for later
    $booking_data = json_encode([
        'slot_date' => $slot['available_date'],
        'slot_time' => $slot['start_time'] . ' - ' . $slot['end_time'],
        'reason' => $reason,
        'avail_id' => $avail_id,
        'doctor_id' => $doctor_id,
    ]);

    // Insert payment record (pidx column will hold our unique transaction UUID)
    $payInsert = $conn->prepare("
        INSERT INTO appointment_payments 
        (patient_id, doctor_id, avail_id, payment_method, amount_paisa, 
         amount_rupees, pidx, payment_status, booking_payload, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'eSewa', ?, ?, ?, 'Pending', ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW(), NOW())
    ");
    
    $amount_rupees = (float)$fee;
    $payInsert->bind_param('ssiidss', 
        $patient['user_id'], 
        $doctor_id, 
        $avail_id, 
        $amount_paisa, 
        $amount_rupees, 
        $transaction_uuid,
        $booking_data
    );
    $payInsert->execute();
    $payment_id = $payInsert->insert_id;
    $payInsert->close();

    if (!$payment_id) {
        throw new Exception('Payment record creation failed');
    }

    $conn->commit();

    // Return success with redirect URL pointing to our auto-submitter
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'payment_url' => 'api/patient/esewa_redirect.php?payment_id=' . $payment_id,
        'payment_id' => $payment_id,
        'transaction_uuid' => $transaction_uuid,
        'amount_rupees' => $amount_rupees,
    ]);

} catch (Exception $e) {
    $conn->rollback();

    // Release booked slot on error
    $rel = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
    $rel->bind_param('i', $avail_id);
    @$rel->execute();
    $rel->close();

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage() ?? 'Payment initiation failed',
    ]);
}

$conn->close();
