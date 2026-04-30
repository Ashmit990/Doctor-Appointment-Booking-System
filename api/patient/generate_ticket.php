<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    $conn->close();
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$appointment_id = isset($input['appointment_id']) ? (int) $input['appointment_id'] : 0;
$category_id_override = isset($input['category_id']) ? (int) $input['category_id'] : 0;

if ($appointment_id < 1 && $category_id_override < 1) {
    echo json_encode(['status' => 'error', 'message' => 'Valid appointment_id is required']);
    $conn->close();
    exit;
}

// If appointment_id provided, auto-detect category from doctor's specialization
$cat = null;
if ($appointment_id > 0) {
    // Check if ticket already exists for this appointment
    $chk = $conn->prepare("SELECT id FROM treatment_tickets WHERE appointment_id = ?");
    $chk->bind_param("i", $appointment_id);
    $chk->execute();
    if ($chk->get_result()->fetch_assoc()) {
        $chk->close();
        echo json_encode(['status' => 'exists', 'message' => 'Ticket already generated for this appointment']);
        $conn->close();
        exit;
    }
    $chk->close();

    // Get appointment + doctor specialization
    $astmt = $conn->prepare("
        SELECT a.doctor_id, dp.specialization
        FROM appointments a
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
        WHERE a.appointment_id = ? AND a.patient_id = ?
    ");
    $astmt->bind_param("is", $appointment_id, $patient_id);
    $astmt->execute();
    $apt = $astmt->get_result()->fetch_assoc();
    $astmt->close();

    if (!$apt) {
        echo json_encode(['status' => 'error', 'message' => 'Appointment not found']);
        $conn->close();
        exit;
    }

    // Map specialization keyword → category name
    $spec_lower = strtolower($apt['specialization'] ?? '');
    $keyword_map = [
        'cardio'   => 'Cardiology',
        'ortho'    => 'Orthopedics',
        'derma'    => 'Dermatology',
        'neuro'    => 'Neurology',
        'pediatr'  => 'Pediatrics',
        'paediatr' => 'Pediatrics',
        'gynaeco'  => 'Gynecology',
        'gyneco'   => 'Gynecology',
        'ophthal'  => 'Ophthalmology',
        'physio'   => 'Physiotherapy',
        'dent'     => 'Dentistry',
        'general'  => 'General Consultation',
    ];
    $category_name = 'General Consultation';
    foreach ($keyword_map as $kw => $name) {
        if (strpos($spec_lower, $kw) !== false) {
            $category_name = $name;
            break;
        }
    }

    $cstmt = $conn->prepare("SELECT id, name, estimated_cost FROM treatment_categories WHERE name = ?");
    $cstmt->bind_param("s", $category_name);
    $cstmt->execute();
    $cat = $cstmt->get_result()->fetch_assoc();
    $cstmt->close();
}

// Fallback: use category_id_override or first category
if (!$cat) {
    if ($category_id_override > 0) {
        $cstmt = $conn->prepare("SELECT id, name, estimated_cost FROM treatment_categories WHERE id = ?");
        $cstmt->bind_param("i", $category_id_override);
        $cstmt->execute();
        $cat = $cstmt->get_result()->fetch_assoc();
        $cstmt->close();
    }
    if (!$cat) {
        $cat = $conn->query("SELECT id, name, estimated_cost FROM treatment_categories ORDER BY id ASC LIMIT 1")->fetch_assoc();
    }
}

if (!$cat) {
    echo json_encode(['status' => 'error', 'message' => 'No treatment categories found. Please seed the database.']);
    $conn->close();
    exit;
}

date_default_timezone_set('Asia/Kathmandu');
$ticket_number = 'TKT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
$cost          = (float) $cat['estimated_cost'];
$cat_id        = (int)   $cat['id'];
$generated_at  = date('Y-m-d H:i:s');
$apt_id_val    = $appointment_id > 0 ? $appointment_id : null;

$ins = $conn->prepare("INSERT INTO treatment_tickets (ticket_number, patient_id, appointment_id, category_id, cost, generated_at) VALUES (?, ?, ?, ?, ?, ?)");
$ins->bind_param("ssiids", $ticket_number, $patient_id, $apt_id_val, $cat_id, $cost, $generated_at);
$ins->execute();
$ticket_id = $conn->insert_id;
$ins->close();

echo json_encode([
    'status' => 'success',
    'data'   => [
        'id'               => $ticket_id,
        'ticket_number'    => $ticket_number,
        'category'         => $cat['name'],
        'cost'             => $cost,
        'generated_at'     => $generated_at,
    ]
]);
$conn->close();
