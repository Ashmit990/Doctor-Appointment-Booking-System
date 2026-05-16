<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

header('Content-Type: application/json');

$payment_id = $_GET['payment_id'] ?? '';

if (!$payment_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing payment ID']);
    exit;
}

$stmt = $conn->prepare("SELECT payment_id, pidx, patient_id, doctor_id, avail_id, amount_paisa, payment_status, booking_payload, appointment_id FROM appointment_payments WHERE payment_id = ? AND patient_id = ?");
$stmt->bind_param('is', $payment_id, $patient_id);
$stmt->execute();
$payment = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$payment) {
    echo json_encode(['status' => 'error', 'message' => 'Payment record not found']);
    exit;
}

// If already completed or failed, just return the status
if (!in_array($payment['payment_status'], ['Initiated', 'Pending'])) {
    echo json_encode([
        'status' => 'success',
        'payment_status' => $payment['payment_status'],
        'appointment_id' => $payment['appointment_id']
    ]);
    exit;
}

// If Pending/Initiated, perform Khalti lookup server-side
if (!empty($payment['pidx'])) {
    $config = khalti_payment_config();
    $lookup_response = khalti_post_json(
        $config['api_base'] . '/epayment/lookup/',
        ['pidx' => $payment['pidx']],
        $config['secret_key']
    );

    $verified_status = $lookup_response['data']['status'] ?? 'Unknown';
    $verified_txn_id = $lookup_response['data']['transaction_id'] ?? '';

    if ($verified_status === 'Completed') {
        $result = complete_appointment_payment($conn, $payment['payment_id'], $lookup_response['data']);
        if ($result['success']) {
            echo json_encode(['status' => 'success', 'payment_status' => 'Completed', 'appointment_id' => $result['appointment_id']]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to create appointment: ' . $result['message']]);
        }
        exit;
    } else if (in_array($verified_status, ['Expired', 'User canceled', 'Refunded'])) {
        $map_status = match($verified_status) { 'Expired' => 'Expired', 'User canceled' => 'Cancelled', 'Refunded' => 'Refunded', default => 'Failed' };
        $conn->begin_transaction();
        try {
            $updateStmt = $conn->prepare("UPDATE appointment_payments SET payment_status = ?, callback_status = ?, transaction_id = ?, updated_at = NOW() WHERE payment_id = ?");
            $updateStmt->bind_param('sssi', $map_status, $verified_status, $verified_txn_id, $payment['payment_id']);
            $updateStmt->execute();
            
            $releaseStmt = $conn->prepare("UPDATE doctor_availability SET status = 'Available' WHERE avail_id = ?");
            $releaseStmt->bind_param('i', $payment['avail_id']);
            $releaseStmt->execute();
            $conn->commit();
            
            echo json_encode(['status' => 'success', 'payment_status' => $map_status, 'appointment_id' => null]);
            exit;
        } catch (Exception $e) {
            $conn->rollback();
        }
    }
}

echo json_encode([
    'status' => 'success',
    'payment_status' => $payment['payment_status'],
    'appointment_id' => $payment['appointment_id']
]);
