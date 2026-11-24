# Decisiones Técnicas — HERMOSA TALITA KUMI (Firebase Local + n8n)

## 1. Migración de Express/MySQL/SSE a Firebase
- **Firebase Auth + Custom Claims + Perfil en `users/{uid}`:** Sustituye la gestión manual de contraseñas y JWT, manteniendo control de roles (`admin`, `encargado`, `cliente`) y verificación de cuenta activa (`activo == true`).
- **Cloud Firestore + `onSnapshot`:** Reemplaza MySQL y SSE con suscripciones reactivas nativas en el navegador para agenda, citas del cliente, inventario y auditoría.
- **Cloud Functions v2 (`southamerica-east1`):** Concentra las reglas de negocio, transacciones atómicas y trazabilidad en `auditoria`.
- **Emulador local (`demo-hermosa-talita-kumi`):** Permite desarrollo, pruebas y defensa completa 100% local sin cuenta de pago ni conexión a nube.

## 2. Decisiones Críticas de Ingeniería
1. **Concurrencia determinista en reservas (`agendaLocks/{sucursal}_{fecha}`):** Además de consultar citas en transacción, cada reserva o reprogramación actualiza un documento lock por sucursal y día, garantizando serialización estricta tanto en el emulador como en producción.
2. **Evaluación de capacidad por barrido de eventos (*sweep-line*):** En `functions/src/lib/slots.js`, la capacidad simultánea (`capacidad: 2`) se evalúa instante a instante dentro de `[inicio, fin)`, evitando falsos bloqueos ante citas secuenciales.
3. **Aritmética exacta en centavos enteros (`lib/money.js`):** Toda partición de cuotas y aplicación de pagos trabaja en centavos enteros para garantizar que las cuotas sumen exactamente el total y los saldos cierren en `Bs 0.00`.
4. **Protección del AI Agent frente a *prompt injection*:** En el workflow de n8n `01_htk_chatbot.json`, `clienteId` se inyecta directamente desde el `uid` verificado por Firebase Auth en el webhook y nunca es elegido por el LLM.
5. **Resiliencia con fallback local:** Si n8n no responde dentro del timeout (5 s), `chatbotMensaje` responde automáticamente con un motor de reglas conectado a `faq`, `servicios`, `promociones` y `sucursales`.
