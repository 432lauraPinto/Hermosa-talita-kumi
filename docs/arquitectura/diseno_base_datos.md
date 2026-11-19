# Diseño de Base de Datos — Hermosa Talita Kumi

## 1. Principios de Diseño
- **Motor:** MySQL 8.0 InnoDB (con soporte de desarrollo local SQLite transparente).
- **Codificación:** `utf8mb4` con collation `utf8mb4_unicode_ci`.
- **Moneda:** Todos los campos de precio, montos y saldos usan `DECIMAL(10,2)`. Prohibido el uso de coma flotante (`FLOAT` o `DOUBLE`).
- **Zona Horaria:** `America/La_Paz` (UTC-4).
- **Centralización sin Duplicación:** Una sola base de datos y un solo catálogo general de servicios y productos. Las disponibilidades, existencias y precios por sede se gestionan mediante tablas intermedias (`servicios_sucursales`, `productos_sucursales`, `promociones_sucursales`, `inventario`).
- **Integridad Referencial:** Claves foráneas con restricciones estrictas (`ON DELETE RESTRICT` o `CASCADE` según corresponda) e índices en campos de búsqueda y ordenación frecuente.
- **Borrado Lógico:** Los registros clave cuentan con campo `activo BOOLEAN` para no romper la integridad histórica.

---

## 2. Resumen de Tablas por Módulo (Módulo 03)

### Módulo 1: Usuarios y Autenticación
1. `roles`: Códigos `ADMIN_GENERAL`, `ENCARGADO`, `CLIENTE`.
2. `usuarios`: Credenciales seguras (hash bcrypt/argon2), estado, control de primer cambio de contraseña.
3. `clientes`: Datos extendidos del cliente, sucursal habitual, inasistencias acumuladas.
4. `encargados_sucursales`: Relación muchos a muchos entre encargados y sucursales permitidas.
5. `refresh_tokens`: Tokens rotativos almacenados con fecha de expiración y revocación.
6. `intentos_login`: Registro de intentos fallidos por IP e identificador para rate limiting y bloqueo por fuerza bruta.
7. `preferencias_usuario`: Configuraciones individuales (sonido de notificaciones, volumen, tema).

### Módulo 2: Sucursales y Capacidad
8. `sucursales`: Las 4 sedes oficiales (Villa Fátima, UPEA, Ceja, Max Paredes) con ciudad, WhatsApp y coordenadas.
9. `puestos_atencion`: Capacidad física de atención (2 puestos por sucursal por defecto para atender 2 clientes en simultáneo).
10. `horarios_sucursales`: Horarios de apertura y cierre por día de la semana (Lunes a Sábado, Domingo cerrado por defecto).
11. `dias_cerrados`: Feriados y excepciones de cierre por sucursal o globales.

### Módulo 3: Servicios y Categorías
12. `categorias_servicios`: Las 7 categorías oficiales (Facial, Baño de Luna, Cuidado corporal, Masajes, Depilación, Lifting de pestañas, Perfilado de cejas).
13. `servicios`: Catálogo maestro de tratamientos con descripción estética prudente, duración estimada y precio en Bs.
14. `servicios_sucursales`: Disponibilidad, duración y precio particular de cada servicio por sucursal.
15. `paquetes_servicios`: Configuración de paquetes de N sesiones (por ejemplo, 6 sesiones).
16. `paquetes_clientes`: Paquetes adquiridos por clientes, saldo de sesiones consumidas y pendientes.

### Módulo 4: Promociones Especiales
17. `promociones`: Ofertas especiales con tipo de vigencia (fecha reserva o cita), precio promocional y cupos.
18. `promociones_servicios`: Tratamientos vinculados a la promoción.
19. `promociones_sucursales`: Sedes donde aplica la promoción (evita que promociones exclusivas salgan en otras sedes).

### Módulo 5: Contenido de Portada y Versículos
20. `versiculos`: Textos bíblicos inspiradores con referencia, versión bíblica (RVR1960 provisional / NTV) y mensaje reflexivo.
21. `portada_imagenes`: Imágenes de alta calidad para la portada con transición crossfade y créditos de licencia.

### Módulo 6: Productos e Inventario
22. `categorias_productos`: Clasificación de productos.
23. `marcas`: Marcas autorizadas.
24. `productos`: Catálogo maestro de cosméticos con tipo (facial/corporal), función e instrucciones de uso verificadas.
25. `productos_servicios`: Relación entre productos cosméticos y los tratamientos donde se aplican.
26. `productos_sucursales`: Disponibilidad del producto por sucursal.
27. `inventario`: Existencias físicas por sucursal y producto, con restricción `CHECK (stock_actual >= 0)`.
28. `movimientos_inventario`: Historial auditable de entradas, salidas, ventas y consumo por tratamiento.

### Módulo 7: Personal
29. `personal`: Nombres y especialidades del personal que atiende (sin acceso al sistema).
30. `personal_sucursales`: Asignación del personal a cada sede.

### Módulo 8: Reservas y Disponibilidad
31. `politicas_reserva`: Anticipación mínima/máxima, tiempo de preparación (10 min), límite de cancelación, etc.
32. `estados_reserva`: `PENDIENTE`, `CONFIRMADA`, `CANCELADA_CLIENTE`, `CANCELADA_SUCURSAL`, `ATENDIDA`, `NO_ASISTIO`.
33. `retenciones_horario`: Holds temporales (10 min) mientras el cliente autenticado finaliza la confirmación.
34. `bloqueos_horarios`: Bloqueos manuales por mantenimiento o capacitación en la sede.
35. `reservas`: Cita confirmada con código único, puesto asignado, precio original y precio aplicado.
36. `historial_reservas`: Trazabilidad completa de modificaciones y cancelaciones.

### Módulo 9: Tratamientos Realizados y Seguimiento
37. `reglas_seguimiento`: Días de intervalo recomendados para citas de seguimiento por tipo de servicio.
38. `historial_tratamientos`: Expediente de sesiones realizadas con notas técnicas y reacción de piel.
39. `productos_utilizados`: Registro de insumos y productos empleados en la sesión.
40. `seguimientos`: Agenda de contacto para citas preventivas y de mantenimiento.

### Módulo 10: Pagos y Abonos
41. `pagos`: Registro de pago asociado a la cita, paquete o producto con importe, saldo y método de pago (efectivo, QR, transferencia).
42. `abonos`: Pagos parciales que amortizan saldos pendientes.

### Módulo 11: Notificaciones en Tiempo Real
43. `notificaciones`: Notificaciones persistentes con estado de lectura dirigidas al encargado de la sede y al administrador general.
44. `configuracion_notificaciones`: Preferencias de alertas sonoras y visuales por usuario.

### Módulo 12: Auditoría y Chatbot
45. `auditoria`: Bitácora inmutable de cambios (quién, qué, cuándo, IP, valores anteriores y nuevos).
46. `configuracion_general`: Parámetros operativos generales del sistema.
47. `conversaciones_chatbot`: Historial de consultas y herramientas ejecutadas con política de retención y derecho al borrado por el cliente.
