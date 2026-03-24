<?php
session_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inicio - UTMA</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<div class="container">
  <div class="card">

    <!-- HEADER -->
    <div class="header">
      <img class="logo" src="./img/logo.webp" alt="Logo UTMA">

      <div class="textos">
        <h1 class="titulo">TriCode Academic Help</h1>
        <span class="subtitulo">Accede y comparte conocimiento</span>
      </div>
    </div>

    <!-- FORM -->
    <form action="login.php" method="POST" class="formulario">

      <input type="text" name="matricula" placeholder="Matrícula" required>

      <input type="password" name="contrasena" placeholder="Contraseña" required>

      <!-- MENSAJE -->
      <?php if(isset($_GET['msg'])): ?>
        <p class="mensaje">
          <?php echo htmlspecialchars($_GET['msg']); ?>
        </p>
      <?php endif; ?>

      <button type="submit">Iniciar Sesión</button>

    </form>

    <!-- LINK -->
    <p class="link">
      ¿No tienes cuenta? 
      <a href="../register/index.php">Regístrate aquí</a>
    </p>

    <!-- FOOTER -->
    <div class="footer">© 2026 UTMA • Acceso seguro</div>

  </div>
</div>

</body>
</html>