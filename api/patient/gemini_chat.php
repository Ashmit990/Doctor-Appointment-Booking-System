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
$apiKey = $env['GEMINI_API_KEY'] ?? '';

if (empty($apiKey) || $apiKey === 'your_gemini_api_key_here') {
    echo json_encode(['status' => 'error', 'message' => 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$message = trim($body['message'] ?? '');
$history = $body['history'] ?? [];

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
$conn->close();

$systemPrompt = "You are a friendly and knowledgeable medical assistant for a doctor appointment booking platform called Healthcare. Your role is to:\n- Help users understand their symptoms\n- Suggest appropriate doctor specializations\n- Recommend specific doctors from our platform when relevant\n- Answer general health-related questions\n\nGuidelines:\n- Be conversational, empathetic, and easy to understand\n- Keep responses concise (2-4 sentences unless more detail is genuinely needed)\n- Always remind users that your suggestions are not a substitute for professional medical advice\n- When suggesting doctors, mention their name and specialization{$doctorContext}";

$contents = buildGeminiContents($systemPrompt, $history, $message);

$reply = callGeminiAPI($apiKey, $contents);
echo json_encode($reply);

function buildGeminiContents($systemPrompt, $history, $message) {
    $contents = [
        ['role' => 'user', 'parts' => [['text' => $systemPrompt . "\n\nAcknowledge briefly."]]],
        ['role' => 'model', 'parts' => [['text' => "Hello! I'm your Healthcare AI assistant. I can help you understand symptoms, suggest the right specialists, and answer health questions. How can I help you today?"]]]
    ];
    foreach ($history as $h) {
        $contents[] = ['role' => ($h['role'] === 'user' ? 'user' : 'model'), 'parts' => [['text' => $h['text']]]];
    }
    $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];
    return $contents;
}

function callGeminiAPI($apiKey, $contents) {
    $payload = [
        'contents' => $contents,
        'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 512]
    ];
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={$apiKey}";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!$response) return ['status' => 'error', 'message' => 'Failed to reach Gemini API.'];
    $data = json_decode($response, true);
    if ($httpCode !== 200 || !isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        return ['status' => 'error', 'message' => $data['error']['message'] ?? 'Gemini API error.'];
    }
    return ['status' => 'success', 'reply' => $data['candidates'][0]['content']['parts'][0]['text']];
}
