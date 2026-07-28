# Documentación de Bloom

## 1. Resumen

**Bloom** es una app de productividad y bienestar digital cuya propuesta es ayudar a las personas a entender cómo usan su tiempo y a construir hábitos más conscientes. El proyecto está en etapa temprana: hoy existe una landing page estática de presentación más un backend Express con conexión funcional a PostgreSQL, pero todavía sin funcionalidad de producto (hábitos, usuarios, tracking) implementada.

## 2. Estado actual del proyecto

### Archivos existentes

```
bloom-app/
├── index.html          # Landing page de bienvenida (frontend estático)
├── server.js            # Servidor Express: sirve el frontend y expone la API
├── db.js                 # Pool de conexión a PostgreSQL (driver pg)
├── package.json           # Dependencias (express, pg, dotenv) y script "start"
├── .env                    # Variables de entorno (DATABASE_URL, PORT) — no versionado
├── README.md               # Descripción de una línea del proyecto
├── PROPUESTA_BLOOM.md       # Propuesta de producto, arquitectura y modelo de negocio
├── DOCUMENTACION.md          # Este documento
└── TUTORIAL.md                # Tutorial paso a paso de cada parte de la app
```

Ya hay backend (Node.js/Express), base de datos (PostgreSQL en Railway) y gestor de paquetes (npm) funcionando. Lo que **no** hay todavía es lógica de producto: no existen tablas de dominio (usuarios, hábitos, registros de tiempo) ni rutas de API más allá de un health check.

### Qué hace `index.html` hoy

- Página centrada en pantalla completa con fondo rosa (`#FFD1DC`).
- Tarjeta blanca con esquinas redondeadas que contiene:
  - Un emoji de flor 🌸 a modo de logo temporal.
  - Título "Bloom".
  - Texto de propuesta de valor: *"Tu compañera de bienestar digital. Descubre cómo usas tu tiempo y cultiva hábitos más conscientes."*
  - Botón "Comenzar" (actualmente decorativo, sin acción asociada — no tiene `onclick` ni enlace).
- Estilo: fuente Segoe UI, paleta rosa/coral (`#FFD1DC`, `#F5B7B1`), sombra suave, botón con efecto hover (`scale(1.05)`).
- Es servido por Express vía `express.static` y la ruta `GET /` en `server.js` (sin JavaScript propio todavía).

### Qué hace el backend hoy

- `server.js` levanta un servidor Express en el puerto definido por `process.env.PORT` (o `3000` en local).
- `GET /`: sirve `index.html`.
- `GET /api/health`: hace `SELECT NOW()` contra PostgreSQL y devuelve `{ status, dbTime }` — es un chequeo de diagnóstico, no una funcionalidad de producto.
- `db.js` mantiene un pool de conexiones a PostgreSQL (vía `pg`), usando `DATABASE_URL` desde `.env`, con SSL habilitado (necesario para conectarse a la base alojada en Railway).
- Desplegado en Railway (servicio "empowering-serenity"), que aloja backend y base de datos en la misma plataforma.

Ver `TUTORIAL.md` para una explicación línea por línea de `server.js` y `db.js`.

### Qué falta para que sea una "app" con funcionalidad real

- **Interactividad de frontend**: el botón "Comenzar" no lleva a ningún lado ni ejecuta JS.
- **Funcionalidad central**: no hay ningún mecanismo real de seguimiento de tiempo o hábitos (ni manual ni automático), ni tablas de datos que los representen.
- **Modelo de datos**: la base de datos está conectada pero vacía de esquema (sin tablas de usuarios, hábitos ni registros).
- **Autenticación**: no hay registro/login de usuarios.
- **Navegación/rutas de frontend**: es una sola pantalla; no hay flujo de usuario más allá de la portada.
- **Responsive/accesibilidad**: no se han verificado tamaños de pantalla pequeños ni contraste/atributos de accesibilidad (el botón no tiene `aria-label`, el emoji no tiene texto alternativo semántico, etc.).

### Cómo ejecutarlo

1. `npm install` para instalar las dependencias (express, pg, dotenv).
2. Crear un archivo `.env` con `DATABASE_URL` apuntando a una base PostgreSQL (y opcionalmente `PORT`).
3. `npm start` (equivalente a `node server.js`) para levantar el servidor.
4. Abrir `http://localhost:3000` para el frontend y `http://localhost:3000/api/health` para verificar la conexión a la base de datos.

Ver `TUTORIAL.md` para el detalle paso a paso.

### Repositorio y despliegue

- **Control de versiones**: el código vive en GitHub, en
  [`marialuisag/bloom-app`](https://github.com/marialuisag/bloom-app), rama `main`.
- **⚠️ Desincronización actual**: en GitHub hoy solo están commiteados `README.md` e
  `index.html` (commits "Initial commit" y "Página inicial de Bloom"). El backend completo
  (`server.js`, `db.js`, `package.json`, `package-lock.json`, `.gitignore`) y toda la
  documentación (`DOCUMENTACION.md`, `PROPUESTA_BLOOM.md`, `TUTORIAL.md`) existen solo en
  la copia local y **no están commiteados ni pusheados todavía**. Hay que hacer
  `git add` + `git commit` + `git push` de esos archivos para que el repositorio de GitHub
  refleje el estado real del proyecto.
- **Hosting/despliegue**: la app corre en **Railway** (servicio "empowering-serenity"),
  que aloja el backend Express y la base de datos PostgreSQL. Railway puede estar sirviendo
  una versión del backend desplegada directamente (por ejemplo vía `railway up` desde la
  máquina local) en vez de estar conectado al repo de GitHub — vale la pena confirmar en el
  panel de Railway si el deploy está enlazado a este repositorio o si se hizo por CLI,
  para saber qué disparará el próximo deploy automático.

## 3. Evaluación honesta de la idea

### Lo que funciona a favor

- **Propuesta clara y con demanda real**: el "bienestar digital" / gestión consciente del tiempo de pantalla es una categoría validada (Screen Time de Apple, Digital Wellbeing de Google, Forest, RescueTime, Opal, Freedom). Hay usuarios dispuestos a pagar por esto.
- **Identidad visual coherente desde el día uno**: la paleta rosa/coral, la tipografía y el tono ("compañera de bienestar") transmiten calidez y un enfoque no punitivo, distinto al tono más "clínico" de otras apps del rubro. Eso es una buena decisión de branding temprana.
- **Nombre fuerte**: "Bloom" comunica crecimiento personal de forma simple y memorable, y es coherente con el emoji/logo floral.
- **Mensaje centrado en la persona, no en la culpa**: "cultiva hábitos más conscientes" en vez de "reduce tu tiempo de pantalla" es un framing más agradable, que puede ayudar a la retención (la culpa suele generar abandono en este tipo de apps).

### Riesgos y puntos débiles a resolver

1. **Diferenciación poco definida.** El mercado de bienestar digital está saturado y dominado por herramientas del propio sistema operativo (gratis, con acceso profundo al dispositivo). Bloom necesita responder con claridad: *¿por qué alguien usaría esto en vez de Screen Time/Digital Wellbeing, que ya vienen instaladas?* Ideas para diferenciarse: enfoque en un nicho concreto (estudiantes, freelancers, personas con TDAH, equipos de trabajo), un método/framework propio (journaling, gamificación, coaching con IA), o integración con hábitos offline (ejercicio, sueño, lectura) y no solo tiempo de pantalla.
2. **El "cómo" no está definido todavía.** El texto promete "descubrir cómo usas tu tiempo", lo cual normalmente requiere **tracking automático** (integración con APIs del sistema operativo, extensión de navegador, o app nativa con permisos de uso). Una web app estática no puede medir el uso real del dispositivo — solo podría registrar datos que el usuario ingrese manualmente. Es una decisión de producto clave que falta tomar: ¿tracking automático (más valioso, más complejo técnicamente) o autorregistro manual (más simple, pero depende de la disciplina del usuario, que es justo lo que la app busca ayudar a construir)?
3. **Plataforma no decidida.** Al ser una página web, hoy Bloom no puede acceder a datos de uso de apps ni notificaciones del sistema. Si el objetivo real es medir hábitos digitales, probablemente se necesite una app móvil nativa o una extensión de navegador, no solo un sitio web.
4. **Modelo de negocio ya definido, falta implementarlo.** `PROPUESTA_BLOOM.md` (sección 6) ya propone freemium por suscripción + licencias B2B2C, con precios de referencia. Sigue siendo una hipótesis sin validar, pero ya no es un punto ciego del proyecto.
5. **Sin validación de usuarios todavía.** No hay evidencia (en el repo) de investigación de usuarios, encuestas o testeo. Antes de invertir mucho tiempo en desarrollo, conviene validar el dolor específico con 5-10 personas del público objetivo.

### Conclusión

La idea en sí (bienestar digital con un enfoque cálido y no punitivo) **es sólida y tiene demanda de mercado probada**, pero es una categoría competitiva donde ganar requiere una diferenciación clara — nicho, mecanismo único o experiencia notablemente mejor. Lo construido hasta ahora es el andamiaje técnico (landing + backend Express + base de datos PostgreSQL conectada), sin lógica de producto todavía; es un buen punto de partida de branding e infraestructura, pero el riesgo real del proyecto sigue sin ser de diseño ni de infraestructura, sino de **producto**: falta decidir qué se va a medir, cómo, y por qué alguien elegiría Bloom sobre las herramientas nativas gratuitas que ya existen.

## 4. Próximos pasos sugeridos

1. Definir el mecanismo central: ¿qué hábito(s) se van a trackear y cómo (manual vs. automático)?
2. Elegir la plataforma según ese mecanismo (web app, PWA, app móvil nativa, extensión de navegador).
3. Escribir en una frase la diferenciación frente a Screen Time/Digital Wellbeing/Forest.
4. Prototipar el flujo completo (no solo la portada): registro, pantalla principal de seguimiento, y una acción de "hábito consciente" de ejemplo.
5. Validar con un puñado de usuarios reales antes de construir más funcionalidad.
