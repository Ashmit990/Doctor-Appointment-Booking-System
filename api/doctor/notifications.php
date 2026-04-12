<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../includes/appointment_reminder_sync.php';

sync_doctor_appointment_reminders($conn, $doctor_id);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare(
        'SELECT notification_id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    );
    $stmt->bind_param('s', $doctor_id);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    echo json_encode(['status' => 'success', 'data' => $rows]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']))) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['action']) && $input['action'] === 'mark_all_read') {
        $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
        $stmt->bind_param('s', $doctor_id);
    } elseif (isset($input['notification_id'])) {
        $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?');
        $stmt->bind_param('is', $input['notification_id'], $doctor_id);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid Request']);
        exit;
    }

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $conn->error]);
    }
    $stmt->close();
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
