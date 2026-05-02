<?php
session_start();
require_once '../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

/**
 * Parse the bio field — either plain text or a JSON string.
 * Returns an array with keys: phone, age, medical_id, experience, qualification, bio_text, consultation_fee
 */
function parseBio($bioRaw) {
    $result = [
        'phone'            => 'N/A',
        'age'              => 'N/A',
        'medical_id'       => 'N/A',
        'experience'       => '0',
        'qualification'    => 'N/A',
        'bio_text'         => '',
        'consultation_fee' => '0.00'
    ];

    if (empty($bioRaw)) return $result;

    $trimmed = trim($bioRaw);

    // Try to parse as JSON
    if (isset($trimmed[0]) && ($trimmed[0] === '{' || $trimmed[0] === '[')) {
        $decoded = json_decode($trimmed, true);
        if (is_array($decoded)) {
            $result['phone']            = $decoded['phone']            ?? $decoded['contact']      ?? 'N/A';
            $result['age']              = $decoded['age']              ?? 'N/A';
            $result['medical_id']       = $decoded['medical_id']       ?? $decoded['medicalId']    ?? 'N/A';
            $result['experience']       = $decoded['experience']       ?? $decoded['exp']           ?? '0';
            $result['qualification']    = $decoded['qualification']    ?? $decoded['qualifications'] ?? 'N/A';
            $result['bio_text']         = $decoded['bio']              ?? $decoded['description']  ?? '';
            $result['consultation_fee'] = $decoded['consultation_fee'] ?? $decoded['fee']          ?? '0.00';
            return $result;
        }
    }

    // Plain text bio — no structured data
    $result['bio_text'] = $trimmed;
    return $result;
}

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: list pending approvals ───────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $conn->prepare(
        "SELECT approval_id, full_name, email, specialization, bio, submitted_at, reviewed_at, status
         FROM doctor_approvals
         WHERE status = 'Pending'
         ORDER BY submitted_at DESC"
    );
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Enrich each row with parsed bio fields
    foreach ($rows as &$row) {
        $parsed = parseBio($row['bio']);
        $row['parsed_phone']         = $parsed['phone'];
        $row['parsed_age']           = $parsed['age'];
        $row['parsed_medical_id']    = $parsed['medical_id'];
        $row['parsed_experience']    = $parsed['experience'];
        $row['parsed_qualification'] = $parsed['qualification'];
        $row['parsed_bio_text']      = $parsed['bio_text'];
        $row['consultation_fee']     = $parsed['consultation_fee'];
        unset($row['bio']); // don't send raw JSON blob to frontend
    }
    unset($row);

    echo json_encode(['status' => 'success', 'data' => $rows]);
    exit;
}

// ─── POST: approve / reject ─────────────────────────────────────────────────
if ($method === 'POST') {
    $input      = json_decode(file_get_contents("php://input"), true);
    $action     = $input['action']      ?? null;
    $approval_id = (int)($input['approval_id'] ?? 0);

    if (!$approval_id) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid approval ID.']);
        exit;
    }

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if ($action === 'approve') {
        $conn->begin_transaction();
        try {
            // 1. Fetch staging record
            $stmt = $conn->prepare(
                "SELECT * FROM doctor_approvals WHERE approval_id = ? AND status = 'Pending'"
            );
            $stmt->bind_param("i", $approval_id);
            $stmt->execute();
            $data = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$data) throw new Exception("Pending request not found.");

            // 2. Parse bio to get individual fields
            $parsed        = parseBio($data['bio']);
            $phone         = $parsed['phone'];
            $age           = $parsed['age'] !== '' ? (int)$parsed['age'] : null;
            $medical_id    = $parsed['medical_id'];
            $experience    = $parsed['experience'] !== '' ? (int)$parsed['experience'] : null;
            $qualification = $parsed['qualification'];
            $bio_text      = $parsed['bio_text'];

            // 3. Generate a unique doctor user ID
            $user_id = 'DOC_' . strtoupper(substr(uniqid(), -6));

            // 4. Insert into users table
            $stmt = $conn->prepare(
                "INSERT INTO users (user_id, full_name, email, password_hash, role)
                 VALUES (?, ?, ?, ?, 'Doctor')"
            );
            $stmt->bind_param(
                "ssss",
                $user_id,
                $data['full_name'],
                $data['email'],
                $data['password_hash']
            );
            $stmt->execute();
            $stmt->close();

            // 5. Insert into doctor_profiles with clean individual columns
            $stmt = $conn->prepare(
                "INSERT INTO doctor_profiles
                    (user_id, medical_id, specialization, contact_number, experience_years, qualifications, bio, age)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param(
                "ssssissi",
                $user_id,
                $medical_id,
                $data['specialization'],
                $phone,
                $experience,
                $qualification,
                $bio_text,
                $age
            );
            $stmt->execute();
            $stmt->close();

            // 6. Mark staging record as Accepted
            $stmt = $conn->prepare(
                "UPDATE doctor_approvals
                 SET status = 'Accepted', reviewed_at = NOW()
                 WHERE approval_id = ?"
            );
            $stmt->bind_param("i", $approval_id);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Doctor has been approved and activated.']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    // ── REJECT ───────────────────────────────────────────────────────────────
    if ($action === 'reject') {
        $stmt = $conn->prepare(
            "UPDATE doctor_approvals
             SET status = 'Rejected', reviewed_at = NOW()
             WHERE approval_id = ? AND status = 'Pending'"
        );
        $stmt->bind_param("i", $approval_id);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();

        if ($affected === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Request not found or already reviewed.']);
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Application rejected.']);
        }
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
}
?>