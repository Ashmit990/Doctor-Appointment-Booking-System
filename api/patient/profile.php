<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    error_log("Patient profile GET request for patient_id: " . $patient_id);
    
    $stmt = $conn->prepare("
        SELECT
            u.full_name,
            u.email,
            pp.dob,
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

$full_name = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$dob = trim($input['dob'] ?? '') ?: null;
$age = isset($input['age']) ? (int)$input['age'] : null;
$blood_group = trim($input['blood_group'] ?? '') ?: null;
$contact_number = trim($input['contact_number'] ?? '') ?: null;
$address = trim($input['address'] ?? '') ?: null;
$gender = trim($input['gender'] ?? '') ?: null;
$emergency_name = trim($input['emergency_contact_name'] ?? '') ?: null;
$emergency_phone = trim($input['emergency_contact_phone'] ?? '') ?: null;

if ($full_name === '' || $email === '') {
    echo json_encode(['status' => 'error', 'message' => 'Full name and email are required']);
    $conn->close();
    exit;
}

$check = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
$check->bind_param("ss", $email, $patient_id);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    $check->close();
    echo json_encode(['status' => 'error', 'message' => 'Email already in use']);
    $conn->close();
    exit;
}
$check->close();

$conn->begin_transaction();
try {
    $u = $conn->prepare("UPDATE users SET full_name = ?, email = ? WHERE user_id = ?");
    $u->bind_param("sss", $full_name, $email, $patient_id);
    $u->execute();
    $u->close();

    $pp = $conn->prepare("
        INSERT INTO patient_profiles (
            user_id, dob, age, blood_group, contact_number, address,
            gender, emergency_contact_name, emergency_contact_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            dob = VALUES(dob),
            age = VALUES(age),
            blood_group = VALUES(blood_group),
            contact_number = VALUES(contact_number),
            address = VALUES(address),
            gender = VALUES(gender),
            emergency_contact_name = VALUES(emergency_contact_name),
            emergency_contact_phone = VALUES(emergency_contact_phone)
    ");
    $pp->bind_param(
        "ssissssss",
        $patient_id,
        $dob,
        $age,
        $blood_group,
        $contact_number,
        $address,
        $gender,
        $emergency_name,
        $emergency_phone
    );
    $pp->execute();
    $pp->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Profile updated']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
