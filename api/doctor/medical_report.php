<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

function has_forbidden_medical_report_chars($value) {
    return is_string($value) && preg_match('/[-*&]/', $value);
}

function reject_forbidden_medical_report_chars($label, $value) {
    if (has_forbidden_medical_report_chars($value)) {
        echo json_encode(['status' => 'error', 'message' => $label . ' cannot contain special characters like -, * or &.']);
        exit;
    }
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Save medical report
        $data = json_decode(file_get_contents('php://input'), true);
        
        $appointment_id = isset($data['appointment_id']) ? (int)$data['appointment_id'] : null;
        $symptoms = trim($data['symptoms'] ?? '');
        $diagnosis = trim($data['diagnosis'] ?? '');
        $blood_pressure = $data['blood_pressure'] ?? null;
        $weight = isset($data['weight']) ? (float)$data['weight'] : null;
        $prescribed_medicines_input = $data['prescribed_medicines'] ?? [];
        $additional_notes = trim($data['additional_notes'] ?? '');
        
        if (!$appointment_id) {
            echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required']);
            exit;
        }

        if ($symptoms === '') {
            echo json_encode(['status' => 'error', 'message' => 'Symptoms are required']);
            exit;
        }

        if ($diagnosis === '') {
            echo json_encode(['status' => 'error', 'message' => 'Diagnosis is required']);
            exit;
        }

        reject_forbidden_medical_report_chars('Symptoms', $symptoms);
        reject_forbidden_medical_report_chars('Diagnosis', $diagnosis);
        reject_forbidden_medical_report_chars('Additional notes', $additional_notes);

        if (!is_array($prescribed_medicines_input)) {
            echo json_encode(['status' => 'error', 'message' => 'Prescribed medicines must be an array']);
            exit;
        }

        $clean_prescribed_medicines = [];
        foreach ($prescribed_medicines_input as $index => $medicine) {
            $medicine_name = trim($medicine['name'] ?? '');
            $medicine_dosage = trim($medicine['dosage'] ?? '');
            $medicine_frequency = trim($medicine['frequency'] ?? '');

            if ($medicine_name === '') {
                continue;
            }

            reject_forbidden_medical_report_chars('Medicine name', $medicine_name);
            reject_forbidden_medical_report_chars('Medicine dosage', $medicine_dosage);
            reject_forbidden_medical_report_chars('Medicine frequency', $medicine_frequency);

            $clean_prescribed_medicines[] = [
                'name' => $medicine_name,
                'dosage' => $medicine_dosage,
                'frequency' => $medicine_frequency,
            ];
        }

        $prescribed_medicines = json_encode($clean_prescribed_medicines);
        
        // First, verify the appointment belongs to this doctor and get patient_id
        $verify_stmt = $conn->prepare("
            SELECT patient_id FROM appointments 
            WHERE appointment_id = ? AND doctor_id = ?
        ");
        
        if (!$verify_stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $verify_stmt->bind_param("is", $appointment_id, $doctor_id);
        $verify_stmt->execute();
        $result = $verify_stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Appointment not found or not yours']);
            $verify_stmt->close();
            exit;
        }
        
        $appointment = $result->fetch_assoc();
        $patient_id = $appointment['patient_id'];
        $verify_stmt->close();
        
        // Check if report already exists for this appointment
        $check_stmt = $conn->prepare("SELECT report_id FROM medical_reports WHERE appointment_id = ?");
        
        if (!$check_stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $check_stmt->bind_param("i", $appointment_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $check_stmt->close();

        $is_new_report = ($check_result->num_rows === 0);
        
        if ($check_result->num_rows > 0) {
            // Update existing report
            $stmt = $conn->prepare("
                UPDATE medical_reports 
                SET symptoms = ?, diagnosis = ?, blood_pressure = ?, weight = ?, 
                    prescribed_medicines = ?, additional_notes = ?
                WHERE appointment_id = ?
            ");
            
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param(
                "sssdssi",
                $symptoms,
                $diagnosis,
                $blood_pressure,
                $weight,
                $prescribed_medicines,
                $additional_notes,
                $appointment_id
            );
        } else {
            // Insert new report
            $stmt = $conn->prepare("
                INSERT INTO medical_reports 
                (appointment_id, patient_id, doctor_id, symptoms, diagnosis, blood_pressure, weight, prescribed_medicines, additional_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            if (!$stmt) {
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param(
                "isssssdss",
                $appointment_id,
                $patient_id,
                $doctor_id,
                $symptoms,
                $diagnosis,
                $blood_pressure,
                $weight,
                $prescribed_medicines,
                $additional_notes
            );
        }
        
        if ($stmt->execute()) {
            $report_id = $is_new_report ? $conn->insert_id : 0;

            if ($is_new_report) {
                $info_stmt = $conn->prepare("\n                    SELECT u.full_name AS doctor_name, a.app_date, a.app_time\n                    FROM appointments a\n                    JOIN users u ON a.doctor_id = u.user_id\n                    WHERE a.appointment_id = ? AND a.doctor_id = ?\n                ");

                if ($info_stmt) {
                    $info_stmt->bind_param("is", $appointment_id, $doctor_id);
                    $info_stmt->execute();
                    $info_result = $info_stmt->get_result()->fetch_assoc();
                    $info_stmt->close();

                    if ($info_result) {
                        $doctor_name = $info_result['doctor_name'] ?: 'Your doctor';
                        $appointmentDate = date('M d, Y', strtotime($info_result['app_date']));
                        $appointmentTime = date('h:i A', strtotime($info_result['app_time']));
                        $notif_title = 'Medical Report Ready';
                        $notif_message = "Your medical report for the appointment on {$appointmentDate} at {$appointmentTime} with {$doctor_name} is now available.";

                        $notif_stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())");
                        if ($notif_stmt) {
                            $notif_stmt->bind_param("sss", $patient_id, $notif_title, $notif_message);
                            $notif_stmt->execute();
                            $notif_stmt->close();
                        }
                    }
                }
            }

            echo json_encode([
                'status' => 'success',
                'message' => 'Medical report saved successfully',
                'report_id' => $report_id
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save report: ' . $stmt->error]);
        }
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Exception: ' . $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch medical report
    $appointment_id = isset($_GET['appointment_id']) ? (int)$_GET['appointment_id'] : null;
    $user_id = $_SESSION['user_id'];
    
    if (!$appointment_id) {
        echo json_encode(['status' => 'error', 'message' => 'Appointment ID is required']);
        exit;
    }
    
    try {
        // Allow doctor (report creator) or patient (appointment owner) to view the report
        $verify_query = "
            SELECT 
                mr.*,
                u.full_name as doctor_name,
                u.user_id as doctor_id,
                u.email as doctor_email,
                p.full_name as patient_name,
                p.user_id as patient_id,
                a.app_date,
                a.app_time,
                a.reason_for_visit,
                a.room_num
            FROM medical_reports mr
            JOIN users u ON mr.doctor_id = u.user_id
            JOIN users p ON mr.patient_id = p.user_id
            JOIN appointments a ON mr.appointment_id = a.appointment_id
            WHERE mr.appointment_id = ? AND (mr.doctor_id = ? OR mr.patient_id = ?)
        ";
        $stmt = $conn->prepare($verify_query);
        
        if (!$stmt) {
            echo json_encode(['status' => 'error', 'message' => 'Database prepare error: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param("iii", $appointment_id, $user_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Report not found']);
            $stmt->close();
            exit;
        }
        
        $report = $result->fetch_assoc();
        
        // Decode JSON medicines if present
        if (isset($report['prescribed_medicines']) && !empty($report['prescribed_medicines'])) {
            $report['prescribed_medicines'] = json_decode($report['prescribed_medicines'], true);
        } else {
            $report['prescribed_medicines'] = [];
        }
        
        $stmt->close();
        
        echo json_encode([
            'status' => 'success',
            'data' => $report
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }

$conn->close();
}

