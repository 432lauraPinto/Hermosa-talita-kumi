# Decisiones Técnicas y Justificación de Librerías — Hermosa Talita Kumi

Conforme a la regla 6 del Módulo 01, este documento justifica cada librería de apoyo utilizada y documenta las decisiones arquitectónicas clave.

---

## 1. Justificación de Librerías de Apoyo

### Frontend
1. **React 19 + Vite:**
   - *Justificación:* Exigido por el Módulo 01 y 02. Vite proporciona un servidor de desarrollo ultra-rápido, compilación optimizada con Rollup y soporte nativo de ES Modules.
2. **React Router DOM (v7 / v6):**
   - *Justificación:* Enrutamiento declarativo del lado del cliente para soportar la navegación SPA móvil-first, rutas públicas, rutas protegidas por rol (`/admin`, `/encargado`, `/mi-cuenta`) y división de código (code-splitting con `React.lazy`).
3. **Lucide React:**
   - *Justificación:* Conjunto de iconos vectoriales ligeros, limpios y accesibles que complementan la identidad visual elegante (#B8860B, #C46A86) sin sobrecargar el peso del bundle.

### Backend
1. **Express.js:**
   - *Justificación:* Framework web minimalista, robusto y estándar en Node.js para construcción de APIs RESTful y servicios de tiempo real con SSE.
2. **bcryptjs / argon2:**
   - *Justificación:* Hashing seguro de contraseñas con salting para protección contra ataques de diccionario y rainbow tables, cumpliendo con la sección 21.1 del Módulo 04.
3. **jsonwebtoken (JWT):**
   - *Justificación:* Emisión de tokens de acceso firmados de corta duración (15 min) y refresh tokens rotativos para una autenticación sin estado en la API y persistencia segura en cookies HttpOnly.
4. **Helmet:**
   - *Justificación:* Configuración automática de cabeceras HTTP de seguridad (Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options) para mitigar ataques XSS y clickjacking.
5. **CORS:**
   - *Justificación:* Restricción estricta de orígenes permitidos únicamente al dominio del frontend autorizado, evitando peticiones no autorizadas entre sitios.
6. **Multer + Sharp:**
   - *Justificación:* Subida segura de imágenes en formato PNG con validación estricta de firma binaria (magic bytes), redimensionamiento, compresión y generación automática de WebP para alto rendimiento y SEO (Módulo 17).
7. **Zod / Joi:**
   - *Justificación:* Validación y tipado riguroso en tiempo de ejecución de todas las entradas del cliente en los endpoints, protegiendo contra inyección SQL y parámetros maliciosos.
8. **mysql2 + sql.js (Dual Engine Dev/Prod):**
   - *Justificación:* `mysql2` proporciona el conector oficial de alto rendimiento para MySQL 8.0 en contenedores Docker y producción. En entornos locales de desarrollo donde Docker/MySQL no estén instalados, el backend conmuta de forma transparente a `sql.js` (SQLite en memoria/disco con idéntico esquema relacional), garantizando que todo el equipo pueda desarrollar y probar sin bloqueos.

---

## 2. Decisiones de Arquitectura

### 1. Zona Horaria Centralizada
- `America/La_Paz` (UTC-4) sin horario de verano. Se configura tanto en la variable de entorno `TZ` de Docker y Node.js como en MySQL (`SET time_zone = '-04:00'`).

### 2. Prevención de Concurrencia en Reservas (Anti-Colisión)
- La disponibilidad no se fía del frontend. Al momento de confirmar una reserva o solicitar un bloqueo temporal (hold), el backend ejecuta una transacción con `SELECT ... FOR UPDATE` sobre el puesto de atención en la franja horaria requerida (`hora_inicio` a `hora_fin`). Si ya existe una reserva activa, la transacción aborta limpiamente e informa al cliente.

### 3. Roles y Aislamiento Multisede
- Cada encargado de sucursal tiene vinculada su lista de sedes permitidas en `encargados_sucursales`. El middleware de autorización extrae el `usuario_id` del token JWT verificado y rechaza cualquier consulta o acción sobre sucursales no autorizadas (mitigación completa de vulnerabilidades IDOR).
