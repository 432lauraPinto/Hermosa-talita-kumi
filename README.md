# HERMOSA TALITA KUMI — Sistema Web Integral

Plataforma web funcional, moderna y segura para el centro estético **HERMOSA TALITA KUMI**, con administración centralizada para cuatro sucursales en el departamento de La Paz, Bolivia:
1. **Villa Fátima** (Ciudad de La Paz) — WhatsApp: +591 77197857
2. **UPEA** (Ciudad de El Alto) — WhatsApp: +591 79688750
3. **Ceja** (Ciudad de El Alto) — WhatsApp: +591 76230119
4. **Max Paredes** (Ciudad de La Paz) — WhatsApp: +591 77197857

---

## 1. Tecnologías Obligatorias

* **Frontend:** React, JavaScript, HTML5, CSS3, Vite, React Router, Lucide Icons.
* **Backend:** Node.js con Express.js (Controladores, Middlewares, Rutas, Servicios, Validadores, Tiempo Real SSE).
* **Base de Datos:** MySQL 8.0 (con motor dual de desarrollo transparente SQLite para ejecución local sin Docker).
* **Automatización:** n8n (flujos de procesos y agente conversacional de IA).
* **Inteligencia Artificial:** OpenAI API / Proveedor compatible configurado por variable de entorno.
* **Tiempo Real:** Server-Sent Events (SSE) desde Express con alertas sonoras Web Audio API.
* **Contenedores:** Docker y Docker Compose (red aislada `htk_net`, volúmenes persistentes, healthchecks).
* **Control de Versiones:** Git y GitHub.

---

## 2. Localización y Formatos

* **Zona Horaria:** `America/La_Paz` (UTC-4, sin horario de verano) en contenedores, base de datos y Node.js.
* **Idioma:** Español (Bolivia) centralizado en toda la plataforma.
* **Moneda:** Bolivianos (`Bs`), siempre con dos decimales (`DECIMAL(10,2)`).
* **Formato de Fecha:** `DD/MM/AAAA`.
* **Formato de Hora:** Formato de 24 horas (`HH:mm`).

---

## 3. Estructura del Proyecto

```
hermosa-talita-kumi/
├── frontend/
│   ├── public/            (robots.txt, sitemap.xml, imágenes, logo oficial, sonido de alerta)
│   └── src/
│       ├── assets/        (imágenes y recursos estáticos)
│       ├── components/    (componentes visuales reutilizables)
│       ├── pages/         (páginas principales y vistas de rol)
│       ├── layouts/       (diseño estructural y layouts de navegación)
│       ├── services/      (llamadas API Axios/Fetch al backend)
│       ├── hooks/         (custom hooks de React)
│       ├── context/       (contextos de autenticación, sucursal activa y carrito)
│       ├── routes/        (enrutamiento protegido por rol)
│       └── styles/        (estilos CSS y paleta de colores)
├── backend/
│   ├── src/
│   │   ├── config/        (conexión a base de datos, variables y constantes)
│   │   ├── controllers/   (controladores REST HTTP)
│   │   ├── middlewares/   (autenticación JWT, verificación de roles, helmet, rate-limit)
│   │   ├── models/        (definiciones de datos y consultas SQL)
│   │   ├── routes/        (declaración modular de rutas)
│   │   ├── services/      (lógica de negocio pura, transacciones y disponibilidad)
│   │   ├── realtime/      (canales SSE de tiempo real y notificaciones)
│   │   ├── validators/    (esquemas de validación con Zod)
│   │   └── utils/         (funciones de ayuda, formato de moneda y fechas)
│   ├── uploads/           (volumen persistente para imágenes PNG, fuera del repositorio)
│   └── tests/             (batería de pruebas automatizadas)
├── database/
│   ├── migrations/        (migraciones SQL versionadas)
│   ├── seeds/             (datos semilla para desarrollo)
│   └── schema.sql         (esquema maestro relacional DDL)
├── n8n/
│   ├── workflows/         (flujos de trabajo exportados en JSON estándar)
│   └── README.md          (documentación de webhooks y nodos n8n)
├── scripts/
│   ├── backup.sh          (script de respaldo automatizado diario)
│   ├── restore.sh         (script de restauración de copias de seguridad)
│   ├── backup.ps1         (script PowerShell de respaldo en Windows)
│   └── restore.ps1        (script PowerShell de restauración en Windows)
├── docs/                  (arquitectura, endpoints, seguridad, pruebas, créditos)
├── docker-compose.yml     (orquestación de contenedores en red interna)
├── .env.example           (plantilla de variables de entorno sin credenciales)
├── .gitignore             (reglas estrictas de exclusión de secretos y temporales)
└── README.md
```

---

## 4. Instalación y Ejecución

### Opción A: Despliegue con Docker Compose (Producción / Staging)
Requisitos: Docker Engine y Docker Compose instalados.

1. Clonar el repositorio y configurar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Levantar los contenedores en segundo plano:
   ```bash
   docker compose up -d --build
   ```
3. Verificar el estado de salud de los servicios:
   ```bash
   docker compose ps
   ```
4. Acceso a los servicios:
   * **Frontend:** `http://localhost:3000`
   * **Backend API:** `http://localhost:5000/api/health`
   * **n8n:** `http://localhost:5678`

### Opción B: Ejecución Local para Desarrollo
Requisitos: Node.js v18+ y npm v9+.

1. **Configurar el entorno:**
   ```bash
   copy .env.example .env
   ```
2. **Instalar dependencias del Backend:**
   ```bash
   cd backend
   npm install
   npm run start
   ```
   *El backend inicializará el servidor en el puerto 5000 (`http://localhost:5000`). Si MySQL no está disponible, utilizará el motor relacional local persistente.*

3. **Instalar dependencias del Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *El frontend quedará activo en `http://localhost:5173`.*

---

## 5. Respaldos y Restauración (Módulo 18)

### Ejecutar Respaldo Manual
* En Linux / Docker:
  ```bash
  ./scripts/backup.sh
  ```
* En Windows (PowerShell):
  ```powershell
  .\scripts\backup.ps1
  ```
Los archivos de respaldo se generan en `./backups/` con compresión gzip (`db_estetica_db_YYYYMMDD_HHMMSS.sql.gz` y `uploads_YYYYMMDD_HHMMSS.tar.gz`) y metadatos en `last_backup.json`.

### Restaurar Respaldo
```bash
./scripts/restore.sh ./backups/db_estetica_db_20261113_093000.sql.gz
```

---

## 6. Roles del Sistema

* **Administrador General:** Jefes del centro con control total de las 4 sedes, precios, contenido de portada, versículos, usuarios y auditoría.
* **Encargado de Sucursal:** Acceso exclusivo a su(s) sede(s) asignada(s) para gestionar reservas, cobros, tratamientos e inventario.
* **Cliente:** Registro independiente para agendar citas, ver historial propio, saldos y chatear con el agente de IA.

---

## 7. Justificación de Librerías

* **React Router:** Enrutamiento SPA seguro y navegación declarativa por rol.
* **Zod:** Validación estricta de esquemas de entrada para evitar inyección y datos inconsistentes.
* **bcryptjs:** Cifrado unidireccional de contraseñas con salting.
* **Multer + Sharp:** Subida segura de imágenes exclusivamente en formato PNG con validación de magic bytes y conversión automática a WebP.
* **Helmet & CORS:** Cabeceras HTTP de protección y restricción de dominio cruzado.
* **Lucide React:** Iconografía vectorial estilizada y accesible.
