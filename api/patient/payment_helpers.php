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
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [
                'ok' => false,
                'http_code' => 0,
                'data' => null,
                'error' => $curlError ?: 'Unable to contact Khalti',
            ];
        }

        $decoded = json_decode($response, true);

        $is_success = $httpCode >= 200 && $httpCode < 300;
        return [
            'success' => $is_success,
            'ok' => $is_success,
            'http_code' => $httpCode,
            'data' => $is_success && is_array($decoded) ? $decoded : null,
            'raw' => $response,
            'message' => $is_success ? null : (is_array($decoded) ? ($decoded['detail'] ?? $decoded['error_key'] ?? 'Khalti request failed') : 'Invalid response from Khalti'),
            'error' => $is_success ? null : (is_array($decoded) ? ($decoded['detail'] ?? $decoded['error_key'] ?? 'Khalti request failed') : 'Invalid response from Khalti'),
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