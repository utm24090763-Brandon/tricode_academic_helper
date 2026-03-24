<?php
session_start();

/* PROTEGER */
if(!isset($_SESSION['usuario'])){
    header("Location: ../login/index.php");
    exit();
}

/* DATOS */
$nombre = $_SESSION['usuario']['nombre'];
$correo = $_SESSION['usuario']['correo'];
$rol = $_SESSION['usuario']['rol'];
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TriCode Academic Help</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<!-- SIDEBAR -->
<aside class="sidebar">

    <div class="user-panel">
        <div class="avatar">👤</div>
        <div class="user-data">
            <h3><?php echo htmlspecialchars($nombre); ?></h3>
            <p><?php echo htmlspecialchars($correo); ?></p>
            <span class="rol"><?php echo strtoupper($rol); ?></span>
        </div>
    </div>

    <ul class="menu">
        <li>
            <a href="home/index.php">
                <span class="icon">📖</span>
                <span class="text">Clases</span>
            </a>
        </li>



        <li>
            <a href="../login/logout.php">
                <span class="icon">🚪</span>
                <span class="text">Cerrar sesión</span>
            </a>
        </li>
    </ul>

</aside>

<!-- MAIN -->
<main class="main">
    <div class="contenido">
        <h1>Bienvenido, <?php echo htmlspecialchars($nombre); ?> 👋</h1>
    </div>
</main>

</body>
</html>