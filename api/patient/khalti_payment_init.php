<?php
/**
 * Khalti Payment Initialization
 * Server-side payment initiation per Khalti API specifications
 */

header('Content-Type: application/json; charset=utf-8');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    // Make API request to Khalti using secret key
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
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $khalti_response = curl_exec($ch);
    $khalti_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $khalti_error = curl_error($ch);
    curl_close($ch);

    // If 401, try again using public key as a fallback (helps diagnose swapped keys)
    if ($khalti_http_code === 401) {
        error_log("Khalti Init: received 401 with secret key, retrying with public key");
        $ch2 = curl_init();
        curl_setopt_array($ch2, [
            CURLOPT_URL => $khalti_init_url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($khalti_payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Key ' . $config['public_key'],
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $khalti_response_retry = curl_exec($ch2);
        $khalti_http_code_retry = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        $khalti_error_retry = curl_error($ch2);
        curl_close($ch2);

        error_log("Khalti Init retry HTTP: $khalti_http_code_retry, response: " . substr($khalti_response_retry ?? '', 0, 1000));

        // Prefer the retry response if it succeeded
        if ($khalti_http_code_retry === 200) {
            $khalti_response = $khalti_response_retry;
            $khalti_http_code = $khalti_http_code_retry;
            $khalti_error = $khalti_error_retry;
        }
    }

    if ($khalti_http_code !== 200) {
        $conn->rollback();
        http_response_code(502);
        error_log("Khalti API Error (HTTP $khalti_http_code): " . substr($khalti_response ?? '', 0, 200) . " | cURL Error: " . $khalti_error);
        echo json_encode([
            'status' => 'error',
            'message' => 'Khalti API error: Unable to initiate payment (HTTP ' . $khalti_http_code . '). Check your Khalti keys and network connectivity.',
            'khalti_http_code' => $khalti_http_code,
            'khalti_response' => $khalti_response ?? null,
        ]);
        exit;
    }

    $khalti_data = json_decode($khalti_response, true);
    if (!isset($khalti_data['pidx']) || !isset($khalti_data['payment_url'])) {
        $conn->rollback();
        http_response_code(502);
        error_log("Invalid Khalti response: " . substr($khalti_response ?? '', 0, 1000));
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid response from Khalti',
            'khalti_response' => $khalti_response ?? null,
        ]);
        exit;
    }

    $pidx = $khalti_data['pidx'];
    $khalti_payment_url = $khalti_data['payment_url'];
    if (!$slot || $slot['status'] !== 'Available') {
        $conn->rollback();
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'Slot no longer available']);
        exit;
    }

    // Check for conflicts
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
        $conn->rollback();
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => $msg]);
        exit;
    }

    // Reserve slot
    $bookSlot = $conn->prepare("UPDATE doctor_availability SET status = 'Booked' WHERE avail_id = ?");
    $bookSlot->bind_param('i', $avail_id);
    $bookSlot->execute();
    $bookSlot->close();

    // Get doctor fee
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
    
    error_log("Khalti Payment Init: doctor_id={$doctor_id}, specialization={$specialization}, fee={$fee}");
    
    $amount_paisa = $fee * 100; // Khalti works in paisa

    // Call Khalti API to initiate payment and get pidx
    $config = khalti_payment_config();
    
    $khalti_init_url = $config['api_base'] . '/epayment/initiate/';
    
    $khalti_payload = [
        'return_url' => $config['return_url'],
        'website_url' => rtrim(patient_app_base_url(), '/'),
        'amount' => (int)$amount_paisa,
        'purchase_order_id' => 'APT-' . $patient['user_id'] . '-' . time(),
        'purchase_order_name' => 'Doctor Appointment',
        'customer_name' => $patient['full_name'],
        'customer_email' => $patient['email'] ?? '',
        'customer_phone' => $patient['contact_number'] ?? '',
    ];

    // Make API request to Khalti
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
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    
    $khalti_response = curl_exec($ch);
    $khalti_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $khalti_error = curl_error($ch);
    curl_close($ch);

    if ($khalti_http_code !== 200) {
        $conn->rollback();
        http_response_code(502);
        error_log("Khalti API Error (HTTP $khalti_http_code): " . $khalti_response . " | cURL Error: " . $khalti_error);
        echo json_encode([
            'status' => 'error',
            'message' => 'Khalti API error: Unable to initiate payment (HTTP ' . $khalti_http_code . '). Please try again.'
        ]);
        exit;
    }

    $khalti_data = json_decode($khalti_response, true);
    if (!isset($khalti_data['pidx']) || !isset($khalti_data['payment_url'])) {
        $conn->rollback();
        http_response_code(502);
        error_log("Invalid Khalti response: " . $khalti_response);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid response from Khalti'
        ]);
        exit;
    }

    $pidx = $khalti_data['pidx'];
    $khalti_payment_url = $khalti_data['payment_url'];

    // Store booking details
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
         amount_rupees, pidx, payment_status, booking_payload, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'Khalti', ?, ?, ?, 'Pending', ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW(), NOW())
    ");
    
    $amount_rupees = (float)$fee;
    $payInsert->bind_param('ssiidss', 
        $patient['user_id'], 
        $doctor_id, 
        $avail_id, 
        $amount_paisa, 
        $amount_rupees, 
        $pidx,
        $booking_data
    );
    $payInsert->execute();
    $payment_id = $payInsert->insert_id;
    $payInsert->close();

    if (!$payment_id) {
        throw new Exception('Payment record creation failed');
    }

    $conn->commit();

    // Return success with Khalti payment URL
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'payment_url' => $khalti_payment_url ?? 'https://test-pay.khalti.com/?pidx=' . urlencode($pidx) . '&public_key=' . urlencode($config['public_key']),
        'payment_id' => $payment_id,
        'pidx' => $pidx,
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
