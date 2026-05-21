<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$uploadDir = __DIR__ . '/../../uploads/patient_docs/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Auto-create table
$conn->query("
    CREATE TABLE IF NOT EXISTS patient_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        patient_id VARCHAR(50) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL DEFAULT 0,
        mime_type VARCHAR(100) NOT NULL DEFAULT '',
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_apt (appointment_id),
        INDEX idx_patient (patient_id)
    )
");
// Migrate patient_id column to VARCHAR if it was previously created as INT
$col = $conn->query("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patient_documents' AND COLUMN_NAME = 'patient_id'");
if ($col && ($row = $col->fetch_assoc()) && strtolower($row['DATA_TYPE']) !== 'varchar') {
    $conn->query("ALTER TABLE patient_documents MODIFY patient_id VARCHAR(50) NOT NULL");
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list documents for an appointment ────────────────────────────────────
if ($method === 'GET') {
    $appointment_id = intval($_GET['appointment_id'] ?? 0);
    if (!$appointment_id) {
        echo json_encode(['status' => 'error', 'message' => 'appointment_id required']);
        exit;
    }

    // Verify the appointment belongs to this patient
    $chk = $conn->prepare("SELECT appointment_id FROM appointments WHERE appointment_id=? AND patient_id=?");
    $chk->bind_param("is", $appointment_id, $patient_id);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, original_name, stored_name, file_size, mime_type, uploaded_at FROM patient_documents WHERE appointment_id=? AND patient_id=? ORDER BY uploaded_at DESC");
    $stmt->bind_param("is", $appointment_id, $patient_id);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $rows]);
    exit;
}

// ── POST: upload documents ────────────────────────────────────────────────────
if ($method === 'POST') {
    $appointment_id = intval($_POST['appointment_id'] ?? 0);
    if (!$appointment_id) {
        echo json_encode(['status' => 'error', 'message' => 'appointment_id required']);
        exit;
    }

    // Verify ownership
    $chk = $conn->prepare("SELECT appointment_id FROM appointments WHERE appointment_id=? AND patient_id=?");
    $chk->bind_param("is", $appointment_id, $patient_id);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit;
    }

    $allowed_ext = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'txt'];
    $allowed_mime = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif',
                     'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     'text/plain'];
    $max_size = 10 * 1024 * 1024; // 10 MB

    if (empty($_FILES['files'])) {
        echo json_encode(['status' => 'error', 'message' => 'No files uploaded']);
        exit;
    }

    $uploaded = [];
    $errors   = [];

    $files = $_FILES['files'];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $orig_name = is_array($files['name']) ? $files['name'][$i]    : $files['name'];
        $tmp_name  = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size      = is_array($files['size']) ? $files['size'][$i]    : $files['size'];
        $error     = is_array($files['error']) ? $files['error'][$i]  : $files['error'];
        $mime      = is_array($files['type']) ? $files['type'][$i]    : $files['type'];

        if ($error !== UPLOAD_ERR_OK) {
            $errors[] = "$orig_name: upload error ($error)";
            continue;
        }
        if ($size > $max_size) {
            $errors[] = "$orig_name: exceeds 10 MB limit";
            continue;
        }

        $ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed_ext)) {
            $errors[] = "$orig_name: file type not allowed";
            continue;
        }

        // Check MIME via finfo for safety
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected_mime = $finfo->file($tmp_name);
        if (!in_array($detected_mime, $allowed_mime)) {
            $errors[] = "$orig_name: MIME type not allowed";
            continue;
        }

        $stored_name = $patient_id . '_' . $appointment_id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest = $uploadDir . $stored_name;

        if (!move_uploaded_file($tmp_name, $dest)) {
            $errors[] = "$orig_name: failed to save";
            continue;
        }

        $stmt = $conn->prepare("INSERT INTO patient_documents (appointment_id, patient_id, original_name, stored_name, file_size, mime_type) VALUES (?,?,?,?,?,?)");
        $stmt->bind_param("isssis", $appointment_id, $patient_id, $orig_name, $stored_name, $size, $detected_mime);
        $stmt->execute();
        $doc_id = $conn->insert_id;

        $uploaded[] = [
            'id'            => $doc_id,
            'original_name' => $orig_name,
            'stored_name'   => $stored_name,
            'file_size'     => $size,
            'mime_type'     => $detected_mime,
            'uploaded_at'   => date('Y-m-d H:i:s'),
        ];
    }

    echo json_encode([
        'status'   => count($uploaded) > 0 ? 'success' : 'error',
        'uploaded' => $uploaded,
        'errors'   => $errors,
        'message'  => count($uploaded) . ' file(s) uploaded' . (count($errors) ? ', ' . count($errors) . ' failed' : ''),
    ]);
    exit;
}

// ── DELETE: remove a document ─────────────────────────────────────────────────
if ($method === 'DELETE') {
    parse_str(file_get_contents('php://input'), $data);
    $doc_id = intval($data['doc_id'] ?? $_GET['doc_id'] ?? 0);

    if (!$doc_id) {
        echo json_encode(['status' => 'error', 'message' => 'doc_id required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT stored_name FROM patient_documents WHERE id=? AND patient_id=?");
    $stmt->bind_param("is", $doc_id, $patient_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not found or forbidden']);
        exit;
    }

    $file = $uploadDir . $row['stored_name'];
    if (file_exists($file)) @unlink($file);

    $del = $conn->prepare("DELETE FROM patient_documents WHERE id=? AND patient_id=?");
    $del->bind_param("is", $doc_id, $patient_id);
    $del->execute();

    echo json_encode(['status' => 'success', 'message' => 'Deleted']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
