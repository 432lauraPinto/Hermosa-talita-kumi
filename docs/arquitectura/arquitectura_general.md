# Arquitectura General del Sistema — Hermosa Talita Kumi

## 1. Visión y Alcance
El sistema web integral de **HERMOSA TALITA KUMI** es una plataforma centralizada para la gestión de servicios estéticos faciales y corporales, catálogo de productos, promociones, agendamiento de citas con disponibilidad en tiempo real, administración por sucursales y asistente conversacional de Inteligencia Artificial integrado con n8n.

El sistema administra cuatro sucursales en el departamento de La Paz, Bolivia:
1. **Villa Fátima** (Ciudad de La Paz) — WhatsApp: +591 77197857
2. **UPEA** (Ciudad de El Alto) — WhatsApp: +591 79688750
3. **Ceja** (Ciudad de El Alto) — WhatsApp: +591 76230119
4. **Max Paredes** (Ciudad de La Paz) — WhatsApp: +591 77197857

---

## 2. Diagrama de Arquitectura

```
                        [ NAVEGADOR DEL CLIENTE / ENCARGADO / ADMIN ]
                                              │
                      ┌───────────────────────┴────────────────────────┐
                      ▼                                                ▼
           [ FRONTEND REACT (VITE) ]                         [ CANAL TIEMPO REAL ]
           • SPA Móvil-First                                 • SSE (Server-Sent Events)
           • React 19 + Lucide Icons                         • Alertas sonoras Web Audio
           • Paleta: Beige, Crema, Rosa, Oro                 • Ocupación de puestos en vivo
                      │                                                ▲
                      │ Peticiones HTTPS / REST                        │
                      ▼                                                │
         [ BACKEND NODE.JS + EXPRESS ] ────────────────────────────────┘
         • Autenticación JWT + Refresh Tokens HttpOnly
         • Control de Roles (Admin General, Encargado, Cliente)
         • Validación Zod / Joi en cada endpoint
         • Protección: Helmet, CSP, Rate Limiting, CORS estricto
         • Transacciones ACID con SELECT FOR UPDATE (Anti-colisión de citas)
                      │                                                │
        ┌─────────────┴─────────────┐                                  │
        ▼                           ▼                                  ▼
[ BASE DE DATOS MYSQL 8.0 ]    [ SERVICIO DE RESPALDOS ]      [ N8N AUTOMATIZACIÓN & IA ]
• Motor: InnoDB (utf8mb4)      • mysqldump --single-trans     • n8n workflows en Docker
• Zona Horaria: America/La_Paz • Compresión gzip              • Bridge seguro con API Key
• DECIMAL(10,2) para montos    • Retención diaria/semanal     • Agente conversacional IA
• 4 Sedes centralizadas        • Respaldo de /uploads         • Consultas a base de datos
```

---

## 3. Localización y Formatos
- **Zona Horaria:** `America/La_Paz` (UTC-4, sin horario de verano). Configurada a nivel de Docker Compose (`TZ`), base de datos y Node.js para garantizar consistencia horaria absoluta.
- **Idioma:** Español (Bolivia) en interfaces, validaciones, mensajes y respuestas del chatbot.
- **Moneda:** Bolivianos (`Bs`), siempre con dos decimales (`DECIMAL(10,2)`).
- **Formato de Fechas:** `DD/MM/AAAA`.
- **Formato de Hora:** 24 horas (`HH:mm`).
- **Teléfonos:** Con código de país Bolivia (`+591`).

---

## 4. Roles y Seguridad de Acceso
El sistema implementa estrictamente tres roles de usuario (sin roles de profesionales o recepcionistas con credenciales):
1. **Administrador General (Jefes del Centro):**
   - Acceso irrestricto a las 4 sucursales y configuraciones globales.
   - Creación de encargados, sucursales, servicios, categorías, promociones y contenido de portada.
   - Reportes consolidados e individuales, consulta de auditoría.
2. **Encargado de Sucursal:**
   - Acceso limitado exclusivamente a su sucursal o sucursales asignadas.
   - Gestión de reservas, calendario de su sede, tratamientos realizados, pagos, promociones de su sede e inventario local.
   - Bloqueo por backend ante cualquier intento de acceso cruzado (anti-IDOR).
3. **Cliente:**
   - Registro y autenticación propia.
   - Selección de sucursal y navegación de servicios y productos de esa sede.
   - Reserva de citas, consulta de historial propio, próximas sesiones y saldos.
   - Interacción con el chatbot sobre su propia información.
