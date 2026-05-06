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

    foreach ($results as $index => $row) {
        $completed = (int)$row['completed_appointments'];
        $total = (int)$row['total_appointments'];
        
        // Calculate performance percentage
        $performance = ($total > 0) ? round(($completed / $total) * 100) : 0;
        
        // Determine Tier based on Rank for better distribution with small data
        if ($index === 0) {
            $tier = 'Platinum';
            $platinum_count++;
        } elseif ($index <= 2) {
            $tier = 'Gold';
            $gold_count++;
        } elseif ($index <= 5) {
            $tier = 'Silver';
            $silver_count++;
        } else {
            $tier = 'Bronze';
        }

        $leaderboard[] = [
            'rank' => $index + 1,
            'user_id' => $row['user_id'],
            'full_name' => $row['full_name'],
            'specialization' => $row['specialization'] ?? 'General',
            'completed' => $completed,
            'total' => $total,
            'performance' => $performance,
            'tier' => $tier
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $leaderboard,
        'summary' => [
            'platinum' => $platinum_count,
            'gold' => $gold_count,
            'silver' => $silver_count,
            'total' => $total_doctors
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
