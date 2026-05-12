<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sessionId = trim($_GET['session_id'] ?? '');

    if (!empty($sessionId)) {
        // Return all messages for a specific session
        $stmt = $conn->prepare("
            SELECT role, message, created_at
            FROM ai_chat_history
            WHERE user_id = ? AND session_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->bind_param('is', $patient_id, $sessionId);
        $stmt->execute();
        $result = $stmt->get_result();
        $messages = [];
        while ($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
        $stmt->close();
        echo json_encode(['status' => 'success', 'messages' => $messages]);
    } else {
        // Return list of sessions (one row per session: first user message as title + timestamp)
        $stmt = $conn->prepare("
            SELECT session_id,
                   MIN(created_at) AS started_at,
                   MAX(created_at) AS last_at,
                   (SELECT message FROM ai_chat_history h2
                    WHERE h2.session_id = h.session_id AND h2.role = 'user'
                    ORDER BY h2.created_at ASC LIMIT 1) AS preview
            FROM ai_chat_history h
            WHERE user_id = ? AND session_id != ''
            GROUP BY session_id
            ORDER BY MAX(created_at) DESC
            LIMIT 50
        ");
        $stmt->bind_param('i', $patient_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            $sessions[] = $row;
        }
        $stmt->close();
        echo json_encode(['status' => 'success', 'sessions' => $sessions]);
    }

} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
}
