<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = $_GET['url'] ?? '';
if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'URL inválida']);
    exit;
}

$response = file_get_contents($url);
echo $response;
