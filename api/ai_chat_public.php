<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST only.']);
    exit;
}

function loadEnvPublic($path) {
    if (!file_exists($path)) return [];
    $env = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$k, $v] = explode('=', $line, 2);
            $env[trim($k)] = trim($v);
        }
    }
    return $env;
}

$env = loadEnvPublic(__DIR__ . '/../.env');
$apiKey = $env['GROQ_API_KEY'] ?? '';

if (empty($apiKey) || $apiKey === 'your_groq_api_key_here') {
    echo json_encode(['status' => 'error', 'message' => 'Groq API key not configured. Please add GROQ_API_KEY to your .env file.']);
    exit;
}

// Fetch doctors for context (no session needed — public endpoint)
$doctorContext = '';
try {
    require_once __DIR__ . '/config/db.php';
    if (isset($conn) && !$conn->connect_error) {
        $res = $conn->query("
            SELECT u.full_name, dp.specialization
            FROM users u
            INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
            WHERE u.role = 'Doctor' AND COALESCE(dp.is_available, 1) = 1
            ORDER BY u.full_name ASC
            LIMIT 20
        ");
            if ($res && $res->num_rows > 0) {
            $docs = [];
            while ($row = $res->fetch_assoc()) {
                $docs[] = "- {$row['full_name']} ({$row['specialization']})";
            }
                $doctorContext = "\n\nDoctors on our platform:\n" . implode("\n", $docs);
        }
        $conn->close();
    }
} catch (Exception $e) { /* silently skip if DB unavailable */ }

$body = json_decode(file_get_contents('php://input'), true);
$message = trim($body['message'] ?? '');
$history = $body['history'] ?? [];

if (empty($message)) {
    echo json_encode(['status' => 'error', 'message' => 'Empty message.']);
    exit;
}

$systemPrompt = "You are a friendly and knowledgeable medical assistant for a doctor appointment booking platform called Healthcare. Your role is to:
- Help visitors understand their symptoms
- Suggest appropriate doctor specializations they should consult
- Answer general health-related questions
- Encourage users to sign up and book an appointment on our platform

Guidelines:
- Be conversational, empathetic, and easy to understand
- Keep responses concise (2-4 sentences unless more detail is genuinely needed)
- Always remind users that your suggestions are not a substitute for professional medical advice
- Do not make specific diagnoses
- IMPORTANT: ONLY append the [BOOK] token when the user explicitly describes a medical symptom or health problem (e.g. headache, chest pain, fever). When you do, place it at the very end on a new line in this exact format: [BOOK:SpecialistTitle:Specialization] — for example [BOOK:Neurologist:Neurology] or [BOOK:Dr. Sarah:Cardiology]. If a specific platform doctor matches the symptom, use their name as SpecialistTitle. Do NOT include this token for greetings, general chat, follow-up questions, or non-symptom messages.{$doctorContext}";

$messages = [['role' => 'system', 'content' => $systemPrompt]];
foreach ($history as $h) {
    $messages[] = ['role' => ($h['role'] === 'user' ? 'user' : 'assistant'), 'content' => $h['text']];
}
$messages[] = ['role' => 'user', 'content' => $message];

$payload = [
    'model' => 'llama-3.1-8b-instant',
    'messages' => $messages,
    'temperature' => 0.7,
    'max_tokens' => 512
];

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$response) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to reach Groq API.']);
    exit;
}

$data = json_decode($response, true);
if ($httpCode !== 200 || !isset($data['choices'][0]['message']['content'])) {
    echo json_encode(['status' => 'error', 'message' => $data['error']['message'] ?? 'Groq API error.']);
    exit;
}

$replyText = $data['choices'][0]['message']['content'];
$suggestedBooking = false;
$doctorTitle = '';
$doctorSpec = '';
if (preg_match('/\[BOOK:([^:]+):([^\]]+)\]/i', $replyText, $m)) {
    $suggestedBooking = true;
    $doctorTitle = trim($m[1]);
    $doctorSpec = trim($m[2]);
    $replyText = trim(preg_replace('/\[BOOK:[^\]]+\]/i', '', $replyText));
}
echo json_encode(['status' => 'success', 'reply' => $replyText, 'suggested_booking' => $suggestedBooking, 'doctor_title' => $doctorTitle, 'doctor_spec' => $doctorSpec]);
