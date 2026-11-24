# Arquitectura General del Sistema — HERMOSA TALITA KUMI (Firebase + n8n)

## 1. Visión y Alcance
Plataforma web integral para el centro estético **HERMOSA TALITA KUMI** administrando centralizadamente **4 sucursales** en La Paz y El Alto, Bolivia:
1. **Villa Fátima** (La Paz) — WhatsApp: `+591 77197857`
2. **UPEA – El Alto** (El Alto) — WhatsApp: `+591 79688750`
3. **Ceja – El Alto** (El Alto) — WhatsApp: `+591 76230119`
4. **Max Paredes** (La Paz) — WhatsApp: `+591 77197857`

## 2. Diagrama de Arquitectura

```
                  [ NAVEGADOR: CLIENTE / ENCARGADO / ADMIN ]
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼ (Lecturas tiempo real)                              ▼ (Operaciones de negocio)
   [ CLOUD FIRESTORE ]                                 [ CLOUD FUNCTIONS v2 ]
   • Reglas estrictas por rol                          • Región: southamerica-east1
   • onSnapshot en tiempo real                         • Lógica pura: lib/slots.js
   • Escritura operativa bloqueada                     • Transacciones con agendaLocks
   • Índices compuestos                                • Auditoría automática
           ▲                                                     │
           └─────────────────── Admin SDK ───────────────────────┼──► [ N8N (DOCKER / EXTERNO) ]
                                                                 │    • HTK - Chatbot (AI Agent)
   [ FIREBASE AUTH ] ──── Tokens + Custom Claims ────────────────┘    • HTK - Eventos de citas
   [ FIREBASE HOSTING ] ── SPA React + Vite (rewrites)                • HTK - Recordatorios 18:00
                                                                      • HTK - Stock bajo
```

## 3. Principio de Seguridad
**El navegador solo lee y toda escritura operativa pasa por Cloud Functions.**
- Catálogo (`sucursales`, `servicios`, `promociones`, `productos`, `faq`, `versiculos`): lectura pública, escritura solo `admin`.
- `users/{uid}`: el usuario lee el suyo y solo puede modificar `nombre` y `telefono`; nunca el campo `role`.
- `citas`, `tratamientos`, `pagos`: lectura por dueño o personal de la sucursal; escritura 100% bloqueada desde cliente.
- `inventario` y `movimientos`: lectura solo personal de la sucursal; escritura bloqueada.
- `auditoria` y `chats`: lectura exclusiva del `admin`; escritura bloqueada.
