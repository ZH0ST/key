<?php
// update-keys.php - For server-side key storage
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['userId'] ?? '';
$key = $data['key'] ?? '';

if ($userId && $key) {
    $keys = json_decode(file_get_contents('keys.json'), true);
    $keys['keys'][$userId] = [
        'key' => $key,
        'time' => time(),
        'expires' => time() + 600 // 10 minutes
    ];
    $keys['last_updated'] = time();
    file_put_contents('keys.json', json_encode($keys));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Invalid data']);
}
?>
