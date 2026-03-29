<?php
// Evitar ejecución directa
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. Sanitización y validación de entradas
    $nombre = strip_tags(trim($_POST["nombre"]));
    $nombre = str_replace(array("\r","\n"),array(" "," "),$nombre);
    
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    
    $asunto = strip_tags(trim($_POST["asunto"]));
    
    $mensaje = trim($_POST["mensaje"]);
    $mensaje = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');

    // Comprobar que los campos requeridos no estén vacíos
    if (empty($nombre) || empty($mensaje) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Redirección con error
        header("Location: /pages/contacto.html?status=error");
        exit;
    }

    // 2. Configuración del correo
    $destinatario = "info@kyoseiaccesibilidad.com";
    $asunto_email = "Nuevo contacto Web: $asunto";
    
    // 3. Cuerpo del mensaje
    $contenido  = "Has recibido un nuevo mensaje desde el formulario web de Kyosei Accesibilidad.\n\n";
    $contenido .= "Detalles del contacto:\n";
    $contenido .= "------------------------\n";
    $contenido .= "Nombre: $nombre\n";
    $contenido .= "Email: $email\n";
    $contenido .= "Motivo: $asunto\n\n";
    $contenido .= "Mensaje:\n$mensaje\n";
    $contenido .= "------------------------\n";

    // 4. Cabeceras del correo (Headers)
    $headers = "From: webmaster@kyoseiaccesibilidad.com\r\n"; // Idealmente una cuenta autorizada de tu propio dominio
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // 5. Envío y redirección
    if (mail($destinatario, $asunto_email, $contenido, $headers)) {
        header("Location: /pages/contacto.html?status=success");
    } else {
        header("Location: /pages/contacto.html?status=error");
    }
    
    exit;
} else {
    // Si no es POST, redirigir al formulario
    header("Location: /pages/contacto.html");
    exit;
}
?>