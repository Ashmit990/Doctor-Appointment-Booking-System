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
    // Fetch patient engagement stats for leaderboard
    // Points system:
    //   - Each appointment booked: +10 points
    //   - Each completed appointment: +25 points
    //   - Each feedback given: +15 points
    //   - Each treatment ticket: +20 points
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            u.created_at,
            pp.gender,
            pp.blood_group,
            pp.contact_number,
            COUNT(DISTINCT a.appointment_id) as total_appointments,
            SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed_appointments,
            SUM(CASE WHEN a.feedback IS NOT NULL AND a.feedback != '' THEN 1 ELSE 0 END) as feedback_count,
            (SELECT COUNT(*) FROM treatment_tickets tt WHERE tt.patient_id = u.user_id) as ticket_count
        FROM users u
        LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
        LEFT JOIN appointments a ON u.user_id = a.patient_id
        WHERE u.role = 'Patient'
        GROUP BY u.user_id
        ORDER BY 
            (COUNT(DISTINCT a.appointment_id) * 10 
             + SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) * 25
             + SUM(CASE WHEN a.feedback IS NOT NULL AND a.feedback != '' THEN 1 ELSE 0 END) * 15
             + (SELECT COUNT(*) FROM treatment_tickets tt WHERE tt.patient_id = u.user_id) * 20
            ) DESC
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $leaderboard = [];
    $platinum_count = 0;
    $gold_count = 0;
    $silver_count = 0;
    $bronze_count = 0;
    $total_patients = count($results);

    foreach ($results as $index => $row) {
        $total_appts = (int)$row['total_appointments'];
        $completed = (int)$row['completed_appointments'];
        $feedback = (int)$row['feedback_count'];
        $tickets = (int)$row['ticket_count'];

        // Calculate points
        $points = ($total_appts * 10) + ($completed * 25) + ($feedback * 15) + ($tickets * 20);

        // Calculate engagement percentage (based on completed vs total)
        $engagement = ($total_appts > 0) ? round(($completed / $total_appts) * 100) : 0;

        // Determine Tier based on rank position
        if ($index === 0 && $points > 0) {
            $tier = 'Platinum';
            $platinum_count++;
        } elseif ($index <= 2 && $points > 0) {
            $tier = 'Gold';
            $gold_count++;
        } elseif ($index <= 5 && $points > 0) {
            $tier = 'Silver';
            $silver_count++;
        } else {
            $tier = 'Bronze';
            $bronze_count++;
        }

        $leaderboard[] = [
            'rank' => $index + 1,
            'user_id' => $row['user_id'],
            'full_name' => $row['full_name'],
            'email' => $row['email'],
            'gender' => $row['gender'] ?? 'N/A',
            'blood_group' => $row['blood_group'] ?? 'N/A',
            'contact_number' => $row['contact_number'] ?? 'N/A',
            'member_since' => $row['created_at'],
            'total_appointments' => $total_appts,
            'completed_appointments' => $completed,
            'feedback_count' => $feedback,
            'ticket_count' => $tickets,
            'points' => $points,
            'engagement' => $engagement,
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
            'bronze' => $bronze_count,
            'total' => $total_patients
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
