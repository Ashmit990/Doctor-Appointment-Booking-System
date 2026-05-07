<?php
/**
 * Khalti Payment Callback Handler
 * Receives callback from Khalti after user completes payment
 * Verifies transaction via lookup API and creates appointment
 * Reference: https://docs.khalti.com/khalti-epayment/
 */

// Set security headers BEFORE any output
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Allow CORS for Khalti redirect
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    // Allow Khalti domains
    if (strpos($origin, 'khalti.com') !== false || strpos($origin, 'localhost') !== false) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
}

// Load environment and database WITHOUT session check (callback from Khalti is public)
require_once __DIR__ . '/payment_helpers.php';
require_once __DIR__ . '/../config/db.php';

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo '<h1>Database Error</h1><p>Unable to connect to database</p>';
    exit;
}

ensure_appointment_payments_table($conn);

// Extract Khalti callback parameters (GET request from Khalti redirect)
$pidx = trim($_GET['pidx'] ?? '');
$status = trim($_GET['status'] ?? '');
$transaction_id = trim($_GET['transaction_id'] ?? $_GET['txnId'] ?? $_GET['tidx'] ?? '');
$amount = isset($_GET['amount']) ? (int)$_GET['amount'] : 0;

// Response renderer
$render_response = function($success, $title, $message, $pidx = '', $txn_id = '') {
    $bg = $success ? '#d1fae5' : '#fee2e2';
    $color = $success ? '#047857' : '#dc2626';
    $icon = $success ? '✓' : '✕';
    $pidx_short = $pidx ? substr($pidx, 0, 16) . '...' : '—';
    $txn_short = $txn_id ? substr($txn_id, 0, 16) . '...' : '—';
    $status_msg = $success ? 'Notifying dashboard... This tab will close in 5 seconds.' : 'Please close this window and return to the dashboard.';
    
    echo <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .container { width: 100%; max-width: 420px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .icon-box { background: $bg; padding: 32px; text-align: center; font-size: 48px; color: $color; }
        .content { padding: 32px; text-align: center; }
        h2 { font-size: 24px; color: $color; margin-bottom: 12px; font-weight: 700; }
        p { color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
        .status-msg { color: #6b7280; font-size: 12px; margin-bottom: 16px; font-style: italic; }
        .details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 13px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #64748b; font-weight: 600; }
        .detail-value { color: #1e293b; font-family: monospace; text-align: right; max-width: 180px; word-break: break-all; }
        button { width: 100%; padding: 12px 16px; background: #007E85; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        button:hover { background: #005f67; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-box">$icon</div>
        <div class="content">
            <h2>$title</h2>
            <div class="status-msg">$status_msg</div>
            <p>$message</p>
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Payment ID:</span>
                    <span class="detail-value">$pidx_short</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction:</span>
                    <span class="detail-value">$txn_short</span>
                </div>
            </div>
            <button onclick="goBack()">Back to Dashboard</button>
        </div>
    </div>
    <script>
        // This page was opened by booking.js in a new window
        // Communicate back to the opener (booking iframe)
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                    type: 'payment-result',
                    status: $success ? 'Completed' : 'Failed',
                    title: '$title',
                    message: '$message',
                    success: $success ? 'true' : 'false'
                }, '*');
            }
        } catch (e) {}

        function goBack() {
            // Close this window - the postMessage sent on page load will handle the notification
            window.close();
        }
        
        // Auto-close after longer delay on success to ensure postMessage is received
        if ($success) {
            setTimeout(() => { 
                window.close(); 
            }, 5000);
        }
    </script>
</body>
</html>
HTML;
};

// Validate pidx (required)
if (!$pidx) {
    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Missing payment reference ID from Khalti');
    exit;
}

// Load config
$config = khalti_payment_config();

// Find payment record in database
$paymentStmt = $conn->prepare("
    SELECT payment_id, patient_id, doctor_id, avail_id, amount_paisa, amount_rupees, 
           payment_status, booking_payload
    FROM appointment_payments
    WHERE pidx = ? AND payment_status IN ('Initiated', 'Pending')
    LIMIT 1
");
$paymentStmt->bind_param('s', $pidx);
$paymentStmt->execute();
$payment = $paymentStmt->get_result()->fetch_assoc();
$paymentStmt->close();

if (!$payment) {
    http_response_code(404);
    $render_response(false, 'Payment Not Found', 'This payment does not exist in our system');
    exit;
}

// **IMPORTANT**: Verify payment with Khalti lookup API (per Khalti docs)
// This is mandatory - do not trust callback parameters alone
$lookup_response = khalti_post_json(
    $config['api_base'] . '/epayment/lookup/',
    ['pidx' => $pidx],
    $config['secret_key']
);

if (!($lookup_response['success'] ?? $lookup_response['ok'] ?? false)) {
    http_response_code(500);
    $render_response(false, 'Verification Failed', 'Could not verify payment with Khalti. Please contact support.');
    exit;
}

$khalti_data = $lookup_response['data'] ?? [];
$verified_status = $khalti_data['status'] ?? 'Unknown';
$verified_amount = (int)($khalti_data['total_amount'] ?? 0);
$verified_txn_id = $khalti_data['transaction_id'] ?? '';

// Check if payment status is Completed
// Per Khalti docs: "Only the status with Completed must be treated as success"
if ($verified_status !== 'Completed') {
    $conn->begin_transaction();
    try {
        // Release booked slot
        $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $releaseStmt->bind_param('i', $payment['avail_id']);
        $releaseStmt->execute();
        $releaseStmt->close();

        // Mark payment as failed
        $map_status = match($verified_status) {
            'Expired' => 'Expired',
            'User canceled' => 'Cancelled',
            default => 'Failed'
        };

        $updateStmt = $conn->prepare("
            UPDATE appointment_payments 
            SET payment_status = ?, callback_status = ?, transaction_id = ?, updated_at = NOW()
            WHERE payment_id = ?
        ");
        $updateStmt->bind_param('sssi', $map_status, $verified_status, $verified_txn_id, $payment['payment_id']);
        $updateStmt->execute();
        $updateStmt->close();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
    }

    http_response_code(400);
    $render_response(false, 'Payment ' . $verified_status, 'Transaction could not be completed. Please try again.');
    exit;
}

// Verify amount matches expected amount (security check)
if ($verified_amount !== (int)$payment['amount_paisa']) {
    http_response_code(400);
    $render_response(false, 'Amount Mismatch', 'Payment amount does not match order. Contact support.');
    exit;
}

// Payment verified successfully - create appointment and mark payment as complete
$conn->begin_transaction();
try {
    // Parse booking details
    $booking = json_decode($payment['booking_payload'] ?? '{}', true) ?? [];
    $appt_date = $booking['slot_date'] ?? date('Y-m-d');
    $appt_time = $booking['slot_time'] ?? '09:00:00';
    $appt_reason = $booking['reason'] ?? 'Appointment booked via Khalti payment';
    $room_num = 'Room A1';

    // Double-check conflict at callback time to avoid race-condition double booking.
    $conf = $conn->prepare("SELECT appointment_id FROM appointments WHERE patient_id = ? AND app_date = ? AND status <> 'Cancelled' LIMIT 1");
    $conf->bind_param('ss', $payment['patient_id'], $appt_date);
    $conf->execute();
    $has_conflict = (bool) $conf->get_result()->fetch_assoc();
    $conf->close();

    if ($has_conflict) {
        $markConflictStmt = $conn->prepare("UPDATE appointment_payments SET payment_status = 'Failed', callback_status = 'BookingConflict', updated_at = NOW() WHERE payment_id = ?");
        $markConflictStmt->bind_param('i', $payment['payment_id']);
        $markConflictStmt->execute();
        $markConflictStmt->close();

        $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $releaseStmt->bind_param('i', $payment['avail_id']);
        $releaseStmt->execute();
        $releaseStmt->close();

        $conn->commit();
        http_response_code(409);
        $render_response(false, 'Booking Conflict', 'You already have an appointment on this date. Multiple bookings on the same day are not allowed.', $pidx, $verified_txn_id);
        exit;
    }

    // Create appointment record (use actual column names: app_date, app_time)
    $appt_insert = $conn->prepare("
        INSERT INTO appointments 
        (patient_id, doctor_id, app_date, app_time, room_num, reason_for_visit, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Upcoming', NOW())
    ");
    $appt_insert->bind_param('ssssss', 
        $payment['patient_id'],
        $payment['doctor_id'],
        $appt_date,
        $appt_time,
        $room_num,
        $appt_reason
    );
    $appt_insert->execute();
    $appointment_id = $appt_insert->insert_id;
    $appt_insert->close();

    if (!$appointment_id) {
        throw new Exception('Failed to create appointment');
    }

    // Update payment record to Completed
    $updateStmt = $conn->prepare("
        UPDATE appointment_payments 
        SET appointment_id = ?, payment_status = 'Completed', 
            transaction_id = ?, callback_status = ?, verified_at = NOW(), updated_at = NOW()
        WHERE payment_id = ?
    ");
    $updateStmt->bind_param('issi',
        $appointment_id,
        $verified_txn_id,
        $verified_status,
        $payment['payment_id']
    );
    $updateStmt->execute();
    $updateStmt->close();

    // Send notification to doctor
    $notif_title = 'New Appointment Booking';
    $notif_msg = 'A new patient has successfully booked an appointment with you.';
    $notifStmt = $conn->prepare("
        INSERT INTO notifications (user_id, title, message, is_read, created_at)
        VALUES (?, ?, ?, 0, NOW())
    ");
    @$notifStmt->bind_param('sss', $payment['doctor_id'], $notif_title, $notif_msg);
    @$notifStmt->execute();
    @$notifStmt->close();

    $conn->commit();

    http_response_code(200);
    $render_response(true, 'Payment Successful', 
        'Your appointment has been booked successfully! Check your dashboard for details.',
        $pidx, $verified_txn_id);
    exit;

} catch (Exception $e) {
    $conn->rollback();

    // Log detailed error for debugging
    error_log('Khalti Callback Error: ' . json_encode([
        'error' => $e->getMessage(),
        'payment_id' => $payment['payment_id'] ?? 'unknown',
        'payment_patient_id' => $payment['patient_id'] ?? 'NULL',
        'payment_doctor_id' => $payment['doctor_id'] ?? 'NULL',
        'booking_payload' => $payment['booking_payload'] ?? 'NULL',
    ]));

    // Release the slot on error
    $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
    $releaseStmt->bind_param('i', $payment['avail_id']);
    @$releaseStmt->execute();
    $releaseStmt->close();

    http_response_code(500);
    $render_response(false, 'Booking Failed', 
        'Payment verified but appointment creation failed. Contact support for assistance.',
        $pidx, $verified_txn_id);
    exit;
}

$conn->close();
