<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registro - UTMA</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<div class="container">
  <div class="card">

    <div class="header">
      <img class="logo" src="./img/logo.webp">
      <div class="textos">
        <h1 class="titulo">Registro TriCode Academic Help</h1>
        <span class="subtitulo">Crea tu cuenta estudiantil</span>
      </div>
    </div>

    <div class="content">

      <form action="registro.php" method="POST">

        <input type="text" name="nombre_completo" placeholder="Nombre completo" required>
        <input type="text" name="matricula" placeholder="Matrícula" required>
        <input type="email" name="correo" placeholder="Correo institucional" required>
        <input type="password" name="password" placeholder="Contraseña" required>
        <input type="password" name="confirm_password" placeholder="Confirmar contraseña" required>

        <!-- MENSAJE -->
        <div class="mensaje">
          <?php if(isset($_GET['error'])) echo $_GET['error']; ?>
          <?php if(isset($_GET['ok'])) echo "Registro exitoso"; ?>
        </div>

        <!-- ROLES -->
        <div class="rol-container">
          <div class="rol-header" onclick="toggleRol()">
            <span>Seleccionar rol</span>
            <span>▼</span>
          </div>

          <div class="rol-opciones" id="rolOpciones">
            <label><input type="radio" name="rol" value="usuario" checked> Usuario</label>
            <label><input type="radio" name="rol" value="admin"> Admin</label>
            <label><input type="radio" name="rol" value="dueno"> Dueño</label>
          </div>
        </div>

        <button type="submit">Registrarse</button>

      </form>

      <p class="link">
        ¿Ya tienes cuenta? 
        <a href="../login/index.php">Inicia sesión</a>
      </p>

    </div>

    <div class="footer">© 2026 UTMA • Registro seguro</div>

  </div>
</div>

<script>
function toggleRol(){
  document.getElementById("rolOpciones").classList.toggle("active");
}
</script>

</body>
</html>