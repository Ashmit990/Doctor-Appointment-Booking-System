<?php
session_start();
header('Content-Type: application/json');

// Include database connection
require_once __DIR__ . '/../config/db.php';

// For testing - temporarily disable authentication
// After it works, uncomment the lines below to enable authentication
/*
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Administrator') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}
*/

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;
        
        // Get all patients list
        $query = "
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                p.contact_number,
                p.blood_group,
                p.gender,
                p.age,
                p.address,
                p.emergency_contact_name,
                p.emergency_contact_phone,
                COALESCE(
                    (SELECT COUNT(*) FROM appointments WHERE patient_id = u.user_id), 
                    0
                ) as total_appointments
            FROM users u
            LEFT JOIN patient_profiles p ON u.user_id = p.user_id
            WHERE u.role = 'Patient'
            ORDER BY u.full_name ASC
            LIMIT $limit OFFSET $offset
        ";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception('Query failed: ' . $conn->error);
        }
        
        $patients = [];
        while ($row = $result->fetch_assoc()) {
            $patients[] = $row;
        }

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM users WHERE role = 'Patient'";
        $countResult = $conn->query($countQuery);
        $total = 0;
        if ($countResult) {
            $total = $countResult->fetch_assoc()['total'];
        }

        echo json_encode([
            'status' => 'success',
            'data' => $patients,
            'total' => (int)$total,
            'page' => $page,
            'pages' => $total > 0 ? ceil($total / $limit) : 1
        ]);

    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents("php://input"), true);
        $patient_id = $input['patient_id'] ?? null;

        if (!$patient_id) {
            echo json_encode(['status' => 'error', 'message' => 'Patient ID required']);
            exit;
        }

        // First check if user exists and is a Patient
        $checkStmt = $conn->prepare("SELECT role FROM users WHERE user_id = ?");
        $checkStmt->bind_param("s", $patient_id);
        $checkStmt->execute();
        $user = $checkStmt->get_result()->fetch_assoc();
        $checkStmt->close();

        if (!$user || $user['role'] !== 'Patient') {
            echo json_encode(['status' => 'error', 'message' => 'Patient not found']);
            exit;
        }

        // Use prepared statements to prevent SQL injection
        $conn->begin_transaction();
        try {
            // Delete earnings for appointments belonging to this patient
            $delEarnings = $conn->prepare(
                "DELETE e FROM earnings e JOIN appointments a ON e.appointment_id = a.appointment_id WHERE a.patient_id = ?"
            );
            $delEarnings->bind_param("s", $patient_id);
            $delEarnings->execute();
            $delEarnings->close();

            // Delete from appointments
            $delAppointments = $conn->prepare("DELETE FROM appointments WHERE patient_id = ?");
            $delAppointments->bind_param("s", $patient_id);
            $delAppointments->execute();
            $delAppointments->close();
            
            // Delete from patient_profiles
            $delProfiles = $conn->prepare("DELETE FROM patient_profiles WHERE user_id = ?");
            $delProfiles->bind_param("s", $patient_id);
            $delProfiles->execute();
            $delProfiles->close();
            
            // Delete from users
            $delUsers = $conn->prepare("DELETE FROM users WHERE user_id = ? AND role = 'Patient'");
            $delUsers->bind_param("s", $patient_id);
            $delUsers->execute();
            $delUsers->close();

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Patient deleted successfully'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>