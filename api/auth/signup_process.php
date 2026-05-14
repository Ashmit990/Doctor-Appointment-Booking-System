<?php
session_start();
require_once '../config/db.php';
require_once '../includes/csrf_protection.php';
require_once '../includes/password_helper.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // CSRF Token Validation
    if (!CSRFProtection::validateToken()) {
        echo json_encode(['success' => false, 'message' => 'Security token validation failed. Please try again.']);
        exit;
    }

    $full_name    = trim($_POST['full_name'] ?? '');
    $email        = strtolower(trim($_POST['email'] ?? ''));
    $phone        = trim($_POST['phone'] ?? '');
    $age          = (int)($_POST['age'] ?? 0);
    $role         = ($_POST['role'] ?? '') === 'Medical Professional' ? 'Doctor' : 'Patient';
    $password     = $_POST['password'] ?? '';
    $bio          = trim($_POST['bio'] ?? '');
    $medical_id   = trim($_POST['medical_id'] ?? '');
    $profession   = trim($_POST['profession'] ?? '');

    $specialization    = !empty($profession) ? $profession : 'General';
    $consultation_fee  = 500.00;

    // ── Basic required-field check ──────────────────────────────────────────
    if (empty($full_name) || empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Required fields are missing."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email format."]);
        exit;
    }

    // ── Duplicate e-mail check (users + pending approvals) ──────────────────
    $stmt = $conn->prepare(
        "SELECT email FROM users WHERE email = ?
         UNION
         SELECT email FROM doctor_approvals WHERE email = ?"
    );
    $stmt->bind_param("ss", $email, $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "This email is already registered."]);
        exit;
    }
    $stmt->close();

    // ════════════════════════════════════════════════════════════════════════
    //  PATIENT REGISTRATION
    // ════════════════════════════════════════════════════════════════════════
    if ($role === 'Patient') {

        $user_id = 'PAT_' . strtoupper(substr(uniqid(), -4));
        $dob     = (date('Y') - $age) . '-01-01';

        $conn->begin_transaction();
        try {
            $password_hash = app_hash_password($password);
            // Insert into users
            $stmt = $conn->prepare(
                "INSERT INTO users (user_id, full_name, email, password_hash, role)
                 VALUES (?, ?, ?, ?, 'Patient')"
            );
            if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
            $stmt->bind_param("ssss", $user_id, $full_name, $email, $password_hash);
            if (!$stmt->execute()) throw new Exception("Execute failed: " . $stmt->error);
            $stmt->close();

            // Build patient_profiles insert dynamically (handles schema variations)
            $cols   = [];
            $colRes = $conn->query("SHOW COLUMNS FROM patient_profiles");
            if ($colRes) {
                while ($row = $colRes->fetch_assoc()) {
                    $cols[$row['Field']] = true;
                }
            }

            $profileColumns = ['user_id'];
            $profileValues  = [$user_id];
            $types          = 's';

            if (isset($cols['contact_number'])) {
                $profileColumns[] = 'contact_number';
                $profileValues[]  = $phone;
                $types           .= 's';
            }
            if (isset($cols['age'])) {
                $profileColumns[] = 'age';
                $profileValues[]  = $age;
                $types           .= 'i';
            }
            if (isset($cols['dob'])) {
                $profileColumns[] = 'dob';
                $profileValues[]  = $dob;
                $types           .= 's';
            }

            $placeholders = implode(', ', array_fill(0, count($profileColumns), '?'));
            $sql          = "INSERT INTO patient_profiles ("
                          . implode(', ', $profileColumns)
                          . ") VALUES ($placeholders)";

            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
            $stmt->bind_param($types, ...$profileValues);
            if (!$stmt->execute()) throw new Exception("Execute failed: " . $stmt->error);
            $stmt->close();

            $conn->commit();

            // ✅  success => true  (JS checks data.success — NOT data.status)
            echo json_encode([
                "success"  => true,
                "message"  => "Patient registration successful!",
                "redirect" => "login.html"
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Signup failed: " . $e->getMessage()]);
        }

    // ════════════════════════════════════════════════════════════════════════
    //  DOCTOR REGISTRATION  (goes to approval queue)
    // ════════════════════════════════════════════════════════════════════════
    } else if ($role === 'Doctor') {

        try {
            if (empty($medical_id)) {
                throw new Exception("Medical ID is required for medical professionals.");
            }

            // Pack extra info into bio JSON so nothing is lost before admin approval
            $bio_data = json_encode([
                'phone'          => $phone,
                'age'            => $age,
                'medical_id'     => $medical_id,
                'specialization' => $specialization,
                'bio'            => $bio
            ]);

            // Detect schema (with / without medical_id column)
            $approvalCols = [];
            $colRes       = $conn->query("SHOW COLUMNS FROM doctor_approvals");
            if ($colRes) {
                while ($row = $colRes->fetch_assoc()) {
                    $approvalCols[$row['Field']] = true;
                }
            }

            $approval_password_hash = app_hash_password($password);
            if (isset($approvalCols['medical_id'])) {
                $stmt = $conn->prepare(
                    "INSERT INTO doctor_approvals
                        (full_name, email, password_hash, medical_id, specialization, bio, status)
                     VALUES (?, ?, ?, ?, ?, ?, 'Pending')"
                );
                if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
                $stmt->bind_param("ssssss",
                    $full_name, $email, $approval_password_hash,
                    $medical_id, $specialization, $bio_data
                );
            } else {
                $stmt = $conn->prepare(
                    "INSERT INTO doctor_approvals
                        (full_name, email, password_hash, specialization, bio, status)
                     VALUES (?, ?, ?, ?, ?, 'Pending')"
                );
                if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
                $stmt->bind_param("sssss",
                    $full_name, $email, $approval_password_hash,
                    $specialization, $bio_data
                );
            }

            $stmt->execute();
            $stmt->close();

            // ✅  success => true
            echo json_encode([
                "success" => true,
                "message" => "Application submitted! Please wait for Admin approval."
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "success" => false,
                "message" => "Error submitting application: " . $e->getMessage()
            ]);
        }
    }
}
?>