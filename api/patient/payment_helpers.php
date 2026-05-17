<?php

// Load .env file if it exists
if (!function_exists('load_env_file')) {
    function load_env_file(): void {
        $envFile = __DIR__ . '/../../.env';
        if (!file_exists($envFile)) return;

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            // Skip comments
            if (strpos($line, '#') === 0) continue;
            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // Only set if not already set by system
                if (!getenv($key)) {
                    putenv("{$key}={$value}");
                }
            }
        }
    }
    load_env_file();
}

if (!function_exists('patient_app_base_url')) {
    function patient_app_base_url(): string
    {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $basePath = rtrim(dirname(dirname(dirname($script))), '/\\');

        return $scheme . '://' . $host . ($basePath ? $basePath : '');
    }
}

if (!function_exists('esewa_payment_config')) {
    function esewa_payment_config(): array
    {
        $apiBase = rtrim(getenv('ESEWA_API_BASE') ?: 'https://rc-epay.esewa.com.np/api/epay', '/');
        $merchantCode = trim(getenv('ESEWA_MERCHANT_CODE') ?: 'EPAYTEST');
        $secretKey = trim(getenv('ESEWA_SECRET_KEY') ?: '8gBm/:&EnhH.1/q');
        $returnUrl = trim(getenv('ESEWA_RETURN_URL') ?: patient_app_base_url() . '/api/patient/esewa_payment_callback.php');

        return [
            'api_base' => $apiBase,
            'merchant_code' => $merchantCode,
            'secret_key' => $secretKey,
            'return_url' => $returnUrl,
        ];
    }
}

if (!function_exists('esewa_verify_signature')) {
    function esewa_verify_signature(array $decoded_data): bool
    {
        $config = esewa_payment_config();
        $secretKey = $config['secret_key'];
        
        $signature = $decoded_data['signature'] ?? '';
        $signed_field_names = $decoded_data['signed_field_names'] ?? '';
        
        if (!$signature || !$signed_field_names) {
            return false;
        }
        
        $fields = explode(',', $signed_field_names);
        $message_parts = [];
        foreach ($fields as $field) {
            $field = trim($field);
            if (isset($decoded_data[$field])) {
                $message_parts[] = "$field=" . $decoded_data[$field];
            }
        }
        
        $message = implode(',', $message_parts);
        $generated_signature = base64_encode(hash_hmac('sha256', $message, $secretKey, true));
        
        return hash_equals($signature, $generated_signature);
    }
}

if (!function_exists('esewa_get_status')) {
    function esewa_get_status(string $transaction_uuid, float $total_amount): array
    {
        $config = esewa_payment_config();
        
        // eSewa status verification URL
        $url = $config['api_base'] . '/transaction/status/?' . http_build_query([
            'product_code' => $config['merchant_code'],
            'total_amount' => number_format($total_amount, 2, '.', ''),
            'transaction_uuid' => $transaction_uuid
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'success' => false,
                'status' => 'Unknown',
                'message' => $curlError ?: 'Unable to contact eSewa status endpoint'
            ];
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'status' => 'Unknown',
                'message' => 'Invalid JSON response from eSewa status endpoint'
            ];
        }

        return [
            'success' => isset($decoded['status']) && $decoded['status'] === 'COMPLETE',
            'status' => $decoded['status'] ?? 'Unknown',
            'data' => $decoded
        ];
    }
}

if (!function_exists('complete_appointment_payment')) {
    /**
     * Centralized function to complete an appointment after successful payment.
     * Used by both callback and polling logic to ensure consistency.
     */
    function complete_appointment_payment(mysqli $conn, int $payment_id, array $gateway_data): array {
        $verified_status = $gateway_data['status'] ?? 'Unknown';
        $verified_txn_id = $gateway_data['transaction_id'] ?? '';

        // 1. Fetch the payment record
        $stmt = $conn->prepare("SELECT * FROM appointment_payments WHERE payment_id = ? FOR UPDATE");
        $stmt->bind_param('i', $payment_id);
        $stmt->execute();
        $payment = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$payment) return ['success' => false, 'message' => 'Payment record not found'];
        if ($payment['payment_status'] === 'Completed') return ['success' => true, 'appointment_id' => $payment['appointment_id']];

        $conn->begin_transaction();
        try {
            // 2. Parse booking details
            $booking = json_decode($payment['booking_payload'] ?? '{}', true) ?? [];
            $appt_date = $booking['slot_date'] ?? date('Y-m-d');
            $appt_time = $booking['slot_time'] ?? '09:00:00';
            $appt_reason = $booking['reason'] ?? 'Appointment booked via eSewa';
            $room_num = 'Room A1';

            // 3. Double-check conflict (no same doctor on same day, no same time slot)
            $conf = $conn->prepare("SELECT a.appointment_id, u.full_name AS doctor_name, a.doctor_id FROM appointments a JOIN users u ON a.doctor_id = u.user_id WHERE a.patient_id = ? AND a.app_date = ? AND (a.doctor_id = ? OR a.app_time = ?) AND a.status <> 'Cancelled' LIMIT 1");
            $docId = $payment['doctor_id'];
            $conf->bind_param('ssss', $payment['patient_id'], $appt_date, $docId, $appt_time);
            $conf->execute();
            $conflict = $conf->get_result()->fetch_assoc();
            $conf->close();
            
            if ($conflict) {
                if ($conflict['doctor_id'] == $docId) {
                    throw new Exception("Conflict: You already have an appointment with " . $conflict['doctor_name'] . " on this date. Multiple bookings with the same doctor on the same day are not allowed.");
                } else {
                    throw new Exception("Conflict: You already have an appointment at " . date("h:i A", strtotime($appt_time)) . " with " . $conflict['doctor_name'] . " on this date.");
                }
            }

            // 4. Create appointment
            $appt_insert = $conn->prepare("INSERT INTO appointments (patient_id, doctor_id, app_date, app_time, room_num, reason_for_visit, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Upcoming', NOW())");
            $appt_insert->bind_param('ssssss', $payment['patient_id'], $payment['doctor_id'], $appt_date, $appt_time, $room_num, $appt_reason);
            $appt_insert->execute();
            $appointment_id = $appt_insert->insert_id;
            $appt_insert->close();

            // 5. Generate Ticket (Optional but standard in this app)
            $astmt = $conn->prepare("SELECT specialization FROM doctor_profiles WHERE user_id = ?");
            $astmt->bind_param("s", $payment['doctor_id']);
            $astmt->execute();
            $spec = $astmt->get_result()->fetch_assoc()['specialization'] ?? '';
            $astmt->close();

            $cat = null;
            if (!empty($spec)) {
                $cstmt = $conn->prepare("
                    SELECT id, estimated_cost FROM treatment_categories 
                    WHERE LOWER(name) = LOWER(?) 
                       OR LOWER(name) LIKE CONCAT('%', LOWER(?), '%')
                       OR LOWER(?) LIKE CONCAT('%', SUBSTRING(LOWER(name), 1, 5), '%')
                    LIMIT 1
                ");
                $cstmt->bind_param("sss", $spec, $spec, $spec);
                $cstmt->execute();
                $cat = $cstmt->get_result()->fetch_assoc();
                $cstmt->close();
            }
            
            // Fallback to General Consultation if no specific match
            if (!$cat) {
                $cat = $conn->query("SELECT id, estimated_cost FROM treatment_categories WHERE name = 'General Consultation' LIMIT 1")->fetch_assoc();
            }
            
            if ($cat && $appointment_id) {
                $ticket_number = 'TKT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
                $cost = (float)$cat['estimated_cost'];
                $cat_id = (int)$cat['id'];
                $ins = $conn->prepare("INSERT INTO treatment_tickets (ticket_number, patient_id, appointment_id, category_id, cost, generated_at) VALUES (?, ?, ?, ?, ?, NOW())");
                $ins->bind_param("ssiid", $ticket_number, $payment['patient_id'], $appointment_id, $cat_id, $cost);
                $ins->execute();
                $ins->close();
            }

            // 6. Update Payment Record
            $upd = $conn->prepare("UPDATE appointment_payments SET appointment_id = ?, payment_status = 'Completed', transaction_id = ?, callback_status = ?, verified_at = NOW(), updated_at = NOW() WHERE payment_id = ?");
            $upd->bind_param('issi', $appointment_id, $verified_txn_id, $verified_status, $payment_id);
            $upd->execute();
            $upd->close();

            // 7. Record Earnings
            $earnAmount = (float)$payment['amount_rupees'];
            if ($earnAmount > 0) {
                $earn = $conn->prepare("INSERT INTO earnings (doctor_id, appointment_id, amount, payment_date) VALUES (?, ?, ?, NOW())");
                $earn->bind_param('sid', $payment['doctor_id'], $appointment_id, $earnAmount);
                $earn->execute();
                $earn->close();
            }

            // 8. Notify Doctor
            $notif = $conn->prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, 'New Booking', 'A patient has booked an appointment via eSewa.', NOW())");
            $notif->bind_param('s', $payment['doctor_id']);
            @$notif->execute();
            $notif->close();

            $conn->commit();
            return ['success' => true, 'appointment_id' => $appointment_id];
        } catch (Exception $e) {
            $conn->rollback();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}

if (!function_exists('release_expired_payment_holds')) {
    function release_expired_payment_holds(mysqli $conn): void
    {
        $stmt = $conn->prepare("SELECT payment_id, avail_id FROM appointment_payments WHERE payment_status IN ('Initiated', 'Pending') AND expires_at < NOW()");
        if (!$stmt) {
            return;
        }

        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (!$rows) {
            return;
        }

        foreach ($rows as $row) {
            $paymentId = (int) ($row['payment_id'] ?? 0);
            $availId = (int) ($row['avail_id'] ?? 0);

            if ($availId > 0) {
                $freeSlot = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ? AND status = 'Booked'");
                if ($freeSlot) {
                    $freeSlot->bind_param('i', $availId);
                    $freeSlot->execute();
                    $freeSlot->close();
                }
            }

            if ($paymentId > 0) {
                $update = $conn->prepare("UPDATE appointment_payments SET payment_status = 'Expired', callback_status = 'Expired', updated_at = NOW() WHERE payment_id = ? AND payment_status IN ('Initiated', 'Pending')");
                if ($update) {
                    $update->bind_param('i', $paymentId);
                    $update->execute();
                    $update->close();
                }
            }
        }
    }
}

if (!function_exists('ensure_appointment_payments_table')) {
    function ensure_appointment_payments_table(mysqli $conn): void
    {
        $conn->query("
            CREATE TABLE IF NOT EXISTS appointment_payments (
              payment_id int(11) NOT NULL AUTO_INCREMENT,
              appointment_id int(11) DEFAULT NULL,
              patient_id varchar(20) NOT NULL,
              doctor_id varchar(20) NOT NULL,
              avail_id int(11) NOT NULL,
              payment_method varchar(30) NOT NULL DEFAULT 'eSewa',
              pidx varchar(100) DEFAULT NULL,
              transaction_id varchar(100) DEFAULT NULL,
              amount_paisa int(11) NOT NULL,
              amount_rupees decimal(10,2) NOT NULL,
              payment_status enum('Initiated','Pending','Completed','Failed','Expired','Cancelled','Refunded') NOT NULL DEFAULT 'Initiated',
              booking_payload longtext NOT NULL,
              gateway_response longtext DEFAULT NULL,
              callback_status varchar(40) DEFAULT NULL,
              expires_at timestamp NOT NULL,
              verified_at timestamp NULL DEFAULT NULL,
              created_at timestamp NOT NULL DEFAULT current_timestamp(),
              updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (payment_id),
              UNIQUE KEY uq_appointment_payments_pidx (pidx),
              KEY idx_appointment_payments_appointment_id (appointment_id),
              KEY idx_appointment_payments_patient_id (patient_id),
              KEY idx_appointment_payments_avail_id (avail_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ");
    }
}

if (!function_exists('patient_apply_payment_display_fields')) {
    /**
     * Sets payment_status_key and payment_status_label for patient-facing appointment rows.
     * Doctor-scheduled follow-ups (parent row has next_followup_id = this appointment) show
     * "Followup" instead of "Unpaid" when there is no completed payment yet.
     */
    function patient_apply_payment_display_fields(array &$row, bool $isFollowupVisit): void
    {
        $raw = $row['payment_status'] ?? null;
        $psKey = is_string($raw) && $raw !== '' ? strtolower($raw) : 'unpaid';
        $row['payment_status_key'] = $psKey;

        if ($isFollowupVisit && $psKey === 'unpaid') {
            $row['payment_status_label'] = 'Followup';
            $row['payment_status_key'] = 'followup';
            return;
        }

        $row['payment_status_label'] = is_string($raw) && $raw !== ''
            ? ucfirst(strtolower($raw))
            : 'Unpaid';
    }
}