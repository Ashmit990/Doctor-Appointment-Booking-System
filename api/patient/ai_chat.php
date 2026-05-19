<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST only.']);
    exit;
}

// Load .env
function loadEnvGemini($path) {
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

$env = loadEnvGemini(__DIR__ . '/../../.env');
$apiKey = $env['GROQ_API_KEY'] ?? '';

if (empty($apiKey) || $apiKey === 'your_groq_api_key_here') {
    echo json_encode(['status' => 'error', 'message' => 'Groq API key not configured. Please add GROQ_API_KEY to your .env file.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$message = trim($body['message'] ?? '');
$history = $body['history'] ?? [];
$sessionId = trim($body['session_id'] ?? '');

if (empty($message)) {
    echo json_encode(['status' => 'error', 'message' => 'Empty message.']);
    exit;
}

// Fetch active doctors for enhanced context
$doctorContext = '';
$res = $conn->query("
    SELECT u.full_name, dp.specialization, dp.experience_years
    FROM users u
    INNER JOIN doctor_profiles dp ON u.user_id = dp.user_id
     WHERE u.role = 'Doctor'
    ORDER BY u.full_name ASC
    LIMIT 20
");
if ($res && $res->num_rows > 0) {
    $docs = [];
    while ($row = $res->fetch_assoc()) {
        $docs[] = "- {$row['full_name']} ({$row['specialization']}" . ($row['experience_years'] ? ", {$row['experience_years']} yrs exp" : "") . ")";
    }
    $doctorContext = "\n\nCurrently available doctors on our platform:\n" . implode("\n", $docs);
}

$systemPrompt = "You are a friendly and knowledgeable medical assistant for a doctor appointment booking platform called Healthcare. Your role is to:\n- Help users understand their symptoms\n- Suggest appropriate doctor specializations\n- Recommend specific doctors from our platform when relevant\n- Answer general health-related questions\n\nGuidelines:\n- Be conversational, empathetic, and easy to understand\n- Keep responses concise (2-4 sentences unless more detail is genuinely needed)\n- Always remind users that your suggestions are not a substitute for professional medical advice\n- When suggesting doctors, mention their name and specialization\n- IMPORTANT: ONLY append the [BOOK] token when the user explicitly describes a medical symptom or health problem (e.g. headache, chest pain, fever, dizziness). When you do, place it at the very end on a new line in this exact format: [BOOK:SpecialistTitle:Specialization] — for example [BOOK:Neurologist:Neurology] or [BOOK:Dr. Sarah:Cardiology]. If a specific platform doctor fits the symptom, use their name as SpecialistTitle. Do NOT include this token for greetings, casual chat, follow-ups, or any non-symptom message.{$doctorContext}";

$messages = buildGroqMessages($systemPrompt, $history, $message);

$reply = callGroqAPI($apiKey, $messages);

// Save to chat history
if ($reply['status'] === 'success' && !empty($sessionId)) {
    $stmt = $conn->prepare("INSERT INTO ai_chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)");
    $userRole = 'user';
    $aiRole = 'ai';
    $stmt->bind_param('isss', $patient_id, $sessionId, $userRole, $message);
    $stmt->execute();
    $stmt->bind_param('isss', $patient_id, $sessionId, $aiRole, $reply['reply']);
    $stmt->execute();
    $stmt->close();
}
$conn->close();

echo json_encode($reply);

function buildGroqMessages($systemPrompt, $history, $message) {
    $messages = [['role' => 'system', 'content' => $systemPrompt]];
    foreach ($history as $h) {
        $messages[] = ['role' => ($h['role'] === 'user' ? 'user' : 'assistant'), 'content' => $h['text']];
    }
    $messages[] = ['role' => 'user', 'content' => $message];
    return $messages;
}

function callGroqAPI($apiKey, $messages) {
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
    if (!$response) return ['status' => 'error', 'message' => 'Failed to reach Groq API.'];
    $data = json_decode($response, true);
    if ($httpCode !== 200 || !isset($data['choices'][0]['message']['content'])) {
        return ['status' => 'error', 'message' => $data['error']['message'] ?? 'Groq API error.'];
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
    return ['status' => 'success', 'reply' => $replyText, 'suggested_booking' => $suggestedBooking, 'doctor_title' => $doctorTitle, 'doctor_spec' => $doctorSpec];
}
