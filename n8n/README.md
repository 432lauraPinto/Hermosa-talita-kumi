# Automatizaciones y Agente IA con n8n — HERMOSA TALITA KUMI

Estos flujos se conectan directamente con la Cloud Function HTTP `n8nApi` de Firebase (protegida con cabecera `x-api-key`) y reciben eventos desde Firestore.

## 1. Levantar n8n en Docker con zona horaria de Bolivia

```bash
docker run -it --rm -p 5678:5678 \
  -e GENERIC_TIMEZONE=America/La_Paz \
  -e TZ=America/La_Paz \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

> **Nota sobre red local:** Desde dentro del contenedor Docker, el host se alcanza mediante `http://host.docker.internal:5001/demo-hermosa-talita-kumi/southamerica-east1/n8nApi`. En Linux agrega `--add-host=host.docker.internal:host-gateway`.

## 2. Flujos exportados (`n8n/workflows/`)

| Archivo | Nombre | Función |
|---|---|---|
| `01_htk_chatbot.json` | **HTK – Chatbot** | Webhook `/webhook/htk-chatbot` → AI Agent (OpenAI) con herramientas HTTP a `n8nApi` → Respond to Webhook. |
| `02_htk_eventos_citas.json` | **HTK – Eventos de citas** | Webhook `/webhook/htk-eventos-citas` disparado por `onCitaEvento` (alta, confirmación y cancelación). |
| `03_htk_recordatorios.json` | **HTK – Recordatorios** | Cron diario a las `18:00` (`America/La_Paz`) que consulta `GET /citas-manana` y prepara los recordatorios. |
| `04_htk_stock_bajo.json` | **HTK – Stock bajo** | Cron de lunes a sábado a las `08:30` que consulta `GET /stock-bajo` y arma alerta para el administrador. |

## 3. Seguridad del Agente IA

- Todas las peticiones a `n8nApi` llevan la cabecera `x-api-key` igual a `N8N_API_KEY` en `functions/.env`.
- En las herramientas privadas (`consultar_mis_citas`, `reservar_cita`, `cancelar_cita`, `consultar_mi_saldo`), el campo `clienteId` **se inyecta directamente desde el `uid` verificado por Firebase Auth en el webhook** (`$('Webhook HTK Chatbot').item.json.body.uid`), nunca elegido por el LLM, mitigando ataques de *prompt injection*.
- Si n8n está apagado o sin API Key de OpenAI, `chatbotMensaje` activa automáticamente el motor de reglas local con `faq`, `servicios`, `promociones` y `sucursales`.
