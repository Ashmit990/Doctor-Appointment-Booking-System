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

$systemPrompt = "You are a friendly and knowledgeable medical assistant for a doctor appointment booking platform called Healthcare. Your role is to:\n- Help visitors understand their symptoms\n- Suggest appropriate doctor specializations they should consult\n- Answer general health-related questions\n- Encourage users to sign up and book an appointment on our platform\n\nGuidelines:\n- Be conversational, empathetic, and easy to understand\n- Keep responses concise (2-4 sentences unless more detail is genuinely needed)\n- Always remind users that your suggestions are not a substitute for professional medical advice\n- Do not make specific diagnoses";

$contents = [
    ['role' => 'user', 'parts' => [['text' => $systemPrompt . "\n\nAcknowledge briefly."]]],
    ['role' => 'model', 'parts' => [['text' => "Hello! I'm the Healthcare AI assistant. I can help you understand your symptoms and suggest the right type of doctor to see. How can I help you today?"]]]
];
foreach ($history as $h) {
    $contents[] = ['role' => ($h['role'] === 'user' ? 'user' : 'model'), 'parts' => [['text' => $h['text']]]];
}
$contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

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

if (!$response) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to reach Gemini API.']);
    exit;
}

$data = json_decode($response, true);
if ($httpCode !== 200 || !isset($data['candidates'][0]['content']['parts'][0]['text'])) {
    echo json_encode(['status' => 'error', 'message' => $data['error']['message'] ?? 'Gemini API error.']);
    exit;
}

echo json_encode(['status' => 'success', 'reply' => $data['candidates'][0]['content']['parts'][0]['text']]);
