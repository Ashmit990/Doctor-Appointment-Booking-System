<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    // Fetch doctor stats for leaderboard
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.full_name,
            dp.specialization,
            COUNT(a.appointment_id) as total_appointments,
            SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed_appointments
        FROM users u
        LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
        LEFT JOIN appointments a ON u.user_id = a.doctor_id
        WHERE u.role = 'Doctor'
        GROUP BY u.user_id
        ORDER BY completed_appointments DESC, total_appointments DESC
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $leaderboard = [];
    $platinum_count = 0;
    $gold_count = 0;
    $silver_count = 0;
    $total_doctors = count($results);

    foreach ($results as $row) {
        $completed = (int)$row['completed_appointments'];
        $total = (int)$row['total_appointments'];
        $performance = ($total > 0) ? round(($completed / $total) * 100) : 0;

        $leaderboard[] = [
            'user_id' => $row['user_id'],
            'full_name' => $row['full_name'],
            'specialization' => $row['specialization'] ?? 'General',
            'completed' => $completed,
            'total' => $total,
            'performance' => $performance
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $leaderboard,
        'summary' => [
            'total_doctors' => $total_doctors,
            'total_completed' => array_sum(array_column($results, 'completed_appointments'))
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
