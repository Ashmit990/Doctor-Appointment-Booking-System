<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    error_log("Patient profile GET request for patient_id: " . $patient_id);
    
    $stmt = $conn->prepare("
        SELECT
            u.full_name,
            u.email,
            pp.age,
            pp.blood_group,
            pp.contact_number,
            pp.address,
            pp.gender,
            pp.emergency_contact_name,
            pp.emergency_contact_phone
        FROM users u
        LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
        WHERE u.user_id = ?
    ");
    
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
        $conn->close();
        exit;
    }
    
    $stmt->bind_param("s", $patient_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        error_log("Patient not found with ID: " . $patient_id);
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        $conn->close();
        exit;
    }

    error_log("Patient profile data: " . json_encode($row));
    echo json_encode(['status' => 'success', 'data' => $row]);
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

// Log incoming request for debugging
error_log("Patient profile PUT request: " . json_encode($input));

// Trim and sanitize inputs
$full_name = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$age = isset($input['age']) ? (int)$input['age'] : null;
$blood_group = trim($input['blood_group'] ?? '') ?: null;
$contact_number = trim($input['contact_number'] ?? '') ?: null;
$address = trim($input['address'] ?? '') ?: null;
$gender = trim($input['gender'] ?? '') ?: null;
$emergency_name = trim($input['emergency_contact_name'] ?? '') ?: null;
$emergency_phone = trim($input['emergency_contact_phone'] ?? '') ?: null;

// Comprehensive validation
$errors = [];

// Validate required fields
if (empty($full_name)) {
    $errors[] = 'Full name is required';
}
if (empty($email)) {
    $errors[] = 'Email is required';
}
if (empty($contact_number)) {
    $errors[] = 'Phone number is required';
}
if ($age === null) {
    $errors[] = 'Age is required';
}
if (empty($gender)) {
    $errors[] = 'Gender is required';
}
if (empty($blood_group)) {
    $errors[] = 'Blood group is required';
}
if (empty($address)) {
    $errors[] = 'Address is required';
}
if (empty($emergency_name)) {
    $errors[] = 'Emergency contact name is required';
}
if (empty($emergency_phone)) {
    $errors[] = 'Emergency contact phone is required';
}

// Validate email format
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email format is invalid';
}

// Validate age if provided
if ($age !== null && ($age < 0 || $age > 150)) {
    $errors[] = 'Age must be between 0 and 150';
}

// Validate phone format if provided
if (!empty($contact_number)) {
    $digits = preg_replace('/[^\d]/', '', $contact_number);
    if (strlen($digits) < 8) {
        $errors[] = 'Phone number must have at least 8 digits';
    }
}

// Validate emergency phone format
if (!empty($emergency_phone)) {
    $digits = preg_replace('/[^\d]/', '', $emergency_phone);
    if (strlen($digits) < 8) {
        $errors[] = 'Emergency phone must have at least 8 digits';
    }
}

// If there are validation errors, return them
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode('; ', $errors)]);
    $conn->close();
    exit;
}

// Check if email is already in use by another user
$check = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
if (!$check) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}
$check->bind_param("ss", $email, $patient_id);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    $check->close();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email already in use']);
    $conn->close();
    exit;
}
$check->close();

$conn->begin_transaction();
try {
    $u = $conn->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ?");
    if (!$u) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $u->bind_param("sss", $full_name, $email, $patient_id);
    if (!$u->execute()) {
        throw new Exception("Execute failed: " . $u->error);
    }
    $u->close();

    $pp = $conn->prepare("
        INSERT INTO patient_profiles (
            user_id, age, blood_group, contact_number, address,
            gender, emergency_contact_name, emergency_contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            age = VALUES(age),
            blood_group = VALUES(blood_group),
            contact_number = VALUES(contact_number),
            address = VALUES(address),
            gender = VALUES(gender),
            emergency_contact_name = VALUES(emergency_contact_name),
            emergency_contact_phone = VALUES(emergency_contact_phone)
    ");
    if (!$pp) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $pp->bind_param(
        "ssisssss",
        $patient_id,
        $age,
        $blood_group,
        $contact_number,
        $address,
        $gender,
        $emergency_name,
        $emergency_phone
    );
    if (!$pp->execute()) {
        throw new Exception("Execute failed: " . $pp->error);
    }
    $pp->close();

    $conn->commit();
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>
