<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    // Get appointment statistics for various charts
    
    // 1. Appointments by status (Pie Chart)
    $stmt = $conn->prepare("
        SELECT 
            status,
            COUNT(*) as count
        FROM appointments
        GROUP BY status
    ");
    $stmt->execute();
    $status_data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 2. Top doctors by appointments (Bar Chart)
    $stmt = $conn->prepare("
        SELECT 
            u.full_name,
            dp.specialization,
            COUNT(a.appointment_id) as appointment_count,
            SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed_count
        FROM users u
        LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
        LEFT JOIN appointments a ON u.user_id = a.doctor_id
        WHERE u.role = 'Doctor'
        GROUP BY u.user_id
        ORDER BY appointment_count DESC
        LIMIT 10
    ");
    $stmt->execute();
    $doctor_stats = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 3. Appointments trend over last 30 days
    $stmt = $conn->prepare("
        SELECT 
            DATE(app_date) as date,
            COUNT(*) as count,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Upcoming' THEN 1 ELSE 0 END) as upcoming,
            SUM(CASE WHEN status = 'Missed' THEN 1 ELSE 0 END) as missed
        FROM appointments
        WHERE app_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(app_date)
        ORDER BY date DESC
    ");
    $stmt->execute();
    $trend_data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 4. Top specializations
    $stmt = $conn->prepare("
        SELECT 
            dp.specialization,
            COUNT(a.appointment_id) as appointment_count,
            COUNT(DISTINCT u.user_id) as doctor_count
        FROM doctor_profiles dp
        JOIN users u ON dp.user_id = u.user_id
        LEFT JOIN appointments a ON u.user_id = a.doctor_id
        GROUP BY dp.specialization
        ORDER BY appointment_count DESC
    ");
    $stmt->execute();
    $specialization_data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // 5. Overall statistics
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Patient'");
    $stmt->execute();
    $total_patients = $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Doctor'");
    $stmt->execute();
    $total_doctors = $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM appointments");
    $stmt->execute();
    $total_appointments = $stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    echo json_encode([
        'status' => 'success',
        'data' => [
            'status_distribution' => $status_data,
            'doctor_stats' => $doctor_stats,
            'trend_data' => $trend_data,
            'specialization_data' => $specialization_data,
            'summary' => [
                'total_patients' => $total_patients,
                'total_doctors' => $total_doctors,
                'total_appointments' => $total_appointments
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
