# Tutorial de Bloom — Cómo funciona cada parte de la app

Este tutorial explica, parte por parte, cómo está armada Bloom hoy y cómo interactúan
esas partes entre sí. Si sos nuevo en el proyecto, léelo en orden: cada sección se apoya
en la anterior.

## 0. Panorama general

Bloom es hoy una app muy chica con tres capas:

```
Navegador (index.html)  --HTTP-->  Servidor Express (server.js)  --SQL-->  PostgreSQL (Railway)
                                              │
                                          db.js (pool de conexión)
```

- **Frontend**: `index.html` — una landing estática (HTML + CSS, sin JS todavía).
- **Backend**: `server.js` — un servidor Express que sirve el HTML y expone una API.
- **Base de datos**: `db.js` + PostgreSQL — conexión a una base de datos alojada en Railway,
  con tablas `usuarios`, `habitos` y `registros`.
- **Scripts de datos**: `scripts/schema.sql`, `scripts/migrate.js` y `scripts/seed.js` —
  crean las tablas y cargan datos de prueba.
- **Configuración**: `package.json` (dependencias) y `.env` (credenciales).

Ya hay una app funcional de punta a punta: se puede crear una cuenta desde la landing,
entrar a un panel con pestañas (**Hoy**, **Estadísticas**, **Ajustes**), agregar hábitos,
marcarlos como hechos y ver racha/progreso — todo respaldado por la API y la base de
datos reales (sección 2 y 3). Sigue sin haber autenticación con contraseña (la "sesión"
es solo el email como identificador).

---

## 1. Frontend — `index.html`

Es una única página HTML (sin framework, JavaScript "vanilla" en un `<script>` al final)
con CSS embebido en el `<style>` del `<head>`. Toda la app vive en este archivo — no hay
build step ni bundler.

### 1.1 Las dos secciones principales

`index.html` tiene dos `<section>` que se muestran/ocultan con el atributo `hidden`
(nunca las dos al mismo tiempo):

- **`#seccionInicio`** — la landing: logo 🌸, texto de propuesta de valor, botón
  "Comenzar ✨" y el formulario de registro/login.
- **`#seccionDashboard`** — el panel, visible después de crear cuenta o volver con una
  sesión guardada. Tiene tres "vistas" internas controladas por una barra de pestañas
  fija abajo (`.tab-bar`):
  - `#vistaHoy`: fecha de hoy, mensaje de celebración, barra de progreso diario, lista
    de hábitos, formulario para agregar un hábito.
  - `#vistaEstadisticas`: hábitos activos, racha más larga, % de cumplimiento de los
    últimos 7 días.
  - `#vistaAjustes`: "Cerrar sesión" (el selector de tema vive fuera del panel, ver 1.5).

  La función `mostrarVista(nombre)` oculta todas las `.vista` y muestra solo la elegida,
  además de marcar el botón de pestaña activo con la clase `.activo`.

### 1.2 Registro / "login" (sin contraseña)

Al tocar "Comenzar", aparece un formulario (nombre + email). Al enviarlo:
1. Se hace `POST /api/usuarios` (sección 2.1) con esos datos.
2. Si el usuario se crea (201), se entra directo al panel.
3. Si el email ya existía (409), el frontend hace `GET /api/usuarios`, busca el usuario
   con ese email y "inicia sesión" con él — no hay contraseña, el email alcanza como
   identificador. Esto es intencionalmente simple para esta etapa del proyecto.

El usuario actual se guarda en `localStorage` (clave `bloom-usuario`), así que si volvés
a abrir la app en el mismo navegador, `mostrarDashboard()` se llama automáticamente al
cargar la página sin pedir el formulario de nuevo (ver el final del `<script>`).

### 1.3 Panel de hábitos (`#vistaHoy`)

`cargarHabitos()` trae los hábitos del usuario (`GET /api/habitos?usuario_id=...`) y, para
cada uno, sus registros (`GET /api/registros?habito_id=...`), y arma cada fila con:
- **Estado de hoy**: ✅/⭕ según si hay un registro de hoy con `completado: true`.
- **Racha** (`calcularRacha`): cuenta días consecutivos completados hacia atrás desde hoy
  (o desde ayer, si todavía no marcaste hoy, para no "romper" la racha visualmente antes
  de que termine el día).
- **Semana** (`generarSemana`): 7 puntos (`●`/`○`) representando los últimos 7 días.
- Botón **"Marcar hecho"** → `POST /api/registros`; si pasa de no-hecho a hecho, dispara
  `mostrarCelebracion()` (una cita bíblica aleatoria, tomada de `FRASES_CELEBRACION`, que
  aparece y se desvanece sola).
- Botón **🗑️ eliminar** → `DELETE /api/habitos/:id`, con `confirm()` antes de borrar.

Al final del loop, `actualizarProgreso()` calcula "X de Y hábitos completados hoy" y
actualiza el ancho de una barra de progreso.

### 1.4 Estadísticas (`#vistaEstadisticas`)

No pide datos nuevos al servidor: reutiliza los mismos hábitos/registros que ya trajo
`cargarHabitos()` (guardados en `datosHabitos`) para calcular, en el cliente:
- Cantidad de hábitos activos.
- La racha más alta entre todos los hábitos (`Math.max` sobre `calcularRacha`).
- % de cumplimiento de los últimos 7 días (`calcularCumplimientoSemana`): registros
  completados / (hábitos × 7 días).

### 1.5 Modo claro/oscuro

Un único botón flotante 🌙/☀️ (arriba a la derecha, `#themeToggle`), visible siempre —
tanto en la landing como dentro del panel. El tema se maneja con variables CSS (`:root`
para claro, `[data-theme="dark"]` para oscuro, ambas con los mismos tonos rosa/coral,
solo más oscuros) y se recuerda en `localStorage` (clave `bloom-theme`).

### 1.6 Estilo y diseño

- La paleta rosa/coral (`#FFD1DC`/`#F5B7B1` en modo claro, versiones oscurecidas de los
  mismos tonos en modo oscuro — nunca otra familia de color) es una decisión de branding
  deliberada (ver `PROPUESTA_BLOOM.md`, sección 4): transmite calma en vez de
  "vigilancia", coherente con el enfoque no punitivo del producto.
- Tipografía: **Playfair Display** (serif, elegante) para el título "Bloom" y los
  encabezados (`h1`, `h2`); **Quicksand** (redondeada, suave) para el resto del texto.
  Ambas se cargan gratis desde Google Fonts (`<link>` en el `<head>`), sin instalar nada.
- El botón `.btn` tiene una animación de pulso continua (`@keyframes pulse`) que se pausa
  al pasar el mouse.
- El favicon es un emoji 🌸 embebido como SVG en un `data:` URI (sin archivos externos).
- `express.static(__dirname)` (sección 2) es lo que hace que este archivo sea visible en
  el navegador — no hay un router de frontend, es un único HTML servido tal cual.

Cómo verlo: abrí el navegador en `http://localhost:3000` una vez que el servidor esté
corriendo (sección 5).

---

## 2. Backend — `server.js`

Es el punto de entrada del servidor (`"main": "server.js"` en `package.json`). Usa
**Express**, el framework de Node más común para levantar servidores HTTP con rutas.

```js
require('dotenv').config();       // carga variables desde .env
const express = require('express');
const path = require('path');
const pool = require('./db');     // conexión a PostgreSQL (sección 3)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));   // sirve index.html y cualquier archivo estático

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bloom corriendo en el puerto ${PORT}`);
});
```

Qué hace cada parte:
- `app.use(express.static(__dirname))`: convierte cualquier archivo de la carpeta del
  proyecto (como `index.html`) en accesible por URL directamente. Por eso no hace falta
  una ruta explícita para servir CSS/imágenes si se agregan más adelante.
- `GET /`: responde explícitamente con `index.html` al entrar a la raíz del sitio.
- `GET /api/health`: es un **endpoint de diagnóstico** ("health check"). No es una
  funcionalidad de producto — sirve para verificar que el servidor está vivo *y* que
  puede hablar con la base de datos. Hace `SELECT NOW()` (la hora actual del servidor de
  Postgres) y la devuelve en JSON. Si la base de datos falla, responde con status 500 y el
  mensaje de error.
- `app.listen(PORT, ...)`: arranca el servidor. `PORT` viene de la variable de entorno
  `PORT` (Railway la define automáticamente en producción) o cae a `3000` en local.

Probarlo: con el servidor corriendo, entrar a `http://localhost:3000/api/health` en el
navegador debería devolver algo como:
```json
{"status":"ok","dbTime":"2026-07-28T..."}
```

### Rutas de la API de datos

Además de `/api/health`, `server.js` expone rutas CRUD básicas sobre las tres tablas
(sección 3.1). Todas devuelven JSON. Para las rutas `POST` hace falta `express.json()`
(agregado con `app.use(express.json())`), que permite leer un body JSON en `req.body`.

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/usuarios` | GET | Lista todos los usuarios. |
| `/api/usuarios` | POST | Crea un usuario. Body: `{ "nombre": "...", "email": "..." }`. |
| `/api/habitos` | GET | Lista hábitos. Acepta `?usuario_id=` para filtrar por usuario. |
| `/api/habitos` | POST | Crea un hábito. Body: `{ "usuario_id": 1, "nombre": "...", "descripcion": "..." }`. |
| `/api/habitos/:id` | DELETE | Elimina un hábito (y, por `ON DELETE CASCADE`, sus registros). |
| `/api/registros` | GET | Lista registros. Acepta `?habito_id=` para filtrar por hábito. |
| `/api/registros` | POST | Crea/actualiza el registro de un día. Body: `{ "habito_id": 1, "fecha": "2026-07-28", "completado": true }`. |

Ejemplo rápido con `curl`:
```
curl http://localhost:3000/api/usuarios
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","email":"ana@ejemplo.com"}'
```

Todas las rutas siguen el mismo patrón: una consulta con `pool.query(...)` dentro de un
`try/catch`, devolviendo `500` con el mensaje de error si algo falla en la base de datos.
La excepción es `POST /api/usuarios`, que detecta el código de error `23505` (violación de
restricción `UNIQUE` de Postgres) y devuelve `409` con un mensaje claro ("Ya existe una
cuenta con ese email") en vez del error genérico — es lo que usa el frontend para decidir
si debe crear un usuario nuevo o "iniciar sesión" con el existente (sección 1.2).

No hay todavía validación avanzada (tipos, formato de email, etc.) ni autenticación —
cualquiera que conozca la URL puede leer o crear datos. Eso está bien para esta etapa de
prototipo, pero es algo a resolver antes de tener usuarios reales.

---

## 3. Base de datos — `db.js` + PostgreSQL

```js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
```

Qué hace:
- Usa `pg`, el driver oficial de PostgreSQL para Node.
- Crea un **pool de conexiones** en vez de abrir una conexión nueva por cada consulta.
  Un pool reutiliza conexiones abiertas, lo cual es más eficiente si el servidor recibe
  varias peticiones a la vez.
- `connectionString: process.env.DATABASE_URL`: la URL completa de conexión (usuario,
  contraseña, host, puerto, nombre de la base) se lee desde una variable de entorno, nunca
  hardcodeada en el código. Esto es clave para no subir credenciales al repositorio.
- `ssl: { rejectUnauthorized: false }`: habilita conexión cifrada (SSL), necesaria porque
  Railway expone la base de datos por internet, no en la misma red local.
- `module.exports = pool` expone ese pool para que otros archivos (hoy solo `server.js`)
  puedan hacer consultas con `pool.query(...)`.

### 3.1 Esquema de datos — `scripts/schema.sql`

Tres tablas, relacionadas entre sí:

```sql
usuarios (id, nombre, email único, creado_en)
habitos  (id, usuario_id → usuarios.id, nombre, descripcion, creado_en)
registros(id, habito_id → habitos.id, fecha, completado, creado_en)
```

- Un **usuario** puede tener varios **hábitos** (`usuario_id` en `habitos`).
- Un **hábito** puede tener varios **registros**, uno por día (`habito_id` + `fecha` es
  único en `registros` — no se puede duplicar el registro de un mismo día).
- `ON DELETE CASCADE` en las relaciones: si se borra un usuario, se borran sus hábitos y
  registros automáticamente (evita datos huérfanos).
- El archivo usa `ADD COLUMN IF NOT EXISTS` además de `CREATE TABLE IF NOT EXISTS` a
  propósito: es "autocorrectivo" — si la tabla ya existe pero le falta alguna columna
  (pasó una vez con `usuarios`, que existía casi vacía en la base de Railway), el script
  la completa en vez de fallar.

### 3.2 Scripts — `scripts/migrate.js` y `scripts/seed.js`

- `npm run migrate` (`scripts/migrate.js`): lee `scripts/schema.sql` y lo ejecuta contra
  la base de datos. Es seguro correrlo varias veces (idempotente).
- `npm run seed` (`scripts/seed.js`): inserta datos de prueba — 3 usuarios ficticios
  (`demo1@bloom.test`, `demo2@bloom.test`, `demo3@bloom.test`, con dominio `.test`
  reservado para pruebas y que nunca es un correo real), con hábitos y 5 días de
  registros cada uno. Sirve para tener datos con los que probar la API sin necesidad de
  crear usuarios reales a mano.

---

## 4. Configuración — `package.json` y `.env`

### `package.json`
```json
{
  "name": "bloom-app",
  "version": "0.1.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.12.0",
    "dotenv": "^16.4.5"
  }
}
```
- `"start"` ejecuta el servidor; `"migrate"` aplica el esquema de base de datos
  (sección 3.1); `"seed"` carga los datos de prueba (sección 3.2).
- Las tres dependencias son exactamente las que se usan en `server.js`/`db.js`:
  **Express** (servidor HTTP), **pg** (cliente de PostgreSQL) y **dotenv** (variables de
  entorno).

### `.env` (no se sube al repositorio — está en `.gitignore`)
Contiene las variables de entorno reales, típicamente:
```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/basededatos
PORT=3000
```
`dotenv` lee este archivo al arrancar (`require('dotenv').config()`) y carga esos valores
en `process.env`. En producción (Railway), estas variables se configuran directamente en
el panel de la plataforma, no mediante un archivo `.env`.

---

## 5. Cómo correr la app en local

1. Instalar las dependencias (una sola vez, o cada vez que cambie `package.json`):
   ```
   npm install
   ```
2. Crear un archivo `.env` en la raíz del proyecto con al menos:
   ```
   DATABASE_URL=<tu cadena de conexión a Postgres>
   ```
3. Crear las tablas (una sola vez, o cada vez que cambie `scripts/schema.sql`):
   ```
   npm run migrate
   ```
4. (Opcional) Cargar datos de prueba:
   ```
   npm run seed
   ```
5. Arrancar el servidor:
   ```
   npm start
   ```
6. Abrir `http://localhost:3000` en el navegador para ver la landing,
   `http://localhost:3000/api/health` para verificar la conexión a la base de datos, y
   `http://localhost:3000/api/usuarios` para ver los usuarios cargados.

Si no tenés acceso a una base de datos Postgres a mano, el servidor igual arranca y sirve
`index.html`; solo las rutas `/api/*` fallarán con error 500.

---

## 6. Despliegue — Railway

Según `PROPUESTA_BLOOM.md`, la app está desplegada en Railway (servicio
"empowering-serenity"), que aloja tanto el backend Express como la base de datos
PostgreSQL en la misma plataforma. Railway define automáticamente la variable `PORT` y
permite referenciar la URL de la base de datos entre servicios
(`${{Postgres.DATABASE_URL}}`), evitando configurar infraestructura desde cero.

**URL pública: https://bloom-wellness.up.railway.app/** — el dominio se renombró (gratis,
con `railway domain update`) desde el generado automáticamente por Railway
(`empowering-serenity-production.up.railway.app`) a uno más prolijo y sin datos
personales.

---

## 7. Qué falta (próximos pasos técnicos)

Siguiendo la hoja de ruta del proyecto:
- Autenticación real de usuarios (hoy "iniciar sesión" es solo escribir el mismo email,
  sin contraseña).
- Validación de datos de entrada en las rutas `POST` (hoy solo valida que los campos
  obligatorios no estén vacíos).
- Editar un hábito ya creado (hoy solo se puede crear o eliminar, no renombrar).
- Persistir la sesión en el servidor (hoy vive solo en `localStorage` del navegador; si
  entrás desde otro dispositivo con el mismo email, funciona porque "iniciar sesión" es
  buscar por email, pero no hay un token de sesión real).
- Eventualmente migrar el frontend a un framework de UI (ej. React) si la cantidad de
  vistas sigue creciendo, manteniendo Express como backend/API.

Para el contexto de producto (por qué existe Bloom, público objetivo, modelo de negocio),
ver `PROPUESTA_BLOOM.md`. Para una evaluación crítica del estado del proyecto, ver
`DOCUMENTACION.md`.
