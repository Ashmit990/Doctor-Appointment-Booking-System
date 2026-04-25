<?php
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $age = (int)($_POST['age'] ?? 0);
    // Map UI role to Database role
    $role = ($_POST['role'] ?? '') === 'Medical Professional' ? 'Doctor' : 'Patient';
    $password = $_POST['password'] ?? ''; 
    $bio = trim($_POST['bio'] ?? '');

    // Default values for doctors (can be updated by admin later)
    $specialization = 'General';
    $consultation_fee = 500.00;

    if (empty($full_name) || empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Required fields are missing."]);
        exit;
    }

    // Check if email already exists in users or pending approvals
    $stmt = $conn->prepare("SELECT email FROM users WHERE email = ? UNION SELECT email FROM doctor_approvals WHERE email = ?");
    $stmt->bind_param("ss", $email, $email);
    $stmt->execute();
    if($stmt->get_result()->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "This email is already registered."]);
        exit;
    }
    $stmt->close();

    if ($role === 'Patient') {
        $user_id = 'PAT_' . strtoupper(substr(uniqid(), -4));
        $dob = (date('Y') - $age) . '-01-01'; 
        
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'Patient')");
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param("ssss", $user_id, $full_name, $email, $password);
            if (!$stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }
            $stmt->close();

            // Support both old/new schemas by inserting only columns that exist.
            $cols = [];
            $colRes = $conn->query("SHOW COLUMNS FROM patient_profiles");
            if ($colRes) {
                while ($row = $colRes->fetch_assoc()) {
                    $cols[$row['Field']] = true;
                }
            }

            $profileColumns = ['user_id'];
            $profileValues = [$user_id];
            $types = 's';

            if (isset($cols['contact_number'])) {
                $profileColumns[] = 'contact_number';
                $profileValues[] = $phone;
                $types .= 's';
            }

            if (isset($cols['age'])) {
                $profileColumns[] = 'age';
                $profileValues[] = $age;
                $types .= 'i';
            }

            if (isset($cols['dob'])) {
                $profileColumns[] = 'dob';
                $profileValues[] = $dob;
                $types .= 's';
            }

            $placeholders = implode(', ', array_fill(0, count($profileColumns), '?'));
            $sql = "INSERT INTO patient_profiles (" . implode(', ', $profileColumns) . ") VALUES (" . $placeholders . ")";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param($types, ...$profileValues);
            if (!$stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }
            $stmt->close();
            
            $conn->commit();
            echo json_encode(["status" => "success", "message" => "Patient registration successful!", "redirect" => "login.html"]);
        } catch(Exception $e) {
            $conn->rollback();
            echo json_encode(["status" => "error", "message" => "Signup failed: " . $e->getMessage()]);
        }
    } else if ($role === 'Doctor') {
        try {
            // Inserting into the staging table. Password remains plain text as requested.
            // Store phone, bio in bio column for now - will be moved to individual columns upon admin approval
            $bio_data = json_encode([
                'phone' => $phone,
                'age' => $age,
                'bio' => $bio
            ]);
            
            $stmt = $conn->prepare("INSERT INTO doctor_approvals (full_name, email, password_hash, specialization, consultation_fee, bio, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
            $stmt->bind_param("ssssds", $full_name, $email, $password, $specialization, $consultation_fee, $bio_data);
            $stmt->execute();
            
            echo json_encode(["status" => "success", "message" => "Application submitted! Please wait for Admin approval.", "redirect" => "login.html"]);
        } catch(Exception $e) {
            echo json_encode(["status" => "error", "message" => "Error submitting application: " . $e->getMessage()]);
        }
    }
}
?>