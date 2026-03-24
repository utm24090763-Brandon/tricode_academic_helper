#!/bin/bash
# Script para verificar la conexión a Supabase

echo "🔍 Verificando configuración de Supabase..."

# Verificar que .env existe
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Leer DATABASE_URL
if grep -q "DATABASE_URL=" .env; then
    DB_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2 | tr -d '"')
    echo "✅ DATABASE_URL configurada"
    
    # Verificar que tiene sslmode=require
    if [[ "$DB_URL" == *"sslmode=require"* ]]; then
        echo "✅ SSL Mode: REQUIRE (correcto)"
    else
        echo "⚠️  Advertencia: SSL Mode no está configurado"
        echo "    Debe tener: ?sslmode=require"
    fi
    
    # Verificar que tiene contraseña
    if [[ "$DB_URL" == *"[YOUR-PASSWORD]"* ]]; then
        echo "❌ Error: [YOUR-PASSWORD] no fue reemplazada"
        echo "    Por favor, reemplaza tu contraseña real en .env"
        exit 1
    fi
    
    if [[ "$DB_URL" == *":@"* ]]; then
        echo "✅ Contraseña configurada"
    else
        echo "⚠️  Advertencia: No se encontró contraseña"
    fi
    
    # Verificar host de Supabase
    if [[ "$DB_URL" == *"supabase.co"* ]]; then
        echo "✅ Host Supabase correcto"
    else
        echo "⚠️  Advertencia: Host no es de Supabase"
    fi
else
    echo "❌ Error: DATABASE_URL no encontrada en .env"
    exit 1
fi

echo ""
echo "🔨 Compilando dependencias..."
cargo check --quiet

if [ $? -eq 0 ]; then
    echo "✅ Dependencias compiladas correctamente"
else
    echo "❌ Error al compilar"
    exit 1
fi

echo ""
echo "✅ Verificación completada. Puedes ejecutar:"
echo "   cargo run"
echo ""
echo "Si ves 'Conectado a Supabase PostgreSQL', ¡todo está configurado!"
