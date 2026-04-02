<?php
// Habilitar CORS si es necesario
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Activar reporte de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Función para enviar emails
function enviarEmails($datosAlumno) {
    $nombre = $datosAlumno['nombre'];
    $apellido = $datosAlumno['apellido'];
    $email = $datosAlumno['email'];
    $curso = $datosAlumno['curso'];
    $pago = $datosAlumno['pago'];
    $whatsapp = $datosAlumno['whatsapp'];
    $pais = $datosAlumno['pais'];
    $edad = $datosAlumno['edad'];
    
    // Email de confirmación para el alumno (MEJORADO)
    $asuntoAlumno = "Confirmación de inscripción - Kyosei Accesibilidad";
    $mensajeAlumno = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Confirmación de Inscripción</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #1E7EE4;'>¡Gracias por tu inscripción!</h2>
            <p>Hola <strong>$nombre $apellido</strong>,</p>
            <p>Hemos recibido tu inscripción exitosamente. Aquí están los detalles que registramos:</p>
            
            <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F1934E;'>
                <h3 style='margin-top: 0; color: #1E7EE4;'>Detalles de la inscripción:</h3>
                <p><strong>Curso:</strong> $curso</p>
                <p><strong>Método de pago:</strong> " . ($pago == 'paypal' ? 'PayPal' : 'Mercado Pago') . "</p>
                <p><strong>Edad:</strong> $edad años</p>
                <p><strong>País:</strong> $pais</p>
                <p><strong>Email:</strong> $email</p>
                <p><strong>WhatsApp:</strong> $whatsapp</p>
            </div>
            
            <p><strong>Próximos pasos:</strong></p>
            <ul>
                <li>Completar el pago a través del método seleccionado.</li>
                <li>Una vez confirmado el pago, recibirás el acceso al curso.</li>
                <li>Si tienes alguna duda o notas algún error en tus datos, contáctanos respondiendo a este email.</li>
            </ul>
            
            <p>¡Gracias por elegir Kyosei Accesibilidad!</p>
            
            <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;'>
                <p>Kyosei Accesibilidad<br>
                Email: info@kyoseiaccesibilidad.com<br>
                Web: https://kyoseiaccesibilidad.com</p>
            </div>
        </div>
    </body>
    </html>";
    
    // Email de notificación para el administrador
    $asuntoAdmin = "Nueva inscripción recibida - $nombre $apellido";
    $mensajeAdmin = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Nueva Inscripción</title>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #1E7EE4;'>Nueva inscripción recibida</h2>
            
            <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h3 style='margin-top: 0; color: #1E7EE4;'>Datos del alumno:</h3>
                <p><strong>Nombre completo:</strong> $nombre $apellido</p>
                <p><strong>Edad:</strong> $edad años</p>
                <p><strong>País:</strong> $pais</p>
                <p><strong>Email:</strong> $email</p>
                <p><strong>WhatsApp:</strong> $whatsapp</p>
                <p><strong>Curso:</strong> $curso</p>
                <p><strong>Método de pago:</strong> " . ($pago == 'paypal' ? 'PayPal' : 'Mercado Pago') . "</p>
                <p><strong>Fecha de inscripción:</strong> " . date('d/m/Y H:i:s') . "</p>
            </div>
            
            <p>El alumno debe completar el pago para finalizar el proceso.</p>
        </div>
    </body>
    </html>";
    
    // Headers para envío de email HTML
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: info@kyoseiaccesibilidad.com" . "\r\n";
    $headers .= "Reply-To: info@kyoseiaccesibilidad.com" . "\r\n";
    
    // Enviar emails
    $emailAlumnoEnviado = mail($email, $asuntoAlumno, $mensajeAlumno, $headers);
    $emailAdminEnviado = mail("info@kyoseiaccesibilidad.com", $asuntoAdmin, $mensajeAdmin, $headers);
    
    return [
        'alumno' => $emailAlumnoEnviado,
        'admin' => $emailAdminEnviado
    ];
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(["success" => false, "error" => "Método no permitido. Solo se acepta POST"]));
}

// Configuración de la base de datos
$host = "localhost";
$user = "u419252749_admin";
$password = "6x3>IS^4xB*";
$database = "u419252749_alumnos";

try {
    // Conectar a la base de datos
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión a la base de datos.");
    }
    
    $conn->set_charset("utf8");
    
    $campos_requeridos = ['nombre', 'apellido', 'edad', 'pais', 'email', 'whatsapp', 'curso', 'pago'];
    foreach ($campos_requeridos as $campo) {
        if (!isset($_POST[$campo]) || empty(trim($_POST[$campo]))) {
            throw new Exception("El campo '$campo' es requerido.");
        }
    }
    
    $nombre = trim($_POST["nombre"]);
    $apellido = trim($_POST["apellido"]);
    $edad = intval($_POST["edad"]);
    $pais = trim($_POST["pais"]);
    $email = trim($_POST["email"]);
    $whatsapp = trim($_POST["whatsapp"]);
    $curso = trim($_POST["curso"]);
    $pago = trim($_POST["pago"]);
    
    if (strlen($nombre) < 2 || strlen($nombre) > 50) throw new Exception("El nombre debe tener entre 2 y 50 caracteres.");
    if (strlen($apellido) < 2 || strlen($apellido) > 50) throw new Exception("El apellido debe tener entre 2 y 50 caracteres.");
    if ($edad < 16 || $edad > 120) throw new Exception("La edad debe estar entre 16 y 120 años.");
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception("El email no tiene un formato válido.");
    if (strlen($pais) < 2 || strlen($pais) > 50) throw new Exception("El país debe tener entre 2 y 50 caracteres.");
    if (strlen($whatsapp) < 10 || strlen($whatsapp) > 20) throw new Exception("El número de WhatsApp debe tener entre 10 y 20 caracteres.");
    
    // CORRECCIÓN CRÍTICA: Los cursos permitidos ahora coinciden con la oferta real
    $cursos_permitidos = [
        'Taller Moodle Accesible con IA', 
        'Crece en Instagram con Accesibilidad y SEO'
    ];
    if (!in_array($curso, $cursos_permitidos)) {
        throw new Exception("El curso seleccionado no es válido.");
    }
    
    $pagos_permitidos = ['paypal', 'mercado'];
    if (!in_array($pago, $pagos_permitidos)) {
        throw new Exception("Método de pago no válido.");
    }
    
    // Verificar duplicados
    $sqlCheck = "SELECT id_alumno FROM alumnos WHERE email = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $email);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    
    if ($resultCheck->num_rows > 0) {
        throw new Exception("Este email ya está registrado. Si necesitas ayuda, contacta a info@kyoseiaccesibilidad.com");
    }
    $stmtCheck->close();
    
    // Inserción
    $sql = "INSERT INTO alumnos (nombre, apellido, edad, pais, email, whatsapp, curso, metodo_pa, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) throw new Exception("Error interno del servidor al preparar la base de datos.");
    
    $stmt->bind_param("ssisssss", $nombre, $apellido, $edad, $pais, $email, $whatsapp, $curso, $pago);
    
    if ($stmt->execute()) {
        $id_alumno = $conn->insert_id;
        
        $datosAlumno = [
            'nombre' => $nombre, 'apellido' => $apellido, 'edad' => $edad,
            'pais' => $pais, 'email' => $email, 'whatsapp' => $whatsapp,
            'curso' => $curso, 'pago' => $pago
        ];
        
        $resultadosEmail = enviarEmails($datosAlumno);
        
        echo json_encode([
            "success" => true,
            "mensaje" => "Alumno registrado correctamente",
            "id_alumno" => $id_alumno
        ]);
    } else {
        throw new Exception("No se pudo registrar la inscripción. Intenta de nuevo más tarde.");
    }
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) $conn->close();
}
?>