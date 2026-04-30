<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
    SELECT tt.id, tt.ticket_number, tc.name AS category, tc.description,
           tt.cost, tt.generated_at
    FROM treatment_tickets tt
    JOIN treatment_categories tc ON tt.category_id = tc.id
    WHERE tt.patient_id = ?
    ORDER BY tt.generated_at DESC
");
$stmt->bind_param("s", $patient_id);
$stmt->execute();
$result = $stmt->get_result();
$tickets = [];
while ($row = $result->fetch_assoc()) {
    $tickets[] = $row;
}
$stmt->close();

echo json_encode(['status' => 'success', 'data' => $tickets]);
$conn->close();
