<?php
/**
 * eSewa Sandbox Form Auto-Submit Redirection
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

header('Content-Type: text/html; charset=utf-8');

$payment_id = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : 0;

if (!$payment_id) {
    http_response_code(400);
    echo "<h1>Error</h1><p>Missing payment ID.</p>";
    exit;
}

$stmt = $conn->prepare("
    SELECT p.*, u.full_name AS doctor_name 
    FROM appointment_payments p 
    JOIN users u ON p.doctor_id = u.user_id 
    WHERE p.payment_id = ?
");
$stmt->bind_param('i', $payment_id);
$stmt->execute();
$payment = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$payment) {
    http_response_code(404);
    echo "<h1>Error</h1><p>Payment record not found.</p>";
    exit;
}

$booking = json_decode($payment['booking_payload'] ?? '{}', true) ?? [];
$slot_date = $booking['slot_date'] ?? 'N/A';
$slot_time = $booking['slot_time'] ?? 'N/A';
$reason = $booking['reason'] ?? 'Consultation';

$config = esewa_payment_config();
$secret_key = $config['secret_key'];
$product_code = $config['merchant_code'];

$transaction_uuid = $payment['pidx']; // We store the unique transaction UUID in the 'pidx' column
$total_amount = number_format((float)$payment['amount_rupees'], 2, '.', '');

// Message format: total_amount,transaction_uuid,product_code
$message = "total_amount=$total_amount,transaction_uuid=$transaction_uuid,product_code=$product_code";
$signature = base64_encode(hash_hmac('sha256', $message, $secret_key, true));

$success_url = $config['return_url'];
$failure_url = patient_app_base_url() . "/pages/patient/payment.html?doctor_id=" . urlencode($payment['doctor_id']) . "&avail_id=" . urlencode($payment['avail_id']) . "&payment_status=Failed&success=false&error=" . urlencode("Payment was cancelled or failed.");

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting to eSewa...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .card {
            background-color: white;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
            padding: 36px;
            max-width: 460px;
            width: 100%;
            border: 1px solid #e2e8f0;
            border-top: 6px solid #60bb46;
        }
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .spinner {
            border: 4px solid rgba(96, 187, 70, 0.1);
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border-left-color: #60bb46;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        h2 {
            color: #0f172a;
            font-size: 22px;
            margin: 0 0 6px 0;
            font-weight: 800;
        }
        .subtitle {
            color: #64748b;
            font-size: 13px;
            margin: 0;
        }
        .details-box {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            text-align: left;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .detail-row:first-child {
            padding-top: 0;
        }
        .label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value {
            font-size: 13.5px;
            color: #0f172a;
            font-weight: 700;
        }
        .value.price {
            color: #60bb46;
            font-size: 15px;
        }
        .btn-proceed {
            display: block;
            width: 100%;
            background-color: #60bb46;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px 20px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(96, 187, 70, 0.2);
            text-align: center;
        }
        .btn-proceed:hover {
            background-color: #4fa336;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(96, 187, 70, 0.3);
        }
        .countdown {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 14px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="spinner"></div>
            <h2>Secure Checkout</h2>
            <p class="subtitle">Connecting you to eSewa payment gateway...</p>
        </div>
        
        <div class="details-box">
            <div class="detail-row">
                <span class="label">Provider</span>
                <span class="value"><?php echo htmlspecialchars($payment['doctor_name']); ?></span>
            </div>
            <div class="detail-row">
                <span class="label">Date</span>
                <span class="value"><?php echo htmlspecialchars($slot_date); ?></span>
            </div>
            <div class="detail-row">
                <span class="label">Time</span>
                <span class="value"><?php echo htmlspecialchars($slot_time); ?></span>
            </div>
            <div class="detail-row">
                <span class="label">Reason</span>
                <span class="value" style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?php echo htmlspecialchars($reason); ?>"><?php echo htmlspecialchars($reason); ?></span>
            </div>
            <div class="detail-row">
                <span class="label">Amount</span>
                <span class="value price">Rs. <?php echo htmlspecialchars($total_amount); ?></span>
            </div>
        </div>

        <button type="button" class="btn-proceed" onclick="document.getElementById('esewaForm').submit();">Proceed with eSewa</button>
        <div class="countdown" id="countdown-text">Redirecting automatically in 3 seconds...</div>
    </div>
    
    <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
        <input type="hidden" name="amount" value="<?php echo htmlspecialchars($total_amount); ?>">
        <input type="hidden" name="tax_amount" value="0.00">
        <input type="hidden" name="product_service_charge" value="0.00">
        <input type="hidden" name="product_delivery_charge" value="0.00">
        <input type="hidden" name="total_amount" value="<?php echo htmlspecialchars($total_amount); ?>">
        <input type="hidden" name="transaction_uuid" value="<?php echo htmlspecialchars($transaction_uuid); ?>">
        <input type="hidden" name="product_code" value="<?php echo htmlspecialchars($product_code); ?>">
        <input type="hidden" name="success_url" value="<?php echo htmlspecialchars($success_url); ?>">
        <input type="hidden" name="failure_url" value="<?php echo htmlspecialchars($failure_url); ?>">
        <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
        <input type="hidden" name="signature" value="<?php echo htmlspecialchars($signature); ?>">
    </form>
    
    <script>
        var secondsLeft = 3;
        var countdownTimer = setInterval(function() {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(countdownTimer);
                document.getElementById('esewaForm').submit();
            } else {
                document.getElementById('countdown-text').textContent = "Redirecting automatically in " + secondsLeft + " seconds...";
            }
        }, 1000);
    </script>
</body>
</html>
