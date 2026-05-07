<?php
// Set error reporting to catch all errors
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

try {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $appointment_id = $_GET['appointment_id'] ?? null;

    if (!$appointment_id) {
        echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required']);
        exit;
    }

    // Verify access (doctor or patient of this appointment)
    $verify_query = "
        SELECT 
            mr.*,
            u.full_name as doctor_name,
            u.email as doctor_email,
            p.full_name as patient_name,
            p.email as patient_email,
            pp.blood_group,
            pp.age,
            a.app_date,
            a.app_time,
            a.reason_for_visit
        FROM medical_reports mr
        JOIN users u ON mr.doctor_id = u.user_id
        JOIN users p ON mr.patient_id = p.user_id
        LEFT JOIN patient_profiles pp ON mr.patient_id = pp.user_id
        JOIN appointments a ON mr.appointment_id = a.appointment_id
        WHERE mr.appointment_id = ? 
        AND (mr.doctor_id = ? OR mr.patient_id = ?)
    ";

    $stmt = $conn->prepare($verify_query);
    
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("iss", $appointment_id, $user_id, $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Report not found or access denied']);
        exit;
    }

    $report = $result->fetch_assoc();
    
    // Handle prescribed_medicines - it might be NULL
    $medicines = !empty($report['prescribed_medicines']) ? json_decode($report['prescribed_medicines'], true) : [];
    if (!is_array($medicines)) {
        $medicines = [];
    }
    $report['prescribed_medicines'] = $medicines;
    
    $stmt->close();

    // Get hospital info (you can customize this)
    $hospital_name = "Health Care";
    $hospital_address = "123 Medical Avenue, Healthcare City";
    $hospital_phone = "+1-800-HOSPITAL";
    $hospital_email = "info@healthcare.com";

    // Format appointment date
    $appointment_date = date('F j, Y', strtotime($report['app_date']));
    $appointment_time = date('h:i A', strtotime($report['app_time']));

    // Prepare data for PDF generation
    $pdf_data = [
        'status' => 'success',
        'data' => [
            'hospital' => [
                'name' => $hospital_name,
                'address' => $hospital_address,
                'phone' => $hospital_phone,
                'email' => $hospital_email
            ],
            'doctor' => [
                'name' => $report['doctor_name'],
                'email' => $report['doctor_email']
            ],
            'patient' => [
                'name' => $report['patient_name'],
                'email' => $report['patient_email'],
                'blood_group' => $report['blood_group'],
                'age' => $report['age']
            ],
            'appointment' => [
                'date' => $appointment_date,
                'time' => $appointment_time,
                'reason' => $report['reason_for_visit']
            ],
            'report' => [
                'symptoms' => $report['symptoms'],
                'diagnosis' => $report['diagnosis'],
                'blood_pressure' => $report['blood_pressure'],
                'weight' => $report['weight'],
                'prescribed_medicines' => $report['prescribed_medicines'],
                'additional_notes' => $report['additional_notes'],
                'created_at' => date('F j, Y \a\t h:i A', strtotime($report['created_at']))
            ]
        ]
    ];

    echo json_encode($pdf_data);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
