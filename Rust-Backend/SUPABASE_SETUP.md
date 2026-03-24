% CONFIGURACIÓN DE SUPABASE PARA BACKEND RUST

# Guía: Conectar Backend Rust a Supabase PostgreSQL

## ✅ Pasos de Configuración

### Paso 1: Obtener la Contraseña para Root Database
```
1. Ve a https://supabase.com (y login)
2. Abre tu proyecto
3. Settings → Database → Connection String
4. Copia la contraseña (la que ingresaste al crear el proyecto)
5. O si no la recuerdas: Settings → Database → Reset Password
```

### Paso 2: Actualizar el Archivo `.env`

Abre el archivo `.env` y REEMPLAZA tu contraseña:

```env
# ANTES (incompleto):
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ugxnjuyssoiytmnwxscp.supabase.co:5432/postgres?sslmode=require

# DESPUÉS (ejemplo):
DATABASE_URL=postgresql://postgres:mySuperSecurePassword123!@db.ugxnjuyssoiytmnwxscp.supabase.co:5432/postgres?sslmode=require
```

**Ejemplo real de cómo debería verse:**
```
postgresql://postgres:Mi_Contraseña_Segura_12345@db.ugxnjuyssoiytmnwxscp.supabase.co:5432/postgres?sslmode=require
```

### Paso 3: Verificar la Cadena de Conexión

La URL tiene esta estructura:
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?[PARAMS]
```

**Tu URL de Supabase desglosada:**
| Parte | Tu valor |
|-------|----------|
| **Username** | `postgres` |
| **Password** | `[tu_contraseña_aqui]` |
| **Host** | `db.ugxnjuyssoiytmnwxscp.supabase.co` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **SSL** | `sslmode=require` ← ✅ IMPORTANTE |

### Paso 4: Compilar el Backend

```bash
# Con .env correctamente configurado:
cargo build --release

# O ejecutar directamente:
cargo run
```

### Paso 5: Verificar la Conexión

Deberías ver en los logs:
```
✓ Conectado a Supabase PostgreSQL
✓ Base de datos inicializada correctamente
```

## 🔧 Cambios Realizados

### 1. `.env` - URL de Supabase
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ugxnjuyssoiytmnwxscp.supabase.co:5432/postgres?sslmode=require
```

### 2. `src/db.rs` - Configuración Optimizada
```rust
// ✅ Max 5 conexiones (Supabase tiene límite)
.max_connections(5)

// ✅ Timeouts para conexión remota
.connect_timeout(Duration::from_secs(30))
.acquire_timeout(Duration::from_secs(30))
.idle_timeout(Duration::from_secs(600))
.max_lifetime(Duration::from_secs(1800))
```

## ⚠️ Notas Importantes

### 1. SSL Mode = REQUIRE
```
?sslmode=require
```
✅ **SIEMPRE debe ir en la URL de Supabase**
- Sin esto: Error de conexión SSL
- Supabase requiere conexiones encriptadas

### 2. Límite de Conexiones
- Supabase tiene **10 conexiones máximo** por default
- Por eso configuré `max_connections(5)`
- Si necesitas más: Settings → Database → Pool Size

### 3. Timeouts
- `connect_timeout(30s)` - Esperar a conectar
- `acquire_timeout(30s)` - Esperar a obtener conexión del pool
- `max_lifetime(30min)` - Reciclar conexiones antiguas

## 🧪 Prueba la Conexión

### Con curl (REST)
```bash
curl http://localhost:8080/health
# Deberías ver:
# {"status":"healthy","timestamp":"2024-03-23T10:30:00Z"}
```

### Con Rust CLI
```bash
# Ejecutar test de conexión
cargo test test_db_connection -- --nocapture
```

## 📋 Checklist Final

- [ ] Copié mi contraseña de Supabase
- [ ] Reemplacé `[YOUR-PASSWORD]` en el `.env`
- [ ] Verifiqué que `sslmode=require` está en la URL
- [ ] Ejecuté `cargo build` sin errores
- [ ] Vi los logs "✓ Conectado a Supabase PostgreSQL"
- [ ] Probé el endpoint `/health`

## 🚨 Troubleshooting

### Error: "SSL error: CERTIFICATE_VERIFY_FAILED"
```
Solución: Verifica que `sslmode=require` está en la URL
```

### Error: "Too many connections"
```
Solución: Reduce max_connections en src/db.rs
```

### Error: "Connection refused"
```
Solución: Verifica que la URL de host es correcta
Debe ser: db.ugxnjuyssoiytmnwxscp.supabase.co
```

### Error: "Invalid password"
```
Solución: Verifica tu contraseña de Supabase
Settings → Database → Reset Password (si olvidaste)
```

## 📝 Archivo de Configuración Actual

**`.env`:**
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ugxnjuyssoiytmnwxscp.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=86400
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
RUST_LOG=info
```

**`src/db.rs`:**
- ✅ Connection pooling: 5 max (optimizado para Supabase)
- ✅ Timeouts: 30s connect, 10min idle, 30min lifetime
- ✅ SSL obligatorio (ya está en la URL con `?sslmode=require`)

## 🎯 Proyecto Listo para Producción

Con esta configuración:
- ✅ Conexión segura a Supabase (SSL/TLS)
- ✅ Pool de conexiones optimizado
- ✅ Manejo de timeouts
- ✅ Logs informativos

¡A ejecutar! 🚀

```bash
cargo run
# Server listening on 127.0.0.1:8000
```
