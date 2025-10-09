# CRM — CellPhoneFree (Next.js)

Resumen
-------
Aplicación CRM interna construida con Next.js (App Router) para la gestión comercial de CellPhoneFree. Provee gestión de prospectos y clientes, manejo de pedidos preliminares, paneles con gráficos, y herramientas automatizadas (bot, tokens de acceso, webhooks). Este repositorio contiene la lógica del producto y ejemplos de integraciones; no está pensado para distribución pública sin adaptar secretos y configuraciones.

Funcionalidades principales
---------------------------
- Gestión de prospectos y clientes: creación, edición, conversión de prospectos a clientes.
- Pedidos preliminares: registro asociado a prospectos o clientes, con estado y detalles de ítems.
- Conversión automática: al convertir un prospecto en cliente se actualizan los pedidos_preliminares para asignar cliente_id y vendedor_id.
- Autenticación: NextAuth (Credentials) para el acceso del personal y control de sesiones.
- Tokens de acceso: generación y manejo de tokens para que prospectos/ clientes puedan acceder al ecommerce o recursos específicos.
- Bot integrado: bot que parsea consultas y responde usando datos de la base.
- Dashboard y UI: componentes React/TSX con gráficos y estadísticas (Chart.js + react-chartjs-2) para métricas de ventas y actividad.
- Recordatorios y cron: lógica para recordatorios y tareas programadas con node-cron.
- API internas: rutas en app/api para CRUD, webhooks y acciones del negocio.
- Logs y trazabilidad: trazas en funciones críticas (alta de cliente, creación de pedidos, notificaciones).

Arquitectura (resumen)
----------------------
- Frontend: Next.js (App Router) — UI y componentes React.
- Backend: rutas API dentro de Next.js (server-side functions) que consumen MySQL vía mysql2.
- Persistencia: MySQL (tablas: clientes, prospectos, pedidos_preliminares, recordatorios, etc.).
- Integraciones opcionales: Telegram bot, webhooks externos, web-push (vapid), OpenAI (opcional).
- Deploy recomendado: VPS/Servidor persistente (evitar SSE en plataformas serverless que facturan por tiempo de ejecución).

Puntos técnicos relevantes
--------------------------
- Gráficos y visualizaciones: implementados con Chart.js y react-chartjs-2.
- Seguridad: NextAuth con AUTH_SECRET; manejo de credenciales y hashing con bcryptjs.
- Notificaciones: la versión en el repo puede incorporar SSE/WebPush/Telegram; SSE en entornos serverless puede generar costos altos.
- Servicio de bot: parsing de consultas y respuestas basadas en la DB (node-telegram-bot-api).
- Código organizado en: app/ui (componentes), app/api (endpoints), app/lib (mysql, data, auth, telegram, helpers).

Privacidad y secretos
---------------------
- No incluyas credenciales, tokens o .env en el repositorio público.
- Variables sensibles (DB, TELEGRAM_BOT_TOKEN, AUTH_SECRET, VAPID keys, WEBHOOK tokens) deben almacenarse en entorno seguro del host.

Advertencias operativas
-----------------------
- Evitar SSE o procesos que mantengan funciones serverless activas en plataformas que facturan por tiempo de ejecución (Vercel Fluid). Si se necesitan conexiones persistentes, usar VPS o servicios diseñados para conexiones en tiempo real (Pusher, Ably).
- Revisar y limpiar service workers (sw.js) si se migra o cambia hosting para evitar peticiones/errores 404 constantes.

Qué contiene el repositorio
---------------------------
- app/ — Código Next.js (UI, APIs, páginas, componentes).
- app/lib/ — Librerías internas (conexión a DB, lógica de negocio, integraciones).
- public/ — Assets estáticos.
- package.json — Dependencias y scripts.
- scripts y utilidades auxiliares (migraciones, tests según corresponda).

Muchas Gracias :)
