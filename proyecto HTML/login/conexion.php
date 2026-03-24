<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "tricode_bdd";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}
?>