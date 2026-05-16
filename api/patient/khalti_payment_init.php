<?php
/**
 * Khalti Payment Initialization
 * Server-side payment initiation per Khalti API docs
 * https://docs.khalti.com/khalti-epayment/#initiating-a-payment-request
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

$config = khalti_payment_config();

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

    // New Conflict Rules:
    // 1. Cannot book the same doctor twice on the same day (regardless of time).
    // 2. Cannot book any doctor at the same time (time conflict).
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

    // Get doctor fee from treatment_categories based on doctor's specialization
    // First, get doctor's specialization
    $docSpecStmt = $conn->prepare("
        SELECT dp.specialization 
        FROM doctor_profiles dp
        WHERE dp.user_id = ? LIMIT 1
    ");
    $docSpecStmt->bind_param('s', $doctor_id);
    $docSpecStmt->execute();
    $docSpecData = $docSpecStmt->get_result()->fetch_assoc();
    $docSpecStmt->close();
    
    $specialization = $docSpecData['specialization'] ?? 'General Consultation';
    
    // Try exact match first, then try LIKE for flexible matching
    $treatStmt = $conn->prepare("
        SELECT estimated_cost 
        FROM treatment_categories 
        WHERE LOWER(name) = LOWER(?) 
           OR LOWER(name) LIKE CONCAT('%', LOWER(?), '%')
           OR LOWER(?) LIKE CONCAT('%', SUBSTRING(LOWER(name), 1, 5), '%')
        LIMIT 1
    ");
    $treatStmt->bind_param('sss', $specialization, $specialization, $specialization);
    $treatStmt->execute();
    $treatData = $treatStmt->get_result()->fetch_assoc();
    $treatStmt->close();
    
    $fee = (int)($treatData['estimated_cost'] ?? 500);
    
    // Log for debugging
    error_log("Khalti Payment Init: doctor_id={$doctor_id}, specialization={$specialization}, fee={$fee}");
    
    $amount_paisa = $fee * 100; // Convert to paisa

    // Khalti requires minimum 1000 paisa (Rs. 10)
    if ($amount_paisa < 1000) {
        $amount_paisa = 1000;
    }

    // Fetch doctor's name for display
    $docNameStmt = $conn->prepare("SELECT full_name FROM users WHERE user_id = ? LIMIT 1");
    $docNameStmt->bind_param('s', $doctor_id);
    $docNameStmt->execute();
    $docNameData = $docNameStmt->get_result()->fetch_assoc();
    $docNameStmt->close();
    $doctor_name = $docNameData['full_name'] ?? 'Doctor';

    // Generate unique purchase order ID
    $purchase_order_id = 'APT-' . $patient['user_id'] . '-' . time();
    $purchase_order_name = 'Doctor Appointment';

    // Store booking details for later
    $booking_data = json_encode([
        'slot_date' => $slot['available_date'],
        'slot_time' => $slot['start_time'] . ' - ' . $slot['end_time'],
        'reason' => $reason,
        'avail_id' => $avail_id,
        'doctor_id' => $doctor_id,
    ]);

    // Insert payment record
    $payInsert = $conn->prepare("
        INSERT INTO appointment_payments 
        (patient_id, doctor_id, avail_id, payment_method, amount_paisa, 
         amount_rupees, payment_status, booking_payload, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'khalti', ?, ?, 'Initiated', ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW(), NOW())
    ");
    
    $amount_rupees = (float)$fee;
    $payInsert->bind_param('ssiids', 
        $patient['user_id'], 
        $doctor_id, 
        $avail_id, 
        $amount_paisa, 
        $amount_rupees, 
        $booking_data
    );
    $payInsert->execute();
    $payment_id = $payInsert->insert_id;
    $payInsert->close();

    if (!$payment_id) {
        throw new Exception('Payment record creation failed');
    }

    $conn->commit();

    // Prepare Khalti API payload per official docs
    $khalti_payload = [
        'return_url' => $config['return_url'],
        'website_url' => $config['website_url'],
        'amount' => $amount_paisa,
        'purchase_order_id' => $purchase_order_id,
        'purchase_order_name' => 'Medical Consultation - ' . $doctor_name,
        'customer_info' => [
            'name' => $patient['full_name'] ?? 'Patient',
            'email' => $patient['email'],
            'phone' => $patient['contact_number'],
        ],
        'amount_breakdown' => [
            [
                'label' => 'Consultation Fee',
                'amount' => $amount_paisa,
            ]
        ],
        'product_details' => [
            [
                'identity' => 'consultation_' . $doctor_id,
                'name' => 'Consultation with ' . $doctor_name,
                'description' => 'Medical consultation appointment',
                'total_price' => $amount_paisa,
                'quantity' => 1,
                'unit_price' => $amount_paisa,
            ]
        ],
    ];

    // Call Khalti /epayment/initiate/ endpoint
    $khalti_response = khalti_post_json(
        $config['api_base'] . '/epayment/initiate/',
        $khalti_payload,
        $config['secret_key']
    );

    if (!$khalti_response['success']) {
        // Release slot on API failure
        $rel = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $rel->bind_param('i', $avail_id);
        @$rel->execute();
        $rel->close();

        // Log detailed error for debugging
        error_log('Khalti API Error: ' . json_encode([
            'http_code' => $khalti_response['http_code'] ?? 'unknown',
            'message' => $khalti_response['message'] ?? 'Unknown',
            'raw_response' => substr($khalti_response['raw'] ?? '', 0, 500),
        ]));

        $http_code = $khalti_response['http_code'] ?? 502;
        http_response_code($http_code);
        
        $errorMsg = $khalti_response['message'] ?? 'Unknown error';
        
        // Descriptive error based on status code
        if ($khalti_response['is_auth_error'] ?? false) {
            $errorMsg = 'Invalid Khalti credentials. Please check your KHALTI_SECRET_KEY in .env';
        } else if ($khalti_response['is_maintenance'] ?? false) {
            $errorMsg = 'Khalti payment server is currently undergoing maintenance or is slow (504/500). Please try again in a few minutes.';
        }

        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to initiate payment: ' . $errorMsg,
        ]);
        exit;
    }

    $khalti_data = $khalti_response['data'] ?? [];
    $pidx = $khalti_data['pidx'] ?? '';
    $payment_url = $khalti_data['payment_url'] ?? '';
    $expires_in = (int)($khalti_data['expires_in'] ?? 1800);

    if (!$pidx || !$payment_url) {
        http_response_code(502);
        echo json_encode(['status' => 'error', 'message' => 'Invalid Khalti response']);
        exit;
    }

    // Save pidx to database
    $upd = $conn->prepare("
        UPDATE appointment_payments 
        SET pidx = ?, payment_status = 'Pending', gateway_response = ?, updated_at = NOW()
        WHERE payment_id = ?
    ");
    $resp_json = json_encode($khalti_data);
    $upd->bind_param('ssi', $pidx, $resp_json, $payment_id);
    $upd->execute();
    $upd->close();

    // Return success with redirect URL
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'payment_url' => $payment_url,
        'pidx' => $pidx,
        'payment_id' => $payment_id,
        'amount_paisa' => $amount_paisa,
        'amount_rupees' => $amount_rupees,
        'expires_in' => $expires_in,
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
