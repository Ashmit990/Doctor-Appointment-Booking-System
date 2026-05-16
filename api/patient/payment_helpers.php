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

if (!function_exists('khalti_payment_config')) {
    function khalti_payment_config(): array
    {
        $apiBase = rtrim(getenv('KHALTI_API_BASE') ?: 'https://dev.khalti.com/api/v2', '/');
        $secretKey = trim(getenv('KHALTI_SECRET_KEY') ?: '');
        $websiteUrl = rtrim(getenv('KHALTI_WEBSITE_URL') ?: patient_app_base_url(), '/');
        $returnUrl = trim(getenv('KHALTI_RETURN_URL') ?: patient_app_base_url() . '/api/patient/khalti_payment_callback.php');

        // Fix for local testing: Browsers block redirects from public sites (Khalti) to local networks (localhost/LAN).
        // To prevent the scary "Connection Blocked" error page, we redirect back to Khalti's site for local testing.
        // The actual payment verification is safely handled by the dashboard's background polling.
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        if (preg_match('/localhost|127\.0\.0\.1|^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./', $host)) {
            $returnUrl = 'https://khalti.com/';
        }

        return [
            'api_base' => $apiBase,
            'secret_key' => $secretKey,
            'website_url' => $websiteUrl ?: patient_app_base_url(),
            'return_url' => $returnUrl,
        ];
    }
}

if (!function_exists('complete_appointment_payment')) {
    /**
     * Centralized function to complete an appointment after successful payment.
     * Used by both callback and polling logic to ensure consistency.
     */
    function complete_appointment_payment(mysqli $conn, int $payment_id, array $khalti_data): array {
        $verified_status = $khalti_data['status'] ?? 'Unknown';
        $verified_txn_id = $khalti_data['transaction_id'] ?? '';

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
            $appt_reason = $booking['reason'] ?? 'Appointment booked via Khalti';
            $room_num = 'Room A1';

            // 3. Double-check conflict (one appt per patient per day)
            $conf = $conn->prepare("SELECT appointment_id FROM appointments WHERE patient_id = ? AND app_date = ? AND status <> 'Cancelled' LIMIT 1");
            $conf->bind_param('ss', $payment['patient_id'], $appt_date);
            $conf->execute();
            if ($conf->get_result()->fetch_assoc()) {
                $conf->close();
                throw new Exception('Conflict: Appointment already exists for this date.');
            }
            $conf->close();

            // 4. Create appointment
            $appt_insert = $conn->prepare("INSERT INTO appointments (patient_id, doctor_id, app_date, app_time, room_num, reason_for_visit, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Upcoming', NOW())");
            $appt_insert->bind_param('ssssss', $payment['patient_id'], $payment['doctor_id'], $appt_date, $appt_time, $room_num, $appt_reason);
            $appt_insert->execute();
            $appointment_id = $appt_insert->insert_id;
            $appt_insert->close();

            // 5. Generate Ticket (Optional but standard in this app)
            // (Logic extracted from existing scripts)
            $astmt = $conn->prepare("SELECT specialization FROM doctor_profiles WHERE user_id = ?");
            $astmt->bind_param("s", $payment['doctor_id']);
            $astmt->execute();
            $spec = $astmt->get_result()->fetch_assoc()['specialization'] ?? 'General Consultation';
            $astmt->close();

            $cstmt = $conn->prepare("SELECT id, estimated_cost FROM treatment_categories WHERE name LIKE ? LIMIT 1");
            $likeSpec = "%$spec%";
            $cstmt->bind_param("s", $likeSpec);
            $cstmt->execute();
            $cat = $cstmt->get_result()->fetch_assoc();
            $cstmt->close();
            
            if ($cat && $appointment_id) {
                $ticket_number = 'TKT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
                $cost = (float)$cat['estimated_cost'];
                $cat_id = (int)$cat['id'];
                $ins = $conn->prepare("INSERT INTO treatment_tickets (ticket_number, patient_id, appointment_id, category_id, cost, generated_at) VALUES (?, ?, ?, ?, ?, NOW())");
                $ins->bind_param("ssiids", $ticket_number, $payment['patient_id'], $appointment_id, $cat_id, $cost, date('Y-m-d H:i:s'));
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
            $notif = $conn->prepare("INSERT INTO notifications (user_id, title, message, created_at) VALUES (?, 'New Booking', 'A patient has booked an appointment via Khalti.', NOW())");
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

if (!function_exists('khalti_post_json')) {
    function khalti_post_json(string $url, array $payload, string $secretKey): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Key ' . $secretKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
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
                'ok' => false,
                'http_code' => $httpCode,
                'error' => $curlError ?: ($httpCode == 504 ? 'Khalti Gateway Timeout' : 'Unable to contact Khalti'),
                'is_maintenance' => ($httpCode >= 500)
            ];
        }

        $decoded = json_decode($response, true);
        $is_success = ($httpCode >= 200 && $httpCode < 300);

        return [
            'success' => $is_success,
            'ok' => $is_success,
            'http_code' => $httpCode,
            'data' => $decoded,
            'raw' => $response,
            'message' => $decoded['detail'] ?? $decoded['error_key'] ?? ($is_success ? null : 'Khalti request failed'),
            'is_auth_error' => ($httpCode === 401)
        ];
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
        $conn->query("\n            CREATE TABLE IF NOT EXISTS appointment_payments (\n              payment_id int(11) NOT NULL AUTO_INCREMENT,\n              appointment_id int(11) DEFAULT NULL,\n              patient_id varchar(20) NOT NULL,\n              doctor_id varchar(20) NOT NULL,\n              avail_id int(11) NOT NULL,\n              payment_method varchar(30) NOT NULL DEFAULT 'Khalti',\n              pidx varchar(100) DEFAULT NULL,\n              transaction_id varchar(100) DEFAULT NULL,\n              amount_paisa int(11) NOT NULL,\n              amount_rupees decimal(10,2) NOT NULL,\n              payment_status enum('Initiated','Pending','Completed','Failed','Expired','Cancelled','Refunded') NOT NULL DEFAULT 'Initiated',\n              booking_payload longtext NOT NULL,\n              gateway_response longtext DEFAULT NULL,\n              callback_status varchar(40) DEFAULT NULL,\n              expires_at timestamp NOT NULL,\n              verified_at timestamp NULL DEFAULT NULL,\n              created_at timestamp NOT NULL DEFAULT current_timestamp(),\n              updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),\n              PRIMARY KEY (payment_id),\n              UNIQUE KEY uq_appointment_payments_pidx (pidx),\n              KEY idx_appointment_payments_appointment_id (appointment_id),\n              KEY idx_appointment_payments_patient_id (patient_id),\n              KEY idx_appointment_payments_avail_id (avail_id)\n            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci\n        ");
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