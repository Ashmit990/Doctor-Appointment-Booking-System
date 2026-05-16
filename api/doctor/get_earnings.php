<?php
require_once __DIR__ . '/bootstrap.php';

$doctor_id = $_SESSION['user_id'] ?? '';

if ($doctor_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    $conn->close();
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            e.earning_id,
            e.appointment_id,
            e.amount,
            e.payment_date,
            a.app_date,
            u.full_name as patient_name,
            e.remarks,
            a.status as status
        FROM earnings e
        JOIN appointments a ON e.appointment_id = a.appointment_id
        JOIN users u ON a.patient_id = u.user_id
        WHERE e.doctor_id = ?
        ORDER BY e.payment_date DESC
    ");
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $earnings = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => $earnings
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
