<?php
$host = "localhost";
$user = "u419252749_admin";
$password = "6x3>IS^4xB*";
$database = "u419252749_alumnos";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

echo "✅ Conexión exitosa a la base de datos";
$conn->close();
?>