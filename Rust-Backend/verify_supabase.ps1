# Script para verificar la conexión a Supabase (Windows PowerShell)

Write-Host "🔍 Verificando configuración de Supabase..." -ForegroundColor Cyan

# Verificar que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

# Leer DATABASE_URL
$env_content = Get-Content ".env" -Raw
$database_url_line = $env_content | Select-String "DATABASE_URL=" | Select-Object -First 1

if ($database_url_line) {
    $db_url = $database_url_line.ToString().Split("=", 2)[1].Trim('"')
    Write-Host "✅ DATABASE_URL configurada" -ForegroundColor Green
    
    # Verificar que tiene sslmode=require
    if ($db_url -like "*sslmode=require*") {
        Write-Host "✅ SSL Mode: REQUIRE (correcto)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: SSL Mode no está configurado" -ForegroundColor Yellow
        Write-Host "    Debe tener: ?sslmode=require" -ForegroundColor Yellow
    }
    
    # Verificar que tiene contraseña
    if ($db_url -like "*[YOUR-PASSWORD]*") {
        Write-Host "❌ Error: [YOUR-PASSWORD] no fue reemplazada" -ForegroundColor Red
        Write-Host "    Por favor, reemplaza tu contraseña real en .env" -ForegroundColor Red
        exit 1
    }
    
    if ($db_url -like "*:*@*") {
        Write-Host "✅ Contraseña configurada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: No se encontró contraseña" -ForegroundColor Yellow
    }
    
    # Verificar host de Supabase
    if ($db_url -like "*supabase.co*") {
        Write-Host "✅ Host Supabase correcto" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: Host no es de Supabase" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Error: DATABASE_URL no encontrada en .env" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔨 Compilando dependencias..." -ForegroundColor Cyan
cargo check --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias compiladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al compilar" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Verificación completada. Puedes ejecutar:" -ForegroundColor Green
Write-Host "   cargo run" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si ves 'Conectado a Supabase PostgreSQL', ¡todo está configurado!" -ForegroundColor Green
