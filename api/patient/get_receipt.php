<?php
/**
 * Get Receipt Data for Patient
 */
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/payment_helpers.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure tables exist
ensure_appointment_payments_table($conn);

$appointment_id = isset($_GET['appointment_id']) ? (int)$_GET['appointment_id'] : 0;

if ($appointment_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid Appointment ID']);
    exit;
}

// Fetch payment and appointment details
$stmt = $conn->prepare("
    SELECT 
        ap.payment_id,
        ap.transaction_id,
        ap.pidx,
        ap.amount_rupees,
        ap.payment_method,
        ap.payment_status,
        ap.verified_at,
        ap.created_at as payment_date,
        a.appointment_id,
        a.app_date,
        a.app_time,
        a.reason_for_visit,
        u_doc.full_name as doctor_name,
        u_pat.full_name as patient_name,
        u_pat.email as patient_email,
        dp.specialization
    FROM appointment_payments ap
    INNER JOIN appointments a ON ap.appointment_id = a.appointment_id
    INNER JOIN users u_doc ON a.doctor_id = u_doc.user_id
    INNER JOIN users u_pat ON a.patient_id = u_pat.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.appointment_id = ? AND a.patient_id = ?
    AND ap.payment_status = 'Completed'
    LIMIT 1
");

$stmt->bind_param("is", $appointment_id, $patient_id);
$stmt->execute();
$result = $stmt->get_result();
$data = $result->fetch_assoc();
$stmt->close();

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Receipt not found or payment not completed.']);
    exit;
}

// Generate a unique Bill ID if not present (format: BILL-YEAR-ID)
$data['bill_no'] = 'BILL-' . date('Y', strtotime($data['payment_date'])) . '-' . str_pad($data['payment_id'], 5, '0', STR_PAD_LEFT);

echo json_encode([
    'status' => 'success',
    'data' => $data
]);

$conn->close();
