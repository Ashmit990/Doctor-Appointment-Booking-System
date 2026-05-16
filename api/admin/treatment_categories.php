<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $result = $conn->query("SELECT * FROM treatment_categories ORDER BY name ASC");
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
            echo json_encode(['status' => 'success', 'data' => $categories]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $name = $conn->real_escape_string($data['name']);
            $description = $conn->real_escape_string($data['description']);
            $estimated_cost = isset($data['estimated_cost']) ? (float)$data['estimated_cost'] : 0.0;
            $id = isset($data['id']) ? (int)$data['id'] : null;

            if ($id) {
                // Update
                $conn->query("UPDATE treatment_categories SET name='$name', description='$description', estimated_cost=$estimated_cost WHERE id=$id");
                echo json_encode(['status' => 'success', 'message' => 'Category updated']);
            } else {
                // Insert
                $conn->query("INSERT INTO treatment_categories (name, description, estimated_cost) VALUES ('$name', '$description', $estimated_cost)");
                echo json_encode(['status' => 'success', 'message' => 'Category added']);
            }
            break;

        case 'DELETE':
            $id = (int)$_GET['id'];
            // Check if categories are in use
            $check = $conn->query("SELECT id FROM treatment_tickets WHERE category_id = $id LIMIT 1");
            if ($check->num_rows > 0) {
                echo json_encode(['status' => 'error', 'message' => 'Cannot delete category that is in use by treatment tickets']);
            } else {
                $conn->query("DELETE FROM treatment_categories WHERE id=$id");
                echo json_encode(['status' => 'success', 'message' => 'Category deleted']);
            }
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
