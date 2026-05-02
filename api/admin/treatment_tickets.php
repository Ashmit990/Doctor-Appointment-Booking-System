<?php
/**
 * Treatment Tickets API - Admin Only
 * ====================================
 * Returns all treatment tickets with joined category data, stats, and category list
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

session_start();

// ── Auth Guard ───────────────────────────────────────────────────────────────
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'Admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// ── DB Connection ────────────────────────────────────────────────────────────
require_once __DIR__ . '/../config/db.php';

try {
    // 1. Fetch All Tickets with joined data
    $ticketSQL = "
        SELECT
            tt.id,
            tt.ticket_number,
            tt.patient_id,
            tt.appointment_id,
            tt.category_id,
            tt.cost,
            tt.generated_at,
            tc.name            AS category_name,
            tc.description     AS category_description,
            tc.estimated_cost,
            u.full_name        AS patient_name
        FROM treatment_tickets tt
        LEFT JOIN treatment_categories tc ON tc.id = tt.category_id
        LEFT JOIN users u ON u.user_id = tt.patient_id
        ORDER BY tt.generated_at DESC
    ";

    $result = $conn->query($ticketSQL);
    if (!$result) {
        throw new Exception('Query error: ' . $conn->error);
    }

    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }

    // 2. Summary stats
    $statsResult = $conn->query("
        SELECT
            COUNT(*)                    AS total_tickets,
            COALESCE(SUM(cost), 0)      AS total_revenue,
            COUNT(DISTINCT patient_id)  AS unique_patients,
            COUNT(DISTINCT category_id) AS categories_used
        FROM treatment_tickets
    ");
    $stats = $statsResult ? $statsResult->fetch_assoc() : [
        'total_tickets'   => 0,
        'total_revenue'   => 0,
        'unique_patients' => 0,
        'categories_used' => 0,
    ];

    // 3. Category dropdown list
    $catResult = $conn->query("SELECT id, name FROM treatment_categories ORDER BY name ASC");
    $categories = [];
    if ($catResult) {
        while ($row = $catResult->fetch_assoc()) {
            $categories[] = $row;
        }
    }

    echo json_encode([
        'status'     => 'success',
        'data'       => $tickets,
        'stats'      => $stats,
        'categories' => $categories,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
