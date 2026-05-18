<?php
/**
 * Khalti Payment Callback Handler
 * Receives callback after Khalti payment completion
 */

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

require_once __DIR__ . '/payment_helpers.php';
require_once __DIR__ . '/../config/db.php';

if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo '<h1>Database Error</h1><p>Unable to connect to database</p>';
    exit;
}

ensure_appointment_payments_table($conn);

$pidx = trim($_GET['pidx'] ?? '');
$txn_id = trim($_GET['transaction_id'] ?? '');
$status = trim($_GET['status'] ?? '');

// Response renderer
$render_response = function($success, $title, $message, $pidx = '', $txn_id = '', $appointment_id = null) {
    $bg = $success ? '#d1fae5' : '#fee2e2';
    $color = $success ? '#047857' : '#dc2626';
    $icon = $success ? '✓' : '✕';
    $pidx_short = $pidx ? substr($pidx, 0, 16) . '...' : '—';
    $txn_short = $txn_id ? substr($txn_id, 0, 16) . '...' : '—';
    $status_msg = $success ? 'Notifying dashboard... This tab will close in 5 seconds.' : 'Please close this window and return to the dashboard.';
    
    $receipt_btn = ($success && $appointment_id) 
        ? "<button onclick=\"window.open('../../pages/patient/receipt.html?appointment_id={$appointment_id}', '_blank', 'width=800,height=900')\" style=\"background:#47a960;box-shadow: 0 4px 14px 0 rgba(71, 169, 96, 0.39);\">View Receipt</button>"
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
        button { width: 100%; padding: 12px 16px; background: #5B3CC4; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        button:hover { background: #4a2fa8; }
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
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button onclick="handleReturn()">Back to Dashboard</button>
                $receipt_btn
                <button id="manualNotifyBtn" style="background:#f3f4f6;color:#374151;border:1px solid #d1d5db;">Notify & Close</button>
            </div>
        </div>
    </div>
    <script>
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

// Validate callback
if (!$pidx) {
    http_response_code(400);
    error_log("[Khalti Callback] FAILED: Missing pidx parameter");
    $render_response(false, 'Payment Failed', 'Missing payment ID from Khalti');
    exit;
}

// Find payment in database
$paymentStmt = $conn->prepare("
    SELECT * FROM appointment_payments
    WHERE pidx = ? AND payment_status IN ('Initiated', 'Pending')
    LIMIT 1
");
$paymentStmt->bind_param('s', $pidx);
$paymentStmt->execute();
$payment = $paymentStmt->get_result()->fetch_assoc();
$paymentStmt->close();

if (!$payment) {
    http_response_code(404);
    error_log("[Khalti Callback] FAILED: Payment not found for pidx={$pidx}");
    $render_response(false, 'Payment Not Found', 'This payment does not exist in our system or has already been processed');
    exit;
}

error_log("[Khalti Callback] Processing payment_id={$payment['payment_id']}, status={$status}");

// If status is not 'Completed', it's a failure/cancellation
if ($status !== 'Completed') {
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
        $failStatus = $status ?: 'Unknown';
        $updateStmt->bind_param('ssi', $failStatus, $txn_id, $payment['payment_id']);
        $updateStmt->execute();
        $updateStmt->close();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        error_log("[Khalti Callback] Failed to mark payment as failed: " . $e->getMessage());
    }

    http_response_code(400);
    $render_response(false, 'Payment Failed', 'Transaction could not be completed. Status: ' . $status);
    exit;
}

// Verify transaction with Khalti API
$verifyResult = khalti_verify_transaction($pidx, khalti_payment_config()['secret_key']);

if (!$verifyResult['success']) {
    $conn->begin_transaction();
    try {
        $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $releaseStmt->bind_param('i', $payment['avail_id']);
        $releaseStmt->execute();
        $releaseStmt->close();

        $updateStmt = $conn->prepare("
            UPDATE appointment_payments 
            SET payment_status = 'Failed', callback_status = 'Verification Failed', updated_at = NOW()
            WHERE payment_id = ?
        ");
        $updateStmt->bind_param('i', $payment['payment_id']);
        $updateStmt->execute();
        $updateStmt->close();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
    }

    http_response_code(400);
    error_log("[Khalti Callback] Verification failed: " . $verifyResult['message']);
    $render_response(false, 'Verification Failed', 'Could not verify transaction with Khalti: ' . $verifyResult['message']);
    exit;
}

// Verify amount matches
$verified_amount = isset($verifyResult['data']['total_amount']) ? (int)($verifyResult['data']['total_amount'] * 100) : 0;
if ($verified_amount !== (int)$payment['amount_paisa']) {
    $conn->begin_transaction();
    try {
        $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
        $releaseStmt->bind_param('i', $payment['avail_id']);
        $releaseStmt->execute();
        $releaseStmt->close();

        $updateStmt = $conn->prepare("
            UPDATE appointment_payments 
            SET payment_status = 'Failed', callback_status = 'Amount Mismatch', updated_at = NOW()
            WHERE payment_id = ?
        ");
        $updateStmt->bind_param('i', $payment['payment_id']);
        $updateStmt->execute();
        $updateStmt->close();

        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
    }

    http_response_code(400);
    $render_response(false, 'Verification Failed', 'Amount mismatch detected');
    exit;
}

// Payment verified - create appointment
$gateway_data = [
    'status' => 'Completed',
    'transaction_id' => $txn_id
];

$result = complete_appointment_payment($conn, $payment['payment_id'], $gateway_data);

if ($result['success']) {
    http_response_code(200);
    error_log("[Khalti Callback] SUCCESS: Appointment created, appointment_id={$result['appointment_id']}");
    $render_response(true, 'Payment Successful',
        'Your appointment has been booked successfully! Check your dashboard for details.',
        $pidx, $txn_id, $result['appointment_id']);
} else {
    http_response_code(500);
    error_log("[Khalti Callback] FAILED: Could not create appointment: " . $result['message']);
    $render_response(false, 'Booking Failed', 
        'Payment verified but appointment creation failed: ' . $result['message'],
        $pidx, $txn_id);
}

$conn->close();
exit;
