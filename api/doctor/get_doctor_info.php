<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'No session found', 'debug' => 'Not logged in']);
    exit;
}

$doctor_id = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("
        SELECT u.user_id, u.full_name, u.email, dp.medical_id, dp.specialization, dp.consultation_fee, dp.age, dp.contact_number, dp.experience_years, dp.qualifications, dp.bio 
        FROM users u 
        LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id 
        WHERE u.user_id = ? AND u.role = 'Doctor'
    ");
    
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Prepare failed', 'debug' => $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    $stmt->close();
    
    if ($profile) {
        // If bio contains JSON data (old format), parse it and merge
        if (!empty($profile['bio']) && strpos($profile['bio'], '{') === 0) {
            $bio_data = json_decode($profile['bio'], true);
            if (is_array($bio_data)) {
                // Merge old format data with individual columns for backwards compatibility
                if (!empty($bio_data['phone']) && empty($profile['contact_number'])) {
                    $profile['contact_number'] = $bio_data['phone'];
                }
                if (!empty($bio_data['experience']) && empty($profile['experience_years'])) {
                    $profile['experience_years'] = $bio_data['experience'];
                }
                if (!empty($bio_data['qualification']) && empty($profile['qualifications'])) {
                    $profile['qualifications'] = $bio_data['qualification'];
                }
                if (!empty($bio_data['description']) && empty($profile['bio'])) {
                    $profile['bio'] = $bio_data['description'];
                }
            }
        }
        
        echo json_encode(['status' => 'success', 'data' => $profile]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Doctor profile not found', 'debug' => 'Query returned no rows']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'debug' => 'Exception caught']);
}

$conn->close();
?>
