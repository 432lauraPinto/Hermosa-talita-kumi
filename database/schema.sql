-- =====================================================================
-- ESQUEMA DE BASE DE DATOS MAESTRO V12: HERMOSA TALITA KUMI
-- Centro Estético Facial y Corporal — La Paz y El Alto, Bolivia
-- Codificación: utf8mb4 | Zona Horaria: America/La_Paz (UTC-4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS estetica_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estetica_db;

-- ---------------------------------------------------------------------
-- 1. USUARIOS, ROLES Y AUTENTICACIÓN
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,       -- 'ADMIN_GENERAL', 'ENCARGADO', 'CLIENTE'
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    email_verificado BOOLEAN NOT NULL DEFAULT 0,
    mfa_habilitado BOOLEAN NOT NULL DEFAULT 0,
    debe_cambiar_password BOOLEAN NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT 1,
    ultimo_login DATETIME NULL,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id),
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_rol (rol_id),
    INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    carnet_identidad VARCHAR(30),
    fecha_nacimiento DATE,
    preferencias_generales TEXT,
    sucursal_habitual_id INT NULL,
    inasistencias_acumuladas INT NOT NULL DEFAULT 0,
    requiere_confirmacion_manual BOOLEAN NOT NULL DEFAULT 0,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_clientes_inasistencias (inasistencias_acumuladas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    revocado BOOLEAN NOT NULL DEFAULT 0,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_refresh_token (token_hash),
    INDEX idx_refresh_expira (expira_en, revocado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intentos_login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identificador VARCHAR(120) NOT NULL,
    ip_origen VARCHAR(45) NOT NULL,
    exitoso BOOLEAN NOT NULL DEFAULT 0,
    fecha_intento DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intentos_ip_fecha (ip_origen, fecha_intento),
    INDEX idx_intentos_id_fecha (identificador, fecha_intento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_secretos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    secreto_cifrado VARCHAR(255) NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_codigos_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    consumido BOOLEAN NOT NULL DEFAULT 0,
    consumido_en DATETIME NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfacodes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_mfacodes_usr (usuario_id, consumido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verificaciones_correo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restablecimientos_contrasena (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    expira_en DATETIME NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    sonido_notificaciones BOOLEAN NOT NULL DEFAULT 1,
    tema_interfaz VARCHAR(30) DEFAULT 'claro',
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pref_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consentimientos_notificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    canal VARCHAR(40) NOT NULL, -- 'whatsapp', 'email'
    consentido BOOLEAN NOT NULL DEFAULT 1,
    fecha_consentimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cons_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uq_usr_canal (usuario_id, canal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. SUCURSALES (4 OFICIALES, AGENDA SIN PUESTOS)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,             -- 'Villa Fátima', 'UPEA – El Alto', 'Ceja – El Alto', 'Max Paredes'
    municipio VARCHAR(60) NOT NULL,           -- 'La Paz' o 'El Alto'
    departamento VARCHAR(60) NOT NULL DEFAULT 'La Paz',
    direccion TEXT,
    referencia TEXT,
    enlace_google_maps TEXT,
    place_id VARCHAR(120),
    telefono VARCHAR(30),
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sucursales_municipio (municipio),
    INDEX idx_sucursales_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS encargados_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    asignado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enc_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_enc_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_encargado_sucursal (usuario_id, sucursal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horarios_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    dia_semana TINYINT NOT NULL,              -- 1=Lunes, ..., 6=Sábado, 7=Domingo
    abierto BOOLEAN NOT NULL DEFAULT 1,
    hora_apertura TIME NOT NULL DEFAULT '08:30:00',
    hora_cierre TIME NOT NULL DEFAULT '19:30:00',
    inicio_descanso TIME NULL,
    fin_descanso TIME NULL,
    CONSTRAINT fk_horarios_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sucursal_dia (sucursal_id, dia_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dias_cerrados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    fecha DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cerrados_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sucursal_fecha_cerrado (sucursal_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion_reservas_sucursal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL UNIQUE,
    intervalo_minutos INT NOT NULL DEFAULT 30,
    anticipacion_minima_horas INT NOT NULL DEFAULT 2,
    anticipacion_maxima_dias INT NOT NULL DEFAULT 30,
    limite_cancelacion_horas INT NOT NULL DEFAULT 4,
    requiere_confirmacion_manual BOOLEAN NOT NULL DEFAULT 0,
    franjas_simultaneas_permitidas INT NOT NULL DEFAULT 1, -- Capacidad de agenda sin puestos
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cfg_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. CONFIGURACIÓN GENERAL Y POLÍTICAS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS configuracion_general (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(80) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255),
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS politicas_reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    anticipacion_minima_horas INT NOT NULL DEFAULT 2,
    anticipacion_maxima_dias INT NOT NULL DEFAULT 30,
    limite_cancelacion_horas INT NOT NULL DEFAULT 4,
    maximo_reservas_activas_por_cliente INT NOT NULL DEFAULT 3,
    intervalo_minutos INT NOT NULL DEFAULT 30,
    tiempo_preparacion_minutos INT NOT NULL DEFAULT 0,
    confirmacion_automatica BOOLEAN NOT NULL DEFAULT 1,
    plazo_vencimiento_pendientes_minutos INT NOT NULL DEFAULT 120,
    max_inasistencias_para_bloqueo INT NOT NULL DEFAULT 3,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. SERVICIOS Y TRATAMIENTOS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(60),
    imagen_url VARCHAR(255),
    orden_visual INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    beneficios TEXT,
    duracion_minutos INT NOT NULL DEFAULT 60,
    precio_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    imagen_url VARCHAR(255),
    admite_paquetes BOOLEAN NOT NULL DEFAULT 0,
    orden_visual INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT 1,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_servicios_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_servicios(id),
    INDEX idx_servicios_activo (activo),
    INDEX idx_servicios_categoria (categoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    precio_sede DECIMAL(10,2) NULL,           -- NULL = usa precio_base
    duracion_minutos_sede INT NULL,          -- NULL = usa duracion_minutos base
    disponible BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT fk_ss_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_servicio_sucursal (servicio_id, sucursal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paquetes_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    numero_sesiones INT NOT NULL DEFAULT 4,
    precio_paquete DECIMAL(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT fk_paq_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paquetes_clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    paquete_servicio_id INT NOT NULL,
    sesiones_totales INT NOT NULL,
    sesiones_consumidas INT NOT NULL DEFAULT 0,
    saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pc_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_paquete FOREIGN KEY (paquete_servicio_id) REFERENCES paquetes_servicios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. PROMOCIONES GLOBALES (SIN ASIGNACIÓN A SUCURSAL)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_descuento VARCHAR(30) NOT NULL,      -- 'porcentaje', 'monto_fijo', 'precio_promocional'
    valor_descuento DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo_vigencia VARCHAR(30) NOT NULL DEFAULT 'fecha_reserva', -- 'fecha_reserva' o 'fecha_cita'
    condiciones TEXT,
    cupos_maximos INT NULL,
    cupos_usados INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255),
    estado VARCHAR(30) NOT NULL DEFAULT 'activa', -- 'activa', 'pausada', 'finalizada'
    creada_por INT NULL,
    modificada_por INT NULL,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_promo_creador FOREIGN KEY (creada_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_promo_modificador FOREIGN KEY (modificada_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_promo_fechas (fecha_inicio, fecha_fin),
    INDEX idx_promo_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promociones_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT NOT NULL,
    servicio_id INT NOT NULL,
    CONSTRAINT fk_ps_promo FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    UNIQUE KEY uq_promo_servicio (promocion_id, servicio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. CONTENIDO DEL INICIO (VERSÍCULOS Y PORTADA LIBRE)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS versiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referencia VARCHAR(80) NOT NULL,          -- e.g. 'Salmos 139:14'
    version VARCHAR(60) NOT NULL,            -- e.g. 'RVR1960 [PROVISIONAL]'
    texto TEXT NOT NULL,
    mensaje TEXT NOT NULL,                    -- Reflexión
    orden INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    es_provisional BOOLEAN NOT NULL DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portada_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imagen_url VARCHAR(255) NOT NULL,
    titulo VARCHAR(120),
    descripcion VARCHAR(255),
    orden INT NOT NULL DEFAULT 0,
    credito_licencia VARCHAR(255),
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. PRODUCTOS Y VENTAS (SOLO INVENTARIO DE VENTA)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'facial', -- 'facial' o 'corporal'
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    marca_id INT NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'facial', -- 'facial' o 'corporal'
    funcion TEXT,
    instrucciones_uso TEXT,
    precio_publicado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    imagen_url VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT 1,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_cat FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id),
    CONSTRAINT fk_prod_marca FOREIGN KEY (marca_id) REFERENCES marcas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    servicio_id INT NOT NULL,
    CONSTRAINT fk_propserv_prod FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_propserv_serv FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    UNIQUE KEY uq_prod_serv (producto_id, servicio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT 1,
    precio_sede DECIMAL(10,2) NULL,
    CONSTRAINT fk_prodsuc_prod FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_prodsuc_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_prod_suc (producto_id, sucursal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. INVENTARIO DE VENTA (POR SUCURSAL, SIN INSUMOS DE TRATAMIENTO)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS existencias_sucursal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    producto_id INT NOT NULL,
    stock_venta INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 2,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exist_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    CONSTRAINT fk_exist_prod FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_existencia_suc_prod (sucursal_id, producto_id),
    CONSTRAINT chk_stock_no_negativo CHECK (stock_venta >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    contacto VARCHAR(120),
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    numero_comprobante VARCHAR(60),
    fecha_compra DATE NOT NULL,
    total_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador', -- 'borrador', 'recibido', 'anulado'
    clave_idempotencia VARCHAR(100) UNIQUE,
    usuario_id INT NOT NULL,
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_prov FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT fk_compra_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_compra_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compra_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_vendible INT NOT NULL, -- Solo unidades para venta
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_cd_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_cd_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS traslados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_origen_id INT NOT NULL,
    sucursal_destino_id INT NOT NULL,
    fecha_traslado DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'completado',
    clave_idempotencia VARCHAR(100) UNIQUE,
    usuario_id INT NOT NULL,
    motivo TEXT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tras_origen FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id),
    CONSTRAINT fk_tras_destino FOREIGN KEY (sucursal_destino_id) REFERENCES sucursales(id),
    CONSTRAINT fk_tras_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS traslado_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    traslado_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT fk_td_traslado FOREIGN KEY (traslado_id) REFERENCES traslados(id) ON DELETE CASCADE,
    CONSTRAINT fk_td_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas_presenciales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    cliente_id INT NULL,
    fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_venta DECIMAL(10,2) NOT NULL,
    usuario_id INT NOT NULL,
    clave_idempotencia VARCHAR(100) UNIQUE,
    observaciones TEXT,
    CONSTRAINT fk_vp_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_vp_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_vp_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS venta_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_vd_venta FOREIGN KEY (venta_id) REFERENCES ventas_presenciales(id) ON DELETE CASCADE,
    CONSTRAINT fk_vd_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    producto_id INT NOT NULL,
    tipo VARCHAR(40) NOT NULL,                 -- 'entrada_compra', 'venta_presencial', 'traslado_salida', 'traslado_entrada', 'ajuste_merma', 'devolucion'
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    usuario_id INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    referencia_id INT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_mov_prod FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_mov_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. SOLICITUDES DE PRODUCTO (SIN COMPRA WEB)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS solicitudes_producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    sucursal_preferida_id INT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'recibida', -- 'recibida', 'en_revision', 'confirmada', 'lista_para_recoger', 'entregada', 'cancelada'
    observaciones TEXT,
    atendida_por INT NULL,
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT fk_sol_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sol_suc FOREIGN KEY (sucursal_preferida_id) REFERENCES sucursales(id),
    CONSTRAINT fk_sol_usr FOREIGN KEY (atendida_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_sol_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitud_producto_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_referencial DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_si_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes_producto(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_prod FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. PERSONAL (REGISTRO SENCILLO, SIN PUESTOS NI ACCESO PROFESIONAL)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS personal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    cargo VARCHAR(80) NOT NULL DEFAULT 'Personal del centro estético',
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personal_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personal_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    CONSTRAINT fk_psuc_pers FOREIGN KEY (personal_id) REFERENCES personal(id) ON DELETE CASCADE,
    CONSTRAINT fk_psuc_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    UNIQUE KEY uq_pers_suc (personal_id, sucursal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. RESERVAS (AGENDA POR SUCURSAL SIN PUESTOS + FRANJAS ÚNICAS)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva VARCHAR(30) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_minutos INT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'confirmada', 'cancelada_cliente', 'cancelada_sucursal', 'atendida', 'no_asistio'
    promocion_id INT NULL,
    precio_original DECIMAL(10,2) NOT NULL,
    precio_aplicado DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    motivo_cancelacion TEXT,
    cancelada_por INT NULL,
    fecha_cancelacion DATETIME NULL,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_res_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    CONSTRAINT fk_res_promo FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE SET NULL,
    CONSTRAINT fk_res_canc_usr FOREIGN KEY (cancelada_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_res_fecha_sucursal (sucursal_id, fecha),
    INDEX idx_res_estado (estado),
    INDEX idx_res_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reserva_franjas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    fecha DATE NOT NULL,
    franja_inicio TIME NOT NULL,              -- e.g. '09:00:00'
    reserva_id INT NOT NULL,
    CONSTRAINT fk_rf_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    CONSTRAINT fk_rf_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sucursal_fecha_franja (sucursal_id, fecha, franja_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historial_reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    usuario_id INT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    fecha_anterior DATE NULL,
    hora_anterior TIME NULL,
    fecha_nueva DATE NULL,
    hora_nueva TIME NULL,
    motivo VARCHAR(255),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. TRATAMIENTOS, HISTORIAL Y SEGUIMIENTOS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reglas_seguimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL UNIQUE,
    dias_proxima_sesion INT NOT NULL DEFAULT 21,
    mensaje_sugerido TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT fk_rs_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historial_tratamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    servicio_id INT NOT NULL,
    reserva_id INT NULL,
    paquete_cliente_id INT NULL,
    personal_id INT NULL,
    usuario_id INT NOT NULL,                  -- Usuario administrativo que registró
    fecha_atencion DATE NOT NULL,
    observaciones TEXT,
    proxima_sesion_sugerida DATE NULL,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ht_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ht_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_ht_serv FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    CONSTRAINT fk_ht_res FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE SET NULL,
    CONSTRAINT fk_ht_paq FOREIGN KEY (paquete_cliente_id) REFERENCES paquetes_clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_ht_pers FOREIGN KEY (personal_id) REFERENCES personal(id) ON DELETE SET NULL,
    CONSTRAINT fk_ht_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seguimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    historial_tratamiento_id INT NULL,
    fecha_programada DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'contactado', 'agendado', 'descartado'
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seg_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_seg_serv FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    CONSTRAINT fk_seg_ht FOREIGN KEY (historial_tratamiento_id) REFERENCES historial_tratamientos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. PAGOS PRESENCIALES, ABONOS Y CUOTAS (REGISTRO ADMINISTRATIVO)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    cliente_id INT NOT NULL,
    reserva_id INT NULL,
    servicio_id INT NULL,
    paquete_cliente_id INT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) NOT NULL DEFAULT 'completado', -- 'completado', 'parcial', 'anulado'
    clave_idempotencia VARCHAR(100) UNIQUE,
    usuario_id INT NOT NULL,
    observaciones TEXT,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT fk_pag_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    CONSTRAINT fk_pag_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pag_res FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE SET NULL,
    CONSTRAINT fk_pag_serv FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL,
    CONSTRAINT fk_pag_paq FOREIGN KEY (paquete_cliente_id) REFERENCES paquetes_clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_pag_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cuotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    numero_cuota INT NOT NULL,
    monto_cuota DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'vencido'
    CONSTRAINT fk_cuota_pago FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS abonos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    monto_abono DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'transferencia_manual', 'qr_manual'
    clave_idempotencia VARCHAR(100) UNIQUE,
    usuario_id INT NOT NULL,
    nota TEXT,
    es_reverso BOOLEAN NOT NULL DEFAULT 0,
    fecha_abono DATETIME DEFAULT CURRENT_TIMESTAMP,
    es_demo BOOLEAN NOT NULL DEFAULT 0,
    CONSTRAINT fk_abono_pago FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
    CONSTRAINT fk_abono_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. NOTIFICACIONES Y EVENTOS OUTBOX
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT NULL,
    reserva_id INT NULL,
    tipo VARCHAR(50) NOT NULL,                -- 'NUEVA_RESERVA', 'RESERVA_CONFIRMADA', 'RESERVA_CANCELADA'
    titulo VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    INDEX idx_notif_usr_leida (usuario_id, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL UNIQUE,
    notificar_nueva_reserva BOOLEAN NOT NULL DEFAULT 1,
    notificar_cancelacion BOOLEAN NOT NULL DEFAULT 1,
    notificar_modificacion BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT fk_confnotif_suc FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS outbox_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento VARCHAR(80) NOT NULL,
    payload_json TEXT NOT NULL,
    canal_destino VARCHAR(40) NOT NULL,       -- 'n8n_webhook', 'meta_whatsapp', 'email'
    reintentos INT NOT NULL DEFAULT 0,
    procesado BOOLEAN NOT NULL DEFAULT 0,
    error_ultimo TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    procesado_en DATETIME NULL,
    INDEX idx_outbox_pendientes (procesado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. CHATBOT Y AUDITORÍA DEL SISTEMA
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversaciones_chatbot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sesion_id VARCHAR(100) NOT NULL,
    usuario_id INT NULL,
    rol VARCHAR(30) NOT NULL,                 -- 'user', 'assistant', 'system'
    mensaje TEXT NOT NULL,
    herramientas_usadas TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_chat_sesion (sesion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    accion VARCHAR(80) NOT NULL,              -- 'CREACION_RESERVA', 'CANCELACION_RESERVA', 'CAMBIO_PRECIO'
    modulo VARCHAR(60) NOT NULL,              -- 'RESERVAS', 'INVENTARIO', 'PAGOS', 'PROMOCIONES', 'USUARIOS'
    sucursal_id INT NULL,
    registro_id INT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    motivo VARCHAR(255),
    ip_origen VARCHAR(45),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aud_usr FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_auditoria_modulo (modulo, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- CARGA DE DATOS INICIALES REALES Y ESTRUCTURALES
-- ---------------------------------------------------------------------

-- Roles oficiales
INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
(1, 'ADMIN_GENERAL', 'Administrador General', 'Acceso total a las cuatro sucursales y a toda la configuración'),
(2, 'ENCARGADO', 'Encargado de Sucursal', 'Acceso restringido únicamente a su(s) sucursal(es) asignada(s)'),
(3, 'CLIENTE', 'Cliente', 'Acceso personal exclusivo a reservas, solicitudes e historial propio')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Configuración General (WhatsApp Central Oficial)
INSERT INTO configuracion_general (clave, valor, descripcion) VALUES
('whatsapp_central', '+59162353452', 'Número de WhatsApp central único oficial para las 4 sucursales'),
('whatsapp_central_local', '62353452', 'Formato local de WhatsApp central'),
('zona_horaria', 'America/La_Paz', 'Zona horaria del sistema'),
('moneda_oficial', 'Bs', 'Moneda oficial mostrada en toda la plataforma')
ON DUPLICATE KEY UPDATE valor=VALUES(valor);

-- 4 Sucursales Oficiales (Nombres y Municipios exactos)
INSERT INTO sucursales (id, codigo, nombre, municipio, departamento, direccion, referencia, estado, es_demo) VALUES
(1, 'VILLA_FATIMA', 'Villa Fátima', 'La Paz', 'La Paz', 'Zona Villa Fátima, avenida principal (referencial)', 'Cerca de una parada de transporte público', 'activo', 1),
(2, 'UPEA_EL_ALTO', 'UPEA – El Alto', 'El Alto', 'La Paz', 'Zona UPEA, avenida principal (referencial)', 'Zona universitaria', 'activo', 1),
(3, 'CEJA_EL_ALTO', 'Ceja – El Alto', 'El Alto', 'La Paz', 'Zona Ceja, avenida principal (referencial)', 'Sector comercial de la Ceja', 'activo', 1),
(4, 'MAX_PAREDES', 'Max Paredes', 'La Paz', 'La Paz', 'Zona Max Paredes, avenida principal (referencial)', 'Sector comercial de Max Paredes', 'activo', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), municipio=VALUES(municipio);

-- Horarios Base (Lunes a Sábado 08:30 a 19:30, Domingos Cerrado)
INSERT INTO horarios_sucursales (sucursal_id, dia_semana, abierto, hora_apertura, hora_cierre)
SELECT s.id, d.dia, CASE WHEN d.dia = 7 THEN 0 ELSE 1 END, '08:30:00', '19:30:00'
FROM sucursales s
CROSS JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) d
ON DUPLICATE KEY UPDATE abierto=VALUES(abierto);

-- Configuración de reservas por sucursal (Intervalo 30m, 1 cita por franja)
INSERT INTO configuracion_reservas_sucursal (sucursal_id, intervalo_minutos, anticipacion_minima_horas, anticipacion_maxima_dias, limite_cancelacion_horas, franjas_simultaneas_permitidas)
SELECT id, 30, 2, 30, 4, 1 FROM sucursales
ON DUPLICATE KEY UPDATE intervalo_minutos=30;

-- 7 Categorías Oficiales de Servicios
INSERT INTO categorias_servicios (id, codigo, nombre, descripcion, imagen_url, orden_visual, activo) VALUES
(1, 'TRATAMIENTOS_FACIALES', 'Tratamientos faciales', 'Cuidado y limpieza dérmica orientada a mejorar la apariencia y luminosidad de la piel.', '/cat_facial.png', 1, 1),
(2, 'BANO_DE_LUNA', 'Baño de Luna', 'Exfoliación, luminosidad y cuidado integral de la piel corporal.', '/cat_luna.png', 2, 1),
(3, 'CUIDADO_CORPORAL', 'Cuidado corporal', 'Tratamientos y envolturas corporales para tersura, firmeza e hidratación dérmica.', '/cat_corporal.png', 3, 1),
(4, 'MASAJES_CORPORALES', 'Masajes corporales', 'Técnicas de relajación muscular y bienestar corporal en ambiente de descanso.', '/cat_masajes.png', 4, 1),
(5, 'DEPILACION_FACIAL_CORPORAL', 'Depilación facial y corporal', 'Depilación cosmética dermo-suave para zonas faciales y corporales.', '/cat_depilacion.png', 5, 1),
(6, 'LIFTING_PESTANAS', 'Lifting de pestañas', 'Realce cosmético y curvatura natural de pestañas con productos delicados.', '/cat_pestanas.png', 6, 1),
(7, 'PERFILADO_CEJAS', 'Perfilado de cejas', 'Diseño armónico y perfilado de cejas realizado por personal del centro.', '/cat_cejas.png', 7, 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), imagen_url=VALUES(imagen_url);

-- Versículos Bíblicos del Módulo 08 (Texto provisional verificado RVR1960)
INSERT INTO versiculos (id, referencia, version, texto, mensaje, orden, estado, es_provisional) VALUES
(1, 'Salmos 139:14', 'RVR1960 [PROVISIONAL]', 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.', 'Cada persona es una creación maravillosa y tiene un valor único ante Dios.', 1, 'activo', 1),
(2, '1 Samuel 16:7', 'RVR1960 [PROVISIONAL]', '…porque Jehová no mira lo que mira el hombre; pues el hombre mira lo que está delante de sus ojos, pero Jehová mira el corazón.', 'La belleza interior tiene un valor que va más allá de la apariencia física.', 2, 'activo', 1),
(3, '1 Corintios 6:19', 'RVR1960 [PROVISIONAL]', '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros?', 'Cuidar nuestro cuerpo también es valorar la vida que hemos recibido con gratitud.', 3, 'activo', 1),
(4, 'Proverbios 31:30', 'RVR1960 [PROVISIONAL]', 'Engañosa es la gracia, y vana la hermosura; la mujer que teme a Jehová, ésa será alabada.', 'La verdadera belleza también está relacionada con el carácter, la fe y los valores.', 4, 'activo', 1)
ON DUPLICATE KEY UPDATE texto=VALUES(texto);
