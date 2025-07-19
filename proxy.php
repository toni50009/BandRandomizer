<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = $_GET['url'] ?? '';

// Debug: Log what we received
error_log("Proxy received URL: " . $url);

// Decode the URL if it's encoded
$decodedUrl = urldecode($url);

if (!$url) {
    http_response_code(400);
    echo json_encode(['erro' => 'URL não fornecida']);
    exit;
}

// More flexible URL validation
if (!preg_match('/^https?:\/\/.+/', $decodedUrl)) {
    http_response_code(400);
    echo json_encode([
        'erro' => 'URL inválida',
        'url_received' => $url,
        'decoded_url' => $decodedUrl,
        'debug_info' => 'URL validation failed'
    ]);
    exit;
}

// Use cURL instead of file_get_contents for better control
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $decodedUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'BandRandomizer/1.0 (https://bandrandomizer.zanondev.com)');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Accept-Language: en-US,en;q=0.9'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $error) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao acessar a URL: ' . $decodedUrl,
        'curl_error' => $error,
        'http_code' => $httpCode,
        'original_url' => $url
    ]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'erro' => 'HTTP Error: ' . $httpCode,
        'url' => $decodedUrl,
        'response' => $response,
        'original_url' => $url
    ]);
    exit;
}

echo $response;
