# HERMOSA TALITA KUMI — Sistema Web Integral (Firebase Local + n8n)

Plataforma web integral para el centro estético **HERMOSA TALITA KUMI**, con gestión centralizada para las **4 sucursales** en La Paz y El Alto, Bolivia:

1. **Villa Fátima** (La Paz) — WhatsApp: `+591 77197857`
2. **UPEA – El Alto** (El Alto) — WhatsApp: `+591 79688750`
3. **Ceja – El Alto** (El Alto) — WhatsApp: `+591 76230119`
4. **Max Paredes** (La Paz) — WhatsApp: `+591 77197857`

Arquitectura basada en **Firebase (Auth + Firestore + Cloud Functions v2 + Hosting)** ejecutándose localmente en el **Firebase Local Emulator Suite** (`demo-hermosa-talita-kumi`, sin cuenta ni tarjeta) e integración desacoplada con **n8n** para el chatbot con IA, notificaciones y recordatorios.

---

## 1. Requisitos

- **Node.js 20+** y **Java 11+** (requerido por el emulador de Firestore).
- **Git** y **Firebase CLI**: `npm i -g firebase-tools`
- **n8n (opcional en local, el chatbot cuenta con motor de reglas de respaldo):**
  ```bash
  docker run -it --rm -p 5678:5678 \
    -e GENERIC_TIMEZONE=America/La_Paz \
    -e TZ=America/La_Paz \
    -v n8n_data:/home/node/.n8n \
    n8nio/n8n
  ```
- Una API key de OpenAI (o compatible) para el nodo AI Agent de n8n.

---

## 2. Estructura del proyecto

```
hermosa-talita-kumi/
├── firebase.json            (auth 9099, firestore 8080, functions 5001, hosting 5000, UI 4000)
├── .firebaserc              (proyecto "demo-hermosa-talita-kumi")
├── firestore.rules          (cliente solo lee; toda escritura operativa pasa por Functions)
├── firestore.indexes.json   (índices compuestos para citas, movimientos, tratamientos y pagos)
├── functions/               (Node 20, firebase-functions v2, región southamerica-east1)
│   ├── .env.example
│   ├── .env                 (N8N_WEBHOOK_URL, N8N_EVENTOS_WEBHOOK_URL, N8N_API_KEY)
│   ├── index.js
│   └── src/
│       ├── lib/             (slots.js, time.js, money.js, auth.js, audit.js, firebase.js)
│       └── services/        (citas, inventario, tratamientos, usuarios, panel, chatbot, n8n)
├── frontend/                (Vite + React + React Router + lucide-react + firebase SDK)
├── n8n/workflows/           (4 flujos exportados en JSON)
├── scripts/seed.js          (datos iniciales idempotentes)
├── tests/                   (unitarias slots.js, reglas Firestore e integración contra emuladores)
└── docs/                    (arquitectura, decisiones técnicas, diseño de datos y créditos)
```

---

## 3. Convenciones

- **Moneda:** Bolivianos (`Bs 0.00`), aritmética exacta en centavos enteros.
- **Fechas:** guardadas como texto `AAAA-MM-DD`, mostradas como `DD/MM/AAAA`.
- **Horas:** formato 24 h (`HH:mm`).
- **Zona horaria:** `America/La_Paz` (UTC-4 fijo).

---

## 4. Instalación y ejecución local

```bash
npm run install:all
cp functions/.env.example functions/.env   # editar claves si usas n8n
npm --prefix frontend run build            # compila para Hosting local
firebase emulators:start --import=./emulator-data --export-on-exit
```

En una segunda terminal (solo la primera vez, o para re-sembrar):

```bash
node scripts/seed.js
npm --prefix frontend run dev              # http://localhost:5173
```

**Servicios locales:**
- Frontend Dev (Vite): `http://localhost:5173`
- Firebase Hosting local: `http://127.0.0.1:5000`
- Emulator UI: `http://127.0.0.1:4000`
- n8n (Docker): `http://localhost:5678`

### Credenciales demo creadas por `scripts/seed.js`

| Rol | Correo | Contraseña | Sucursal |
|---|---|---|---|
| `admin` | `admin@talitakumi.com` | `Admin123!` | Todas (4 sedes) |
| `encargado` | `encargado.villafatima@talitakumi.com` | `Encargado123!` | Villa Fátima |
| `encargado` | `encargado.upea@talitakumi.com` | `Encargado123!` | UPEA – El Alto |
| `encargado` | `encargado.ceja@talitakumi.com` | `Encargado123!` | Ceja – El Alto |
| `encargado` | `encargado.maxparedes@talitakumi.com` | `Encargado123!` | Max Paredes |
| `cliente` | `cliente@talitakumi.com` | `Cliente123!` | — |

---

## 5. Pruebas automatizadas (Objetivo 5)

```bash
npm run test:unit          # Lógica pura: slots.js, sweep-line capacidad=2, cuotas exactas
npm run test:rules         # @firebase/rules-unit-testing sobre firestore.rules
npm run test:integration   # Concurrencia real, transferencias, pagos, auditoría, chatbot y n8nApi
npm test                   # Ejecuta toda la suite completa
```

---

## 6. Paso a producción

1. Crear proyecto Firebase real (plan **Blaze** para Cloud Functions) y actualizar `.firebaserc`.
2. Elegir ubicación de Firestore en `southamerica-east1`.
3. Configurar `VITE_USE_EMULATORS=false` y las credenciales web en `frontend/.env`.
4. Cargar secretos en Functions:
   ```bash
   firebase functions:secrets:set N8N_API_KEY
   ```
5. Publicar con `firebase deploy` y desplegar n8n en un servidor accesible por HTTPS público.
