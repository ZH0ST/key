<?php
// get-key.php - Get key for user
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$userId = $_GET['userId'] ?? '';

if ($userId) {
    $keys = json_decode(file_get_contents('keys.json'), true);
    $userKey = $keys['keys'][$userId] ?? null;
    
    if ($userKey && $userKey['expires'] > time()) {
        echo json_encode(['key' => $userKey['key'], 'valid' => true]);
    } else {
        echo json_encode(['valid' => false]);
    }
} else {
    echo json_encode(['error' => 'No user ID']);
}
?>
