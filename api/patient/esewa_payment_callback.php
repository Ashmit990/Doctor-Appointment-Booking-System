<?php
/**
 * eSewa Payment Callback Handler
 * Receives callback from eSewa after user completes payment
 * Verifies transaction via Base64 decoded data and signature checks
 * Reference: eSewa ePay v2 developer guide
 */

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Allow CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if (strpos($origin, 'esewa.com.np') !== false || strpos($origin, 'localhost') !== false) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
}

require_once __DIR__ . '/payment_helpers.php';
require_once __DIR__ . '/../config/db.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo '<h1>Database Error</h1><p>Unable to connect to database</p>';
    exit;
}

ensure_appointment_payments_table($conn);

$payment_id = 0;
$encoded_data = trim($_GET['data'] ?? '');

// Response renderer
$render_response = function($success, $title, $message, $uuid = '', $txn_id = '', $appointment_id = null) {
    $bg = $success ? '#d1fae5' : '#fee2e2';
    $color = $success ? '#047857' : '#dc2626';
    $icon = $success ? '✓' : '✕';
    $uuid_short = $uuid ? substr($uuid, 0, 16) . '...' : '—';
    $txn_short = $txn_id ? substr($txn_id, 0, 16) . '...' : '—';
    $status_msg = $success ? 'Notifying dashboard... This tab will close in 5 seconds.' : 'Please close this window and return to the dashboard.';
    
    $receipt_btn = ($success && $appointment_id) 
        ? "<button onclick=\"window.open('../../pages/patient/receipt.html?appointment_id={$appointment_id}', '_blank', 'width=800,height=900')\" style=\"background:#10b981;box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);\">View Receipt</button>"
        : "";

    $js_status_val = $success ? 'Completed' : 'Failed';
    $js_success_val = $success ? 'true' : 'false';
    $js_title = json_encode($title);
    $js_message = json_encode($message);

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
                    <span class="detail-value">$uuid_short</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction:</span>
                    <span class="detail-value">$txn_short</span>
                </div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button onclick="handleReturn()">Back to Dashboard</button>
                $receipt_btn
                <button id="manualNotifyBtn" style="background:#f3f4f6;color:#374151;border:1px solid #d1d5db;">Notify & Close</button>
            </div>
        </div>
    </div>
    <script>
        // Check if we are in a same-tab redirect flow or a new-tab/popup flow
        const hasOpener = window.opener && !window.opener.closed;
        const dashboardUrl = '../../pages/patient/dashboard.html?payment_status={$js_status_val}&success={$js_success_val}&appointment_id={$appointment_id}';

        function sendPaymentResult() {
            try {
                if (hasOpener) {
                    window.opener.postMessage({
                        type: 'payment-result',
                        status: '{$js_status_val}',
                        title: {$js_title},
                        message: {$js_message},
                        success: {$js_success_val},
                        appointment_id: '{$appointment_id}'
                    }, '*');
                    console.log('Payment result posted to opener');
                    return true;
                }
            } catch (e) {
                console.error('postMessage failed', e);
            }
            return false;
        }

        // Attempt notification
        sendPaymentResult();

        function handleReturn() {
            sendPaymentResult();
            if (hasOpener) {
                try { window.close(); } catch (e) { window.top.location.href = dashboardUrl; }
            } else {
                window.top.location.href = dashboardUrl;
            }
        }

        document.getElementById('manualNotifyBtn')?.addEventListener('click', handleReturn);
        
        // Auto-redirect or Auto-close
        setTimeout(() => {
            if ({$js_success_val}) {
                handleReturn();
            }
        }, hasOpener ? 5000 : 3000);
    </script>
</body>
</html>
HTML;
};

// Validate request
if (!$encoded_data) {
    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Missing parameter requirements from eSewa');
    exit;
}

// Decode data
$decoded_json = base64_decode($encoded_data);
if (!$decoded_json) {
    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Invalid callback payload from eSewa');
    exit;
}

$decoded_data = json_decode($decoded_json, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Invalid JSON payload from eSewa');
    exit;
}

$txn_uuid = $decoded_data['transaction_uuid'] ?? '';

// Find payment record in database by transaction UUID (stored in 'pidx' column)
$paymentStmt = $conn->prepare("
    SELECT * FROM appointment_payments
    WHERE pidx = ? AND payment_status IN ('Initiated', 'Pending')
    LIMIT 1
");
$paymentStmt->bind_param('s', $txn_uuid);
$paymentStmt->execute();
$payment = $paymentStmt->get_result()->fetch_assoc();
$paymentStmt->close();

if (!$payment) {
    http_response_code(404);
    $render_response(false, 'Payment Not Found', 'This payment does not exist in our system or has already been processed');
    exit;
}

$payment_id = (int)$payment['payment_id'];

// Verify eSewa Signature
if (!esewa_verify_signature($decoded_data)) {
    http_response_code(400);
    $render_response(false, 'Verification Failed', 'Signature validation failed. Transaction untrusted.');
    exit;
}

// Verify transaction details match database record
$txn_uuid = $decoded_data['transaction_uuid'] ?? '';
$total_amount = (float)($decoded_data['total_amount'] ?? 0);
$status = $decoded_data['status'] ?? '';
$transaction_code = $decoded_data['transaction_code'] ?? '';

if ($txn_uuid !== $payment['pidx']) {
    http_response_code(400);
    $render_response(false, 'Verification Failed', 'Transaction UUID mismatch.');
    exit;
}

if (number_format($total_amount, 2, '.', '') !== number_format((float)$payment['amount_rupees'], 2, '.', '')) {
    http_response_code(400);
    $render_response(false, 'Verification Failed', 'Amount mismatch.');
    exit;
}

if ($status !== 'COMPLETE') {
    $conn->begin_transaction();
    try {
        // Release booked slot
        $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $releaseStmt->bind_param('i', $payment['avail_id']);
        $releaseStmt->execute();
        $releaseStmt->close();

        // Mark payment as failed
        $updateStmt = $conn->prepare("
            UPDATE appointment_payments 
            SET payment_status = 'Failed', callback_status = ?, transaction_id = ?, updated_at = NOW()
            WHERE payment_id = ?
        ");
        $updateStmt->bind_param('ssi', $status, $transaction_code, $payment['payment_id']);
        $updateStmt->execute();
        $updateStmt->close();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
    }

    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Transaction could not be completed. Status: ' . $status);
    exit;
}

// Payment verified successfully - create appointment and mark payment as complete
$gateway_data = [
    'status' => 'Completed',
    'transaction_id' => $transaction_code
];

$result = complete_appointment_payment($conn, $payment['payment_id'], $gateway_data);

if ($result['success']) {
    http_response_code(200);
    $render_response(true, 'Payment Successful',
        'Your appointment has been booked successfully! Check your dashboard for details.',
        $txn_uuid, $transaction_code, $result['appointment_id']);
} else {
    http_response_code(500);
    $render_response(false, 'Booking Failed', 
        'Payment verified but appointment creation failed: ' . $result['message'],
        $txn_uuid, $transaction_code);
}

$conn->close();
exit;
