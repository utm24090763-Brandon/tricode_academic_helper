<?php

$conexion = new mysqli("localhost", "root", "", "tricode_bdd");

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $nombre = $_POST['nombre_completo'];
    $matricula = $_POST['matricula'];
    $correo = $_POST['correo'];
    $password = $_POST['password'];
    $confirm = $_POST['confirm_password'];
    $rol = $_POST['rol'];

    if ($password !== $confirm) {
        header("Location: index.php?error=Las contraseñas no coinciden");
        exit();
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conexion->prepare("INSERT INTO usuarios (rol, nombre_completo, matricula, correo_institucional, contraseña) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $rol, $nombre, $matricula, $correo, $password_hash);

    if ($stmt->execute()) {

        // ENVIAR DATOS AL PANEL
        header("Location: ../panel/index.php?nombre=" . urlencode($nombre) . "&correo=" . urlencode($correo) . "&rol=" . urlencode($rol));
        exit();

    } else {
        header("Location: index.php?error=Error al registrar");
        exit();
    }

    $stmt->close();
}

$conexion->close();

?>