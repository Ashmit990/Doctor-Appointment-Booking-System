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
    $period = $_GET['period'] ?? 'all';
    $dateFilter = "";
    if ($period === '7d') {
        $dateFilter = " AND a.app_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } elseif ($period === 'this_month') {
        $dateFilter = " AND a.app_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
    }

    // Fetch patient engagement stats for leaderboard
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
            (SELECT COUNT(*) FROM treatment_tickets tt WHERE tt.patient_id = u.user_id) as ticket_count,
            SUM(COALESCE(a.discount_amount, 0)) as total_discount,
            SUM(CASE WHEN COALESCE(a.discount_amount, 0) > 0 THEN 1 ELSE 0 END) as discount_applied_count
        FROM users u
        LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
        LEFT JOIN appointments a ON u.user_id = a.patient_id $dateFilter
        WHERE u.role = 'Patient'
        GROUP BY u.user_id
        ORDER BY total_discount DESC, total_appointments DESC
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $leaderboard = [];
    $total_patients = count($results);

    foreach ($results as $row) {
        $total_appts = (int)$row['total_appointments'];
        $completed = (int)$row['completed_appointments'];
        $feedback = (int)$row['feedback_count'];
        $tickets = (int)$row['ticket_count'];
        $total_discount = (float)$row['total_discount'];
        $discount_count = (int)$row['discount_applied_count'];
        
        $avg_discount = ($discount_count > 0) ? round($total_discount / $discount_count, 2) : 0;
        $engagement = ($total_appts > 0) ? round(($completed / $total_appts) * 100) : 0;

        $leaderboard[] = [
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
            'engagement' => $engagement,
            'total_discount' => $total_discount,
            'discount_count' => $discount_count,
            'avg_discount' => $avg_discount
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $leaderboard,
        'summary' => [
            'total_patients' => $total_patients,
            'active_this_month' => count(array_filter($results, function($r) { return $r['total_appointments'] > 0; }))
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
