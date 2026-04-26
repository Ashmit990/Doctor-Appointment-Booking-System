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
$medical_id = trim($input['medical_id'] ?? '');
$full_name = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$specialization = trim($input['specialization'] ?? '');
$phone = trim($input['phone'] ?? '');
$experience = trim($input['experience'] ?? '');
$age = isset($input['age']) ? (int)$input['age'] : null;
$qualification = trim($input['qualification'] ?? '');
$description = trim($input['description'] ?? '');

// Comprehensive validation
$errors = [];

// Validate required fields
if (empty($medical_id)) {
    $errors[] = 'Medical ID is required';
}
if (empty($full_name)) {
    $errors[] = 'Full name is required';
}
if (empty($email)) {
    $errors[] = 'Email is required';
}
if (empty($specialization)) {
    $errors[] = 'Specialization is required';
}
if (empty($phone)) {
    $errors[] = 'Phone number is required';
}
if (empty($experience)) {
    $errors[] = 'Years of experience is required';
}
if ($age === null) {
    $errors[] = 'Age is required';
}
if (empty($qualification)) {
    $errors[] = 'Qualification is required';
}
if (empty($description)) {
    $errors[] = 'Professional description is required';
}

// Validate email format
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email format is invalid';
}

// Validate lengths
if (!empty($full_name) && strlen($full_name) < 2) {
    $errors[] = 'Full name must be at least 2 characters';
}
if (!empty($specialization) && strlen($specialization) < 2) {
    $errors[] = 'Specialization must be at least 2 characters';
}
if (!empty($medical_id) && strlen($medical_id) < 4) {
    $errors[] = 'Medical ID must be at least 4 characters';
}

// Validate phone format
if (!empty($phone)) {
    $digits = preg_replace('/[^\d]/', '', $phone);
    if (strlen($digits) < 8) {
        $errors[] = 'Phone number must have at least 8 digits';
    }
}

// Validate age if provided
if ($age !== null && ($age < 18 || $age > 100)) {
    $errors[] = 'Age must be between 18 and 100';
}

// If there are validation errors, return them
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode('; ', $errors)]);
    exit;
}

try {
    // Update users table (full_name and email)
    $stmt = $conn->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("sss", $full_name, $email, $doctor_id);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    $stmt->close();

    // Update doctor_profiles table with individual columns
    $bio_data = $description; // Store just the description in bio field

    // Check if doctor profile exists
    $check_stmt = $conn->prepare("SELECT user_id FROM doctor_profiles WHERE user_id = ?");
    $check_stmt->bind_param("s", $doctor_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $exists = $result->num_rows > 0;
    $check_stmt->close();

    if ($exists) {
        // Update existing profile with individual columns
        $update_stmt = $conn->prepare("UPDATE doctor_profiles SET medical_id = ?, specialization = ?, contact_number = ?, experience_years = ?, qualifications = ?, age = ?, bio = ? WHERE user_id = ?");
        if (!$update_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $experience_years = (int)$experience; // Convert experience to years
        $update_stmt->bind_param("sssissss", $medical_id, $specialization, $phone, $experience_years, $qualification, $age, $bio_data, $doctor_id);
        if (!$update_stmt->execute()) {
            throw new Exception("Execute failed: " . $update_stmt->error);
        }
        $update_stmt->close();
    } else {
        // Insert new profile with individual columns
        $insert_stmt = $conn->prepare("INSERT INTO doctor_profiles (user_id, medical_id, specialization, contact_number, experience_years, qualifications, age, consultation_fee, bio) VALUES (?, ?, ?, ?, ?, ?, ?, 500.00, ?)");
        if (!$insert_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $experience_years = (int)$experience; // Convert experience to years
        $insert_stmt->bind_param("ssssisss", $doctor_id, $medical_id, $specialization, $phone, $experience_years, $qualification, $age, $bio_data);
        if (!$insert_stmt->execute()) {
            throw new Exception("Execute failed: " . $insert_stmt->error);
        }
        $insert_stmt->close();
    }

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully',
        'data' => [
            'medical_id' => $medical_id,
            'full_name' => $full_name,
            'email' => $email,
            'specialization' => $specialization,
            'phone' => $phone,
            'experience' => $experience,
            'age' => $age,
            'qualification' => $qualification,
            'description' => $description
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
