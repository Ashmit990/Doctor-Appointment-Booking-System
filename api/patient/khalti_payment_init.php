<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$doctor_id = $input['doctor_id'] ?? '';
$avail_id = isset($input['avail_id']) ? (int)$input['avail_id'] : 0;
$reason = trim($input['reason_for_visit'] ?? $input['reason'] ?? '');

if ($doctor_id === '' || $avail_id < 1) {
    echo json_encode(['status' => 'error', 'message' => 'doctor_id and avail_id are required']);
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    // Close past slots for today
    $today = date('Y-m-d');
    $current_time = date('H:i:s');
    $close_stmt = $conn->prepare("UPDATE doctor_availability SET status = 'Closed' WHERE available_date = ? AND status = 'Available' AND start_time < ?");
    $close_stmt->bind_param('ss', $today, $current_time);
    $close_stmt->execute();
    $close_stmt->close();

    // Lock the slot
    $stmt = $conn->prepare("SELECT avail_id, doctor_id, available_date, start_time, end_time, status FROM doctor_availability WHERE avail_id = ? FOR UPDATE");
    $stmt->bind_param('i', $avail_id);
    $stmt->execute();
    $slot = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$slot || $slot['doctor_id'] != $doctor_id || $slot['status'] !== 'Available') {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'This time slot is no longer available']);
        $conn->close();
        exit;
    }

    // Prevent double booking
    $app_date = (string) $slot['available_date'];
    $app_time = (string) $slot['start_time'];
    $app_doc  = (string) $slot['doctor_id'];

    $conf = $conn->prepare("SELECT a.appointment_id, u.full_name AS doctor_name, a.doctor_id FROM appointments a LEFT JOIN users u ON a.doctor_id = u.user_id WHERE a.patient_id = ? AND a.app_date = ? AND (a.doctor_id = ? OR a.app_time = ?) AND a.status <> 'Cancelled' LIMIT 1");
    $conf->bind_param('ssss', $patient_id, $app_date, $app_doc, $app_time);
    $conf->execute();
    $conflict_row = $conf->get_result()->fetch_assoc();
    $conf->close();

    if ($conflict_row) {
        $existing_doctor = trim((string) ($conflict_row['doctor_name'] ?? 'another doctor'));
        $conn->rollback();
        if ($conflict_row['doctor_id'] == $app_doc) {
            $msg = 'You already have an appointment with ' . $existing_doctor . ' on this date. Multiple bookings with the same doctor on the same day are not allowed.';
        } else {
            $msg = 'You already have an appointment at ' . date("h:i A", strtotime($app_time)) . ' on this date with ' . $existing_doctor . '.';
        }
        echo json_encode(['status' => 'error', 'message' => $msg]);
        $conn->close();
        exit;
    }

    // Reserve slot
    $upd = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ? AND status = 'Available'");
    $upd->bind_param('i', $avail_id);
    if (!$upd->execute() || $upd->affected_rows !== 1) {
        $msg = $upd->error ?: $conn->error;
        $upd->close();
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Could not reserve slot: ' . $msg]);
        $conn->close();
        exit;
    }
    $upd->close();

    // Fetch patient details for Khalti payload
    $pn = $conn->prepare('SELECT full_name, email, contact_number FROM users WHERE user_id = ?');
    $pn->bind_param('s', $patient_id);
    $pn->execute();
    $patient_row = $pn->get_result()->fetch_assoc() ?: [];
    $pn->close();

    // Get doctor fee
    $docProfileStmt = $conn->prepare('SELECT consultation_fee FROM doctor_profiles WHERE user_id = ? LIMIT 1');
    $docProfileStmt->bind_param('s', $doctor_id);
    $docProfileStmt->execute();
    $docProfileData = $docProfileStmt->get_result()->fetch_assoc();
    $docProfileStmt->close();
    $fee = isset($docProfileData['consultation_fee']) ? (float)$docProfileData['consultation_fee'] : 500.00;

    $amount_paisa = (int) round($fee * 100);

    // Prepare Khalti API call
    $config = khalti_payment_config();
    $khalti_init_url = rtrim($config['api_base'], '/') . '/epayment/initiate/';

    $khalti_payload = [
        'return_url' => $config['return_url'],
        'website_url' => rtrim(patient_app_base_url(), '/'),
        'amount' => $amount_paisa,
        'purchase_order_id' => 'APT-' . $patient_id . '-' . time(),
        'purchase_order_name' => 'Doctor Appointment',
        'customer_name' => $patient_row['full_name'] ?? '',
        'customer_email' => $patient_row['email'] ?? '',
        'customer_phone' => $patient_row['contact_number'] ?? '',
    ];

    // Call Khalti
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $khalti_init_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($khalti_payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Key ' . $config['secret_key'],
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $khalti_response = curl_exec($ch);
    $khalti_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $khalti_error = curl_error($ch);
    curl_close($ch);

    if ($khalti_http_code !== 200) {
        $conn->rollback();
        // Release booked slot
        $rel = $conn->prepare('UPDATE doctor_availability SET status = "Available" WHERE avail_id = ?');
        $rel->bind_param('i', $avail_id);
        @ $rel->execute();
        $rel->close();

        http_response_code(502);
        error_log("Khalti API Error (HTTP $khalti_http_code): " . substr($khalti_response ?? '', 0, 1000) . " | cURL: " . $khalti_error);
        echo json_encode(['status' => 'error', 'message' => 'Khalti API error: Unable to initiate payment (HTTP ' . $khalti_http_code . ').']);
        $conn->close();
        exit;
    }

    $khalti_data = json_decode($khalti_response, true);
    if (!is_array($khalti_data) || !isset($khalti_data['pidx']) || !isset($khalti_data['payment_url'])) {
        $conn->rollback();
        $rel = $conn->prepare('UPDATE doctor_availability SET status = "Available" WHERE avail_id = ?');
        $rel->bind_param('i', $avail_id);
        @ $rel->execute();
        $rel->close();

        error_log('Invalid Khalti response: ' . substr($khalti_response ?? '', 0, 1000));
        http_response_code(502);
        echo json_encode(['status' => 'error', 'message' => 'Invalid response from Khalti']);
        $conn->close();
        exit;
    }

    $pidx = $khalti_data['pidx'];
    $khalti_payment_url = $khalti_data['payment_url'];

    $booking_data = json_encode([
        'slot_date' => $slot['available_date'],
        'slot_time' => $slot['start_time'] . ' - ' . $slot['end_time'],
        'reason' => $reason,
        'avail_id' => $avail_id,
        'doctor_id' => $doctor_id,
    ]);

    // Insert payment record
    $payInsert = $conn->prepare("INSERT INTO appointment_payments (patient_id, doctor_id, avail_id, payment_method, amount_paisa, amount_rupees, pidx, payment_status, booking_payload, expires_at, created_at, updated_at) VALUES (?, ?, ?, 'Khalti', ?, ?, ?, 'Pending', ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW(), NOW())");
    $amount_rupees = (float)$fee;
    $payInsert->bind_param('ssiidss', $patient_id, $doctor_id, $avail_id, $amount_paisa, $amount_rupees, $pidx, $booking_data);
    if (!$payInsert->execute()) {
        $msg = $payInsert->error ?: $conn->error;
        $payInsert->close();
        $conn->rollback();
        $rel = $conn->prepare('UPDATE doctor_availability SET status = "Available" WHERE avail_id = ?');
        $rel->bind_param('i', $avail_id);
        @ $rel->execute();
        $rel->close();
        echo json_encode(['status' => 'error', 'message' => 'Could not create payment record: ' . $msg]);
        $conn->close();
        exit;
    }

    $payment_id = (int) $conn->insert_id;
    $payInsert->close();

    if ($payment_id < 1) {
        $conn->rollback();
        $rel = $conn->prepare('UPDATE doctor_availability SET status = "Available" WHERE avail_id = ?');
        $rel->bind_param('i', $avail_id);
        @ $rel->execute();
        $rel->close();
        echo json_encode(['status' => 'error', 'message' => 'Payment record creation failed']);
        $conn->close();
        exit;
    }

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'payment_url' => $khalti_payment_url,
        'payment_id' => $payment_id,
        'pidx' => $pidx,
        'amount_rupees' => $amount_rupees,
    ]);

} catch (Throwable $e) {
    $conn->rollback();
    // Try to release slot
    if (isset($avail_id) && $avail_id) {
        $rel = $conn->prepare('UPDATE doctor_availability SET status = "Available" WHERE avail_id = ?');
        $rel->bind_param('i', $avail_id);
        @ $rel->execute();
        $rel->close();
    }

    http_response_code(500);
    error_log('Khalti init exception: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
