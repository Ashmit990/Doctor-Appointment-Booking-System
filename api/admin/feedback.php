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

        // 1) Feedback from appointments table
        $apptQuery = "
            SELECT 
                a.appointment_id AS id, 
                u.full_name, 
                u.email, 
                a.feedback AS message, 
                CONCAT(a.app_date, ' ', a.app_time) AS created_at,
                'appointments' AS source
            FROM appointments a
            JOIN users u ON a.patient_id = u.user_id
            WHERE a.feedback IS NOT NULL AND a.feedback != ''
        ";

        $apptResult = $conn->query($apptQuery);
        if (!$apptResult) {
            throw new Exception("Appointments query failed: " . $conn->error);
        }

        $feedbackList = [];
        while ($row = $apptResult->fetch_assoc()) {
            $feedbackList[] = $row;
        }

        // 2) Feedback from contact_messages (site contact / feedback form)
        $contactQuery = "SELECT id, full_name, email, message, created_at, 'contact_messages' AS source FROM contact_messages";
        $contactResult = $conn->query($contactQuery);
        if ($contactResult) {
            while ($row = $contactResult->fetch_assoc()) {
                $feedbackList[] = $row;
            }
        }

        // Merge and sort by created_at desc
        usort($feedbackList, function ($a, $b) {
            $ta = strtotime($a['created_at']);
            $tb = strtotime($b['created_at']);
            return $tb <=> $ta;
        });

        $total = count($feedbackList);

        // Apply pagination slice
        $paged = array_slice($feedbackList, $offset, $limit);

        echo json_encode([
            'status' => 'success',
            'data' => $paged,
            'total' => $total,
            'page' => $page,
            'pages' => $total > 0 ? ceil($total / $limit) : 1
        ]);

    } elseif ($method === 'DELETE') {
        // Get JSON body input
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        $source = isset($input['source']) ? $input['source'] : 'appointments';

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid feedback ID.']);
            exit;
        }

        if ($source === 'contact_messages') {
            // Delete the contact_messages row
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
            // Clear feedback in appointments
            $stmt = $conn->prepare("UPDATE appointments SET feedback = NULL WHERE appointment_id = ?");
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
        }

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
