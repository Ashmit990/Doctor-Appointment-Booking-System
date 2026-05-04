<?php
/**
 * Khalti Configuration Test Endpoint
 * Diagnose Khalti integration issues
 */

header('Content-Type: application/json; charset=utf-8');

// Test env loading
require_once __DIR__ . '/payment_helpers.php';

$config = khalti_payment_config();

$response = [
    'status' => 'ok',
    'config' => [
        'api_base' => $config['api_base'] ?? null,
        'website_url' => $config['website_url'] ?? null,
        'return_url' => $config['return_url'] ?? null,
        'secret_key_loaded' => !empty($config['secret_key']),
        'secret_key_first_chars' => substr($config['secret_key'] ?? '', 0, 10) . '...',
    ],
    'env_vars' => [
        'KHALTI_SECRET_KEY' => getenv('KHALTI_SECRET_KEY') ? 'SET' : 'NOT SET',
        'KHALTI_API_BASE' => getenv('KHALTI_API_BASE') ?: 'NOT SET',
        'KHALTI_WEBSITE_URL' => getenv('KHALTI_WEBSITE_URL') ?: 'NOT SET',
    ],
];

// Test API connectivity
if (!empty($config['secret_key']) && strpos($config['secret_key'], 'test_secret_key') === 0) {
    $response['warning'] = 'WARNING: Using placeholder/test secret key. Generate a real key at https://test-admin.khalti.com/';
}

echo json_encode($response, JSON_PRETTY_PRINT);
