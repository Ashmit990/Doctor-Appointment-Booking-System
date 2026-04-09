<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("
        SELECT notification_id, title, message, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->bind_param("s", $patient_id);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    echo json_encode(['status' => 'success', 'data' => $rows]);
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $action = $input['action'] ?? '';

    if ($action === 'mark_all_read') {
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->bind_param("s", $patient_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'Updated']);
        $conn->close();
        exit;
    }

    if (isset($input['notification_id'])) {
        $nid = (int) $input['notification_id'];
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?");
        $stmt->bind_param("is", $nid, $patient_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['status' => 'success', 'message' => 'Updated']);
        $conn->close();
        exit;
    }
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
$conn->close();
