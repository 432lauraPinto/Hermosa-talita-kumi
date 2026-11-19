# Guía de Automatizaciones y Agente de IA con n8n

Esta carpeta contiene los workflows oficiales listos para importar en la instancia de n8n dentro del entorno Docker o en un servidor n8n independiente.

---

## Workflows Incluidos

| Archivo | Nombre | Propósito |
|---|---|---|
| `01_consultar_servicios.json` | **Consulta de Servicios** | Consulta servicios faciales y corporales activos desde MySQL y los retorna formateados. |
| `02_consultar_historial.json` | **Consulta de Historial** | Obtiene el historial estético del cliente autenticado asegurando aislamiento de datos. |
| `03_crear_reserva.json` | **Crear Reserva** | Valida colisiones de horario en tiempo real y registra la cita en estado PENDIENTE. |
| `04_cancelar_reserva.json` | **Cancelar Reserva** | Comprueba que la reserva pertenezca al cliente antes de cambiar el estado a CANCELADA. |
| `05_seguimiento_inteligente.json` | **Seguimiento Inteligente** | Extrae la última sesión del cliente, aplica la regla configurada y calcula la fecha exacta. |
| `06_recordatorio_citas.json` | **Recordatorio de Citas** | Cron programado a las 08:00 AM que revisa las citas del día siguiente y genera avisos. |
| `07_consultar_pagos.json` | **Consulta de Pagos** | Totaliza servicios facturados, abonos y saldo deudor pendiente del cliente. |
| `08_agente_ia_maestro.json` | **Agente IA Maestro** | Agente de IA con LangChain y OpenAI (`gpt-4o-mini`) que invoca las herramientas correspondientes. |

---

## Cómo Importar en n8n

1. Inicia sesión en tu panel de n8n (por defecto en `http://localhost:5678`).
2. En el menú lateral izquierdo, haz clic en **Workflows**.
3. Haz clic en el botón superior derecho **Add workflow** (o los tres puntos `...` → **Import from File**).
4. Selecciona el archivo `.json` correspondiente de la carpeta `n8n/workflows/`.
5. Activa el workflow con el switch **Active** en la esquina superior derecha.

---

## Configuración de Credenciales en n8n

### 1. Credencial MySQL
- **Host**: `mysql` (cuando se ejecuta en Docker) o `localhost` (si ejecutas n8n nativo).
- **Database**: `estetica_db`
- **User**: `estetica_user`
- **Password**: La configurada en tu archivo `.env` (`estetica_pass_2026`).
- **Port**: `3306`

### 2. Credencial OpenAI
- Tipo de credencial: **OpenAI API**.
- Introduce tu **API Key** (`sk-...`).
- El agente utilizará el modelo `gpt-4o-mini` con temperatura `0.3` para máxima precisión y cero invenciones.
