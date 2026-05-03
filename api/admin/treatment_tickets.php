<?php
session_start();
header('Content-Type: application/json');

// Include database connection
require_once __DIR__ . '/../config/db.php';

// Authentication Check
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
        
        // Base Query
        $query = "
            SELECT 
                t.id,
                t.ticket_number,
                t.patient_id,
                t.appointment_id,
                t.cost,
                t.generated_at,
                u.full_name as patient_name,
                c.name as category_name,
                c.description as category_description
            FROM treatment_tickets t
            JOIN users u ON t.patient_id = u.user_id
            JOIN treatment_categories c ON t.category_id = c.id
            WHERE 1=1
        ";
        
        // Add Filters
        if (!empty($search)) {
            $query .= " AND (t.ticket_number LIKE '%$search%' OR u.full_name LIKE '%$search%')";
        }
        
        if (!empty($category)) {
            $query .= " AND c.name = '$category'";
        }
        
        $query .= " ORDER BY t.generated_at DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception('Query failed: ' . $conn->error);
        }
        
        $tickets = [];
        $total_revenue = 0;
        while ($row = $result->fetch_assoc()) {
            $tickets[] = $row;
            $total_revenue += $row['cost'];
        }

        // Get Categories for filter dropdown
        $catResult = $conn->query("SELECT name FROM treatment_categories ORDER BY name ASC");
        $categories = [];
        while ($cat = $catResult->fetch_assoc()) {
            $categories[] = $cat['name'];
        }

        // Calculate Stats
        $stats = [
            'total_tickets' => count($tickets),
            'total_revenue' => $total_revenue,
            'today_tickets' => 0,
            'avg_cost' => count($tickets) > 0 ? round($total_revenue / count($tickets), 2) : 0
        ];

        // Get Today's Tickets count specifically
        $todayResult = $conn->query("SELECT COUNT(*) as count FROM treatment_tickets WHERE DATE(generated_at) = CURDATE()");
        if ($todayResult) {
            $stats['today_tickets'] = $todayResult->fetch_assoc()['count'];
        }

        echo json_encode([
            'status' => 'success',
            'data' => $tickets,
            'categories' => $categories,
            'stats' => $stats
        ]);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
