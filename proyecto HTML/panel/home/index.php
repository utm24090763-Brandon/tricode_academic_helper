<?php
session_start();

/* PROTEGER */
if(!isset($_SESSION['usuario'])){
    header("Location: ../../login/index.php");
    exit();
}

/* DATOS */
$nombre = $_SESSION['usuario']['nombre'];
$correo = $_SESSION['usuario']['correo'];
$rol = $_SESSION['usuario']['rol'];

/* CONEXIÓN */
$conexion = new mysqli("localhost", "root", "", "tricode_bdd");

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

/* INSERTAR */
if(isset($_POST['guardar'])){
    $materia = $_POST['nombre_materia'];
    $profesor = $_POST['profesor'];

    $stmt = $conexion->prepare("INSERT INTO materias (nombre_materia, profesor) VALUES (?, ?)");
    $stmt->bind_param("ss", $materia, $profesor);
    $stmt->execute();

    header("Location: index.php");
    exit();
}

/* CONSULTAR */
$sql = "SELECT id, nombre_materia, profesor FROM materias";
$resultado = $conexion->query($sql);
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Home - TriCode</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<!-- SIDEBAR -->
<aside class="sidebar">

    <div class="logo">
        <span>🎓</span>
        <h2>TriCode</h2>
    </div>

    <div class="user-panel">
        <div class="avatar">👤</div>
        <div class="user-data">
            <h4><?php echo htmlspecialchars($nombre); ?></h4>
            <p><?php echo htmlspecialchars($correo); ?></p>
            <span><?php echo strtoupper($rol); ?></span>
        </div>
    </div>

    <nav class="menu">

        <p class="menu-title">GENERAL</p>

        <a href="../index.php" class="active">
            <span>⬅️</span>
            <span>volver</span>
        </a>

     

        <p class="menu-title">GESTIÓN</p>

        <a href="#" onclick="abrirModal()">
            <span>➕</span>
            <span>Agregar Materia</span>
        </a>

        <p class="menu-title">CUENTA</p>

        

        <a href="../../login/index.php" class="logout">
            <span>🚪</span>
            <span>Cerrar sesión</span>
        </a>

    </nav>

</aside>

<!-- MAIN -->
<main class="main">

<h2>Materias</h2>

<div class="materias">
<?php while($row = $resultado->fetch_assoc()): ?>
    <div class="card">
        <h3><?php echo htmlspecialchars($row['nombre_materia']); ?></h3>
        <p>Profesor: <?php echo htmlspecialchars($row['profesor']); ?></p>
        <a href="#" class="btn">Ver</a>
    </div>
<?php endwhile; ?>
</div>

</main>

<!-- BOTON + -->
<button class="btn-add" onclick="abrirModal()">+</button>

<!-- MODAL -->
<div class="modal" id="modal">
    <div class="modal-content">
        <h3>Agregar Materia</h3>

        <form method="POST">
            <input type="text" name="nombre_materia" placeholder="Materia" required>
            <input type="text" name="profesor" placeholder="Profesor" required>
            <button name="guardar">Guardar</button>
        </form>

        <button onclick="cerrarModal()">Cancelar</button>
    </div>
</div>

<!-- JS -->
<script>
function abrirModal(){
    document.getElementById("modal").style.display="flex";
}
function cerrarModal(){
    document.getElementById("modal").style.display="none";
}
window.onclick = function(e){
    let modal = document.getElementById("modal");
    if(e.target === modal){
        modal.style.display = "none";
    }
}
</script>
</body>
</html>