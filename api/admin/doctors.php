<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;
        $doctor_id = $_GET['doctor_id'] ?? null;

        if ($doctor_id) {
            // Get single doctor with ALL details - Using correct column names
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.created_at,
                    dp.medical_id,
                    dp.specialization,
                    dp.contact_number,
                    dp.experience_years,
                    dp.qualifications,
                    dp.consultation_fee,
                    dp.bio,
                    dp.age,
                    dp.is_available,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id) as total_appointments,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id AND status = 'Completed') as completed_appointments
                FROM users u
                LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
                WHERE u.user_id = ? AND u.role = 'Doctor'
            ");
            $stmt->bind_param("s", $doctor_id);
            $stmt->execute();
            $doctor = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$doctor) {
                echo json_encode(['status' => 'error', 'message' => 'Doctor not found']);
                exit;
            }

            echo json_encode([
                'status' => 'success',
                'data' => $doctor
            ]);

        } else {
            // Get all doctors for listing
            $stmt = $conn->prepare("
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    COALESCE(dp.specialization, 'Not Specified') as specialization,
                    dp.consultation_fee,
                    dp.is_available,
                    (SELECT COUNT(*) FROM appointments WHERE doctor_id = u.user_id) as total_appointments
                FROM users u
                LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
                WHERE u.role = 'Doctor'
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $doctors = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            // Get total count
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'Doctor'");
            $stmt->execute();
            $total_result = $stmt->get_result()->fetch_assoc();
            $total = $total_result['total'];
            $stmt->close();

            echo json_encode([
                'status' => 'success',
                'data' => $doctors,
                'total' => $total,
                'page' => $page,
                'pages' => ceil($total / $limit)
            ]);
        }

    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $doctor_id      = $input['doctor_id']       ?? null;
        $full_name      = $input['full_name']        ?? null;
        $email          = $input['email']            ?? null;
        $specialization = $input['specialization']   ?? null;
        $contact_number = $input['contact_number']   ?? null;
        $experience_years = $input['experience_years'] ?? null;
        $qualifications = $input['qualifications']   ?? null;
        $bio            = $input['bio']              ?? null;
        $age            = $input['age']              ?? null;
        $consultation_fee = $input['consultation_fee'] ?? null;
        $is_available   = isset($input['is_available']) ? $input['is_available'] : null;

        if (!$doctor_id) throw new Exception('Doctor ID required');

        $stmt = $conn->prepare('SELECT full_name, email FROM users WHERE user_id = ? AND role = \'Doctor\'');
        $stmt->bind_param('s', $doctor_id);
        $stmt->execute();
        $before = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$before) throw new Exception('Doctor not found');

        if ($full_name !== null || $email !== null) {
            $userUpdates = [];
            $userParams = [];
            $userTypes = "";
            
            if ($full_name !== null) { $userUpdates[] = "full_name = ?"; $userParams[] = $full_name; $userTypes .= "s"; }
            if ($email !== null) { $userUpdates[] = "email = ?"; $userParams[] = $email; $userTypes .= "s"; }
            
            $userParams[] = $doctor_id;
            $userTypes .= "s";
            
            $stmt = $conn->prepare("UPDATE users SET " . implode(", ", $userUpdates) . " WHERE user_id = ? AND role = 'Doctor'");
            $stmt->bind_param($userTypes, ...$userParams);
            if (!$stmt->execute()) throw new Exception($stmt->error);
            $stmt->close();

            $nameChanged  = $full_name !== null && trim((string)$before['full_name']) !== trim((string)$full_name);
            $emailChanged = $email !== null && strcasecmp(trim((string)$before['email']), trim((string)$email)) !== 0;
            
            if ($nameChanged || $emailChanged) {
                $newName = $full_name ?? $before['full_name'];
                $newEmail = $email ?? $before['email'];
                $msg = 'An administrator updated your account. Your display name is now: ' . $newName . '. Your email is now: ' . $newEmail . '.';
                $n = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, 'Account updated by admin', ?, 0, NOW())");
                $n->bind_param('ss', $doctor_id, $msg);
                $n->execute();
                $n->close();
            }
        }

        $profileUpdates = [];
        $profileParams = [];
        $profileTypes = "";

        if ($specialization !== null) { $profileUpdates[] = "specialization = ?"; $profileParams[] = $specialization; $profileTypes .= "s"; }
        if ($contact_number !== null) { $profileUpdates[] = "contact_number = ?"; $profileParams[] = $contact_number; $profileTypes .= "s"; }
        if ($experience_years !== null) { $profileUpdates[] = "experience_years = ?"; $profileParams[] = (int)$experience_years; $profileTypes .= "i"; }
        if ($qualifications !== null) { $profileUpdates[] = "qualifications = ?"; $profileParams[] = $qualifications; $profileTypes .= "s"; }
        if ($bio !== null) { $profileUpdates[] = "bio = ?"; $profileParams[] = $bio; $profileTypes .= "s"; }
        if ($age !== null) { $profileUpdates[] = "age = ?"; $profileParams[] = (int)$age; $profileTypes .= "i"; }
        if ($consultation_fee !== null) { $profileUpdates[] = "consultation_fee = ?"; $profileParams[] = (float)$consultation_fee; $profileTypes .= "d"; }
        if ($is_available !== null) { $profileUpdates[] = "is_available = ?"; $profileParams[] = (int)$is_available; $profileTypes .= "i"; }

        if (!empty($profileUpdates)) {
            $profileParams[] = $doctor_id;
            $profileTypes .= "s";
            
            $stmt = $conn->prepare("UPDATE doctor_profiles SET " . implode(", ", $profileUpdates) . " WHERE user_id = ?");
            $stmt->bind_param($profileTypes, ...$profileParams);
            if (!$stmt->execute()) throw new Exception($stmt->error);
            
            // If no rows were affected, maybe the profile doesn't exist? (Should not happen for approved doctors)
            if ($stmt->affected_rows === 0) {
                // Check if it exists at all
                $check = $conn->prepare("SELECT 1 FROM doctor_profiles WHERE user_id = ?");
                $check->bind_param("s", $doctor_id);
                $check->execute();
                if (!$check->get_result()->fetch_assoc()) {
                    // Profile doesn't exist, this is unexpected for a doctor in the list, but we should handle it
                    throw new Exception("Doctor profile not found in database.");
                }
                $check->close();
            }
            $stmt->close();
        }

        echo json_encode(['status' => 'success', 'message' => 'Doctor updated successfully']);

    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents("php://input"), true);
        $doctor_id = $input['doctor_id'] ?? null;

        if (!$doctor_id) {
            echo json_encode(['status' => 'error', 'message' => 'Doctor ID required']);
            exit;
        }

        $conn->begin_transaction();
        try {
            // Delete earnings for any appointments belonging to this doctor first
            $stmt = $conn->prepare(
                "DELETE e FROM earnings e
                 INNER JOIN appointments a ON e.appointment_id = a.appointment_id
                 WHERE a.doctor_id = ?"
            );
            $stmt->bind_param("s", $doctor_id);
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $stmt->close();

            // Delete appointments for this doctor
            // Skipping deletion of appointments to preserve them when a doctor is removed.
            // $stmt = $conn->prepare("DELETE FROM appointments WHERE doctor_id = ?");
            // $stmt->bind_param("s", $doctor_id);
            // if (!$stmt->execute()) {
            //     throw new Exception($stmt->error);
            // }
            // $stmt->close();

            // Delete doctor profile if present
            $stmt = $conn->prepare("DELETE FROM doctor_profiles WHERE user_id = ?");
            $stmt->bind_param("s", $doctor_id);
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $stmt->close();

            // Delete doctor user record
            $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ? AND role = 'Doctor'");
            $stmt->bind_param("s", $doctor_id);
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $stmt->close();

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Doctor deleted successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete doctor: ' . $e->getMessage()]);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>