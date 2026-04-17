<?php
session_start();
header('Content-Type: application/json');

// Debug: Log session data
error_log("Session data: user_id=" . ($_SESSION['user_id'] ?? 'NOT SET') . ", role=" . ($_SESSION['role'] ?? 'NOT SET'));

// Check if user is logged in and is a doctor
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated - no user_id in session']);
    exit;
}

if (($_SESSION['role'] ?? '') !== 'Doctor') {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Not authorized - user is not a doctor. Role: ' . ($_SESSION['role'] ?? 'NONE')]);
    exit;
}

require_once '../config/db.php';

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

$doctor_id = $_SESSION['user_id'];
$full_name = $input['full_name'] ?? null;
$specialization = $input['specialization'] ?? null;
$phone = $input['phone'] ?? null;
$experience = $input['experience'] ?? null;
$age = isset($input['age']) ? (int)$input['age'] : null;
$qualification = $input['qualification'] ?? null;
$description = $input['description'] ?? null;
$availability_info = $input['availability_info'] ?? null;

// Validate required fields
if (!$full_name || !$specialization) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Name and specialization are required']);
    exit;
}

try {
    // Update users table (full_name)
    $stmt = $conn->prepare("UPDATE users SET full_name = ? WHERE user_id = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("ss", $full_name, $doctor_id);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    $stmt->close();

    // Update doctor_profiles table (specialization, age and store extra data in bio)
    $bio_data = json_encode([
        'phone' => $phone,
        'experience' => $experience,
        'qualification' => $qualification,
        'description' => $description,
        'availability_info' => $availability_info
    ]);

    // Check if doctor profile exists
    $check_stmt = $conn->prepare("SELECT user_id FROM doctor_profiles WHERE user_id = ?");
    $check_stmt->bind_param("s", $doctor_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $exists = $result->num_rows > 0;
    $check_stmt->close();

    if ($exists) {
        // Update existing profile
        $update_stmt = $conn->prepare("UPDATE doctor_profiles SET specialization = ?, age = ?, bio = ? WHERE user_id = ?");
        if (!$update_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $update_stmt->bind_param("siss", $specialization, $age, $bio_data, $doctor_id);
        if (!$update_stmt->execute()) {
            throw new Exception("Execute failed: " . $update_stmt->error);
        }
        $update_stmt->close();
    } else {
        // Insert new profile
        $insert_stmt = $conn->prepare("INSERT INTO doctor_profiles (user_id, specialization, age, consultation_fee, bio) VALUES (?, ?, ?, 500.00, ?)");
        if (!$insert_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $insert_stmt->bind_param("ssis", $doctor_id, $specialization, $age, $bio_data);
        if (!$insert_stmt->execute()) {
            throw new Exception("Execute failed: " . $insert_stmt->error);
        }
        $insert_stmt->close();
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'data' => [
            'full_name' => $full_name,
            'specialization' => $specialization,
            'phone' => $phone,
            'experience' => $experience,
            'age' => $age,
            'qualification' => $qualification,
            'description' => $description,
            'availability_info' => $availability_info
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
