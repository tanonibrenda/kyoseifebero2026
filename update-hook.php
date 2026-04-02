<?php
// Mostrar errores para debug (opcional en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Registrar la hora en que se recibió el webhook
file_put_contents('last-update.txt', date("Y-m-d H:i:s") . " - Webhook recibido\n", FILE_APPEND);

// Responder al webhook (GitHub espera algún tipo de respuesta)
http_response_code(200);
echo "¡Webhook recibido correctamente!";
?>