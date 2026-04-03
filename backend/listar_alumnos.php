<?php
// Habilitar CORS si es necesario
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// --- DETECCIÓN AUTOMÁTICA DE ENTORNO ---
$es_local = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

if ($es_local) {
    // Entorno de Desarrollo (Localhost)
    error_reporting(E_ALL);
    ini_set('display_errors', 1); // Mostramos errores para facilitar el debug
    
    $host = "localhost";
    $user = "root";
    $password = ""; // Por defecto XAMPP no tiene contraseña
    $database = "kyosei_local";
} else {
    // Entorno de Producción (Hostinger)
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Ocultamos errores para no romper el JSON ni exponer rutas
    ini_set('log_errors', 1);     // Los errores se guardan en el log del hosting
    
    $host = "localhost";
    $user = "u419252749_admin";
    $password = "6x3>IS^4xB*";
    $database = "u419252749_alumnos";
}

try {
    // Conectar a la base de datos usando las credenciales dinámicas
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión a la base de datos.");
    }
    
    $conn->set_charset("utf8mb4"); // utf8mb4 previene problemas con caracteres especiales y emojis

    // --- PAGINACIÓN ---
    // Recibimos parámetros por GET (ej: listar_alumnos.php?limit=20&offset=0)
    // Si no se envían, por defecto traemos los últimos 50.
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 50;
    $offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;
    
    // 1. Obtener el total real de alumnos para que el frontend pueda armar la paginación
    $sqlTotal = "SELECT COUNT(id_alumno) as total_registros FROM alumnos";
    $resultTotal = $conn->query($sqlTotal);
    $totalRegistros = $resultTotal->fetch_assoc()['total_registros'];

    // 2. Consulta principal con LIMIT y OFFSET usando Prepared Statements (Seguridad contra inyección SQL)
    $sql = "SELECT 
                id_alumno, 
                nombre, 
                apellido, 
                edad, 
                pais, 
                email, 
                whatsapp, 
                curso, 
                metodo_pa, 
                DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') as fecha_formateada
            FROM alumnos 
            ORDER BY fecha DESC 
            LIMIT ? OFFSET ?";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta.");
    }

    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $alumnos = [];
    while ($row = $result->fetch_assoc()) {
        // Formatear método de pago para que sea amigable en la lectura
        $metodoPagoTexto = '';
        switch($row['metodo_pa']) {
            case 'paypal':
                $metodoPagoTexto = 'PayPal';
                break;
            case 'mercado':
                $metodoPagoTexto = 'Mercado Pago';
                break;
            default:
                $metodoPagoTexto = $row['metodo_pa'] ?? 'No especificado';
        }
        
        $alumnos[] = [
            'id_alumno' => $row['id_alumno'],
            'nombre' => $row['nombre'],
            'apellido' => $row['apellido'],
            'edad' => $row['edad'],
            'pais' => $row['pais'],
            'email' => $row['email'],
            'whatsapp' => $row['whatsapp'],
            'curso' => $row['curso'],
            'metodo_pa' => $metodoPagoTexto,
            'fecha' => $row['fecha_formateada']
        ];
    }
    
    $stmt->close();
    
    // Respuesta exitosa y completa
    echo json_encode([
        "success" => true,
        "data" => $alumnos,
        "paginacion" => [
            "total_registros" => (int)$totalRegistros,
            "mostrando" => count($alumnos),
            "limite" => $limit,
            "offset" => $offset
        ],
        "mensaje" => "Datos obtenidos correctamente"
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $es_local ? $e->getMessage() : "Ocurrió un error interno en el servidor.", // Protegemos detalles en producción
        "data" => []
    ], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>