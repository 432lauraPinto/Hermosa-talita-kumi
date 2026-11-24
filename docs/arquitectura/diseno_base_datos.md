# Modelo de Datos en Cloud Firestore — HERMOSA TALITA KUMI

## Convenciones Globales
- **Moneda:** Bolivianos (`Bs`), redondeo exacto a 2 decimales (`Bs 0.00`).
- **Fechas de agenda:** Texto `AAAA-MM-DD` para evitar desplazamientos de zona horaria; visualizadas como `DD/MM/AAAA`.
- **Horas:** Formato 24 h (`HH:mm`).
- **Zona horaria:** `America/La_Paz` (UTC-4 fijo).

## Colecciones Principales

| Colección | Clave de documento | Campos principales |
|---|---|---|
| `users` | `{uid}` | `nombre`, `telefono`, `email`, `role` (`admin`/`encargado`/`cliente`), `sucursales[]`, `activo` |
| `sucursales` | `{slug}` (`villa-fatima`, `upea`, `ceja`, `max-paredes`) | `nombre`, `ciudad`, `direccion`, `whatsapp`, `horario{apertura, cierre, dias[], slotMin}`, `capacidad: 2`, `activa` |
| `servicios` | `{id}` | `nombre`, `descripcion`, `precio`, `duracionMin`, `categoria`, `sucursales[]`, `activo` |
| `promociones` | `{id}` | `titulo`, `descripcion`, `descuento`, `vigencia`, `sucursales[]`, `activa` |
| `productos` | `{id}` | `nombre`, `categoria`, `precio`, `stockMinimo`, `activo` |
| `inventario` | `{sucursalId}_{productoId}` | `sucursalId`, `productoId`, `stock`, `stockMinimo` |
| `movimientos` | auto-ID | `tipo` (`entrada`/`salida`/`venta`/`transferencia`), `direccion`, `cantidad`, `delta`, `stockAntes`, `stockDespues`, `sucursalId`, `productoId`, `usuario`, `fecha` |
| `citas` | auto-ID | `clienteId`, `clienteNombre`, `sucursalId`, `servicioId`, `fecha`, `hora`, `horaFin`, `duracionMin`, `estado`, `canal` |
| `tratamientos` | auto-ID | `clienteId`, `sucursalId`, `servicioId`, `fecha`, `notas`, `total`, `saldo`, `estado`, `cuotas[]` |
| `pagos` | auto-ID | `tratamientoId`, `clienteId`, `sucursalId`, `monto`, `metodo`, `numeroCuota`, `cuotasAfectadas[]`, `fecha` |
| `faq`, `versiculos`, `chats`, `auditoria` | auto-ID / slug | Base de conocimiento del chatbot, inspiración, conversaciones (solo admin) y bitácora inmutable (solo admin) |
| `agendaLocks` | `{sucursalId}_{fecha}` | Documento interno de serialización transaccional (denegado al cliente en reglas) |
