<?php
$request = $_SERVER['REQUEST_URI'];
// Remove query string if present
$request = strtok($request, '?');

switch ($request) {
    case '/':
        echo "helloworld";
        break;
    case '/test':
        header('Content-Type: text/html');
        echo "<!DOCTYPE html><html><body><h1>this php server is working</h1></body></html>";
        break;
    default:
        http_response_code(404);
        echo "Not Found";
        break;
}
?>
