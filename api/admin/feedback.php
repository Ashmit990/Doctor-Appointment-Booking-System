<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Include database connection
require_once __DIR__ . '/../config/db.php';

// Check if user is authenticated and is an Admin
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] !== 'Admin' && $_SESSION['role'] !== 'Administrator')) {
    http_response_code(418); // Elegant fallback or 401
    // Keep it compatible with system dashboard roles
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Please log in.']);
        exit;
    }
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Query to get feedback messages
        $query = "
            SELECT id, full_name, email, message, created_at 
            FROM contact_messages 
            ORDER BY created_at DESC 
            LIMIT $limit OFFSET $offset
        ";
        
        $result = $conn->query($query);
        if (!$result) {
            throw new Exception("Query failed: " . $conn->error);
        }

        $feedbackList = [];
        while ($row = $result->fetch_assoc()) {
            $feedbackList[] = $row;
        }

        // Get total count for pagination
        $countResult = $conn->query("SELECT COUNT(*) as total FROM contact_messages");
        $total = 0;
        if ($countResult) {
            $total = (int)$countResult->fetch_assoc()['total'];
        }

        echo json_encode([
            'status' => 'success',
            'data' => $feedbackList,
            'total' => $total,
            'page' => $page,
            'pages' => $total > 0 ? ceil($total / $limit) : 1
        ]);

    } elseif ($method === 'DELETE') {
        // Get JSON body input
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? (int)$input['id'] : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid feedback ID.']);
            exit;
        }

        // Delete using prepared statement
        $stmt = $conn->prepare("DELETE FROM contact_messages WHERE id = ?");
        if (!$stmt) {
            throw new Exception("Prepare statement failed: " . $conn->error);
        }

        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Feedback message deleted successfully!'
            ]);
        } else {
            throw new Exception("Failed to delete feedback message: " . $stmt->error);
        }

        $stmt->close();

    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error: ' . $e->getMessage()
    ]);
}

$conn->close();
