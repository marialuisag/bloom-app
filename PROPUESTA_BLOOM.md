# Bloom — Propuesta de Proyecto

## 1. Idea de la App

Bloom es una app de bienestar digital y productividad consciente. Su función central es ayudar a la persona usuaria a **entender cómo usa su tiempo** (especialmente el tiempo de pantalla) y a **construir hábitos más saludables** a partir de esa información, con un enfoque cálido y no punitivo — no busca "prohibir" el uso del celular, sino generar conciencia y acompañar el cambio de hábito.

Componentes principales del producto (a futuro, sobre la base ya construida):
- Registro/seguimiento de tiempo de uso y hábitos.
- Panel con métricas simples (tiempo por categoría, rachas, progreso).
- Micro-metas y recordatorios amables ("nudges"), no alarmas de culpa.
- Journaling breve o reflexión guiada sobre el propio uso del tiempo.

## 2. Antecedentes y Motivos — Por qué es importante

El uso de dispositivos digitales ocupa una porción creciente de la vida cotidiana, y una parte relevante de ese tiempo no es intencional: se entra a revisar algo puntual y se termina navegando sin rumbo ("doomscrolling"). Esto se asocia con fatiga mental, dificultad para concentrarse, ansiedad comparativa (redes sociales) y sensación de "tiempo perdido" que las personas reportan después del hecho.

Las soluciones que ya existen (Screen Time de Apple, Digital Wellbeing de Google) resuelven la parte de *medición*, pero lo hacen con una lógica de **restricción y culpa** (límites, bloqueos, alertas rojas). La evidencia de uso de este tipo de herramientas muestra que gran parte de los usuarios las desactiva o ignora justamente porque generan rechazo en vez de acompañamiento.

Bloom parte de una motivación distinta: el cambio de hábito sostenido no se logra prohibiendo, sino generando **conciencia + acompañamiento emocional positivo**. Por eso es importante como producto: ataca el mismo problema (uso desordenado del tiempo digital) desde un ángulo psicológicamente más efectivo y menos explorado comercialmente.

## 3. Público Objetivo

- **Rango etario:** 18–35 años (jóvenes adultos, estudiantes universitarios y profesionales jóvenes), el segmento con mayor tiempo de pantalla reportado y mayor apertura a apps de bienestar/mindfulness.
- **Perfil psicográfico:** personas que ya son conscientes de que "usan demasiado el celular" y sienten cierta culpa o frustración al respecto, pero que **rechazan las apps de bloqueo agresivo** por sentirlas punitivas o infantilizantes.
- **Casos de uso concretos:**
  - Estudiantes que quieren mejorar su enfoque para estudiar.
  - Freelancers/trabajadores remotos que buscan estructurar su jornada.
  - Personas en proceso de mejorar su salud mental/hábitos de sueño, para quienes el celular es un factor identificado.
- **No es el público objetivo (por ahora):** niños/adolescentes bajo control parental (categoría distinta, con otros requisitos legales de privacidad) ni empresas grandes (aunque sí es una vía de expansión futura, ver sección 6).

## 4. Justificación del Diseño

El diseño actual (fondo rosa pastel `#FFD1DC`, tarjeta blanca redondeada, tipografía suave, botón coral) no es una elección estética arbitraria; responde directamente al posicionamiento de la sección 2:

- **Paleta cálida y suave (rosa/coral) en vez de azules "corporativos" o rojos de alerta**: el color condiciona la respuesta emocional antes que el texto. Un diseño que se siente como una app médica o de control genera la misma resistencia que ya rechazan las apps de Screen Time. El rosa/coral comunica cuidado y calma, coherente con el mensaje "compañera de bienestar" y no "sistema de vigilancia".
- **Bordes muy redondeados y sombras suaves**: transmiten seguridad y ausencia de fricción, evitando la estética "dashboard de métricas" que puede sentirse exigente o técnica.
- **Una sola pantalla, mensaje corto, un solo botón de acción ("Comenzar")**: minimiza la carga cognitiva inicial. El objetivo del primer contacto no es mostrar funciones, sino bajar la barrera de entrada emocional (mucha gente evita este tipo de apps porque anticipa que "le van a decir lo mal que está usando el celular").
- **Nombre y logo floral (🌸 "Bloom" = florecer)**: refuerza la narrativa de crecimiento personal progresivo, en vez de restricción — florecer es un proceso gradual y positivo, no un límite impuesto.

En síntesis: cada decisión de diseño busca sostener el diferencial de producto (acompañamiento no punitivo) definido en la sección 2, no solo verse bien.

## 5. Arquitectura

Arquitectura implementada hasta este punto del desarrollo:

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌───────────────────┐
│   Cliente (browser)  │  HTTP  │  Servidor Node.js/Express │  SQL   │  PostgreSQL        │
│   index.html + CSS   │ ─────► │  server.js / db.js       │ ─────► │  (Railway)         │
└─────────────────────┘        └──────────────────────────┘        └───────────────────┘
                                          ▲
                                Desplegado en Railway
                                (servicio "empowering-serenity")
```

- **Lenguaje/Runtime: Node.js.** Se eligió por ser el mismo lenguaje (JavaScript) tanto en frontend como backend, lo que simplifica el desarrollo para un equipo chico/solo developer, y por tener el ecosistema de librerías más grande para prototipar rápido.
- **Framework backend: Express.** Es el estándar de facto en Node para levantar un servidor HTTP con rutas (`/api/health`, y a futuro `/api/habitos`, `/api/usuarios`, etc.), minimalista y con curva de aprendizaje baja.
- **Base de datos: PostgreSQL**, alojada como servicio administrado en **Railway**. Se eligió Postgres (relacional) porque el modelo de datos del producto es inherentemente relacional: usuarios, hábitos, registros de tiempo y rachas están vinculados entre sí, y el producto necesita hacer agregaciones (promedios semanales, tendencias) que SQL resuelve de forma natural y eficiente.
- **Librería de conexión a base de datos: `pg`** — el driver oficial de PostgreSQL para Node, usado en modo *pool* de conexiones (`db.js`) para reutilizar conexiones en vez de abrir una nueva por cada consulta (más eficiente bajo carga).
- **`dotenv`**: carga variables de entorno (credenciales de conexión) desde un archivo `.env` en desarrollo local, evitando hardcodear contraseñas en el código.
- **Hosting/Infraestructura: Railway.** Se eligió por permitir desplegar backend + base de datos en la misma plataforma con un flujo simple (`railway up`), variables de entorno referenciadas entre servicios (`${{Postgres.DATABASE_URL}}`) y dominio público HTTPS automático — ideal para la etapa actual (validación/MVP) sin necesitar configurar infraestructura desde cero (servidores, balanceadores, certificados).
- **Frontend actual:** HTML + CSS estático servido por el propio Express (`express.static`). Es deliberadamente simple porque el foco actual está en validar el backend/datos, no en la experiencia final; a medida que se agreguen pantallas (registro, panel de hábitos), es candidato a migrar a un framework de UI (por ejemplo React) manteniendo el mismo backend Express como API.

## 6. Modelo de Negocio

Se descarta explícitamente la publicidad como fuente de ingresos (rompe la premisa de "acompañamiento sin fricción" — los anuncios son la forma más rápida de erosionar confianza en una app de bienestar). El modelo propuesto combina dos fuentes:

### a) Freemium por suscripción (ingreso principal, B2C)
- **Plan gratuito:** seguimiento básico de tiempo/hábitos, un número limitado de hábitos activos.
- **Plan Bloom+ (de pago):** analítica avanzada (tendencias, comparativas semanales/mensuales), hábitos ilimitados, journaling guiado, recordatorios personalizados.
- Precio de referencia: **USD 4.99/mes o USD 39.99/año** (equivalente a ~USD 3.33/mes con el plan anual), en línea con apps comparables de bienestar (Forest, Headspace Go, Opal rondan ese rango).

### b) Licencias B2B2C ("Bloom for Teams/Campus")
- Venta a empresas (programas de bienestar laboral) y universidades (bienestar estudiantil) como beneficio para sus empleados/alumnos: licencia grupal con panel agregado y anónimo de bienestar del equipo/institución.
- Ingreso por cliente institucional bastante mayor al de un usuario individual (contratos B2B), y ayuda a diversificar el ingreso sin depender solo de conversión individual.

## 7. Escalabilidad

**Técnica:**
- La arquitectura actual (Express + Postgres en Railway) escala verticalmente sin cambios de código hasta varios miles de usuarios concurrentes.
- Para crecer más allá de eso, los puntos de evolución natural son: (1) agregar una capa de caché (Redis) para datos leídos con frecuencia (dashboards), (2) separar lectura/escritura de la base de datos (réplicas de lectura), (3) mover assets estáticos a un CDN, y (4) eventualmente separar el backend en servicios más chicos si el catálogo de funcionalidades crece mucho (no es necesario en el corto plazo).
- El uso de un ORM/query builder (por ejemplo Prisma o Drizzle) sobre `pg` es un paso recomendado antes de escalar el equipo de desarrollo, para mantener consistencia en el esquema.

**De producto/negocio:**
- El modelo freemium escala con cero costo marginal de "onboarding" por usuario nuevo (a diferencia de un modelo de ventas manual).
- El canal B2B2C escala por número de contratos institucionales, no por usuario, lo que permite crecer ingresos sin depender exclusivamente del volumen de usuarios individuales.
- Expansión posible a app móvil nativa (iOS/Android) para habilitar tracking automático real de uso de pantalla, que hoy la versión web no puede medir (requiere permisos del sistema operativo).

## 8. Proyección

Hoja de ruta orientativa:

| Fase | Foco | Hito |
|---|---|---|
| 0 (actual) | Backend + base de datos funcionando, landing | Validado ✅ |
| 1 | Definir esquema de datos (usuarios, hábitos, registros) + registro/login | MVP funcional |
| 2 | Validación con usuarios reales (50–100 personas) | Confirmar retención y disposición a pagar |
| 3 | Lanzamiento freemium público (web/PWA) | Primeros 1,000–10,000 usuarios registrados |
| 4 | App móvil nativa (tracking automático) | Diferenciación real vs. competidores web |
| 5 | Primeros contratos B2B2C (empresas/universidades) | Segunda fuente de ingreso |

## 9. Rentabilidad Estimada a 10,000 Usuarios Registrados

Cálculo ilustrativo basado en el modelo freemium (sección 6a), con supuestos explícitos (no son datos reales, son estimaciones para modelar el escenario):

**Supuestos:**
- 10,000 usuarios registrados totales.
- Tasa de conversión a plan pago: rango típico de apps freemium de bienestar es 2%–5%. Se modelan 3 escenarios.
- Precio promedio efectivo por usuario pago: **USD 4/mes** (mezcla de planes mensuales y anuales).
- Comisión de procesamiento de pagos (Stripe u similar): ~2.9% + USD 0.30 por transacción ≈ **USD 0.42 por usuario pago/mes**.
- Costos de infraestructura (Railway: backend + Postgres) a esta escala: **~USD 80/mes** (estimado; escala con uso, no con usuarios registrados en sí).
- Otros costos fijos operativos (email transaccional, monitoreo, dominio): **~USD 40/mes**.
- **No incluye salarios/costo de desarrollo** — es rentabilidad de la operación del producto en sí, no de un equipo con nómina.

| Escenario | Conversión | Usuarios pagos | Ingreso bruto/mes | Comisiones pago | Infraestructura + operación | Ganancia neta/mes | Ganancia neta/año |
|---|---|---|---|---|---|---|---|
| Conservador | 2% | 200 | USD 800 | USD 84 | USD 120 | **USD 596** | **≈ USD 7,150** |
| Medio | 3.5% | 350 | USD 1,400 | USD 147 | USD 120 | **USD 1,133** | **≈ USD 13,600** |
| Optimista | 5% | 500 | USD 2,000 | USD 210 | USD 120 | **USD 1,670** | **≈ USD 20,040** |

**Lectura honesta del resultado:** con solo 10,000 usuarios registrados, el modelo freemium por sí solo genera una ganancia neta modesta (entre ~USD 7,000 y ~USD 20,000 al año), **insuficiente para sostener un equipo con salarios** — funciona como validación de unit economics positivos (el producto no pierde dinero por usuario), no como negocio a tiempo completo todavía. La rentabilidad real del proyecto depende de escalar el número de usuarios muy por encima de 10,000 y/o de sumar el canal B2B2C (sección 6b): un solo contrato institucional de, por ejemplo, USD 500–1,000/mes puede superar el ingreso neto de la conversión freemium completa a esta escala, lo cual confirma que el canal B2B2C no es opcional sino la vía de rentabilidad real a mediano plazo.
