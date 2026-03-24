<?php
session_start();
include("conexion.php");

$matricula = trim($_POST['matricula']);
$contrasena = $_POST['contrasena'];

$sql = "SELECT * FROM usuarios WHERE matricula = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $matricula);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {

    $user = $result->fetch_assoc();

    if (password_verify($contrasena, $user['contraseña'])) {

        // ✅ GUARDAR TODO EN SESIÓN
        $_SESSION['usuario'] = [
            'nombre' => $user['nombre_completo'],
            'correo' => $user['correo_institucional'],
            'rol' => $user['rol']
        ];

        // 🔥 REDIRECCIÓN LIMPIA (SIN GET)
        header("Location: ../panel/index.php");
        exit();

    } else {
        header("Location: index.php?msg=Contraseña incorrecta");
        exit();
    }

} else {
    header("Location: index.php?msg=Cuenta no encontrada");
    exit();
}
?>