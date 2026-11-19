-- =====================================================================
-- MIGRACIÓN 001: SISTEMA WEB INTEGRAL HERMOSA TALITA KUMI
-- Compatible con PostgreSQL y MySQL 8.0
-- Moneda: Bolivianos (BOB, Bs.) | Zona Horaria: America/La_Paz
-- =====================================================================

-- 1. SUCURSALES (3 Sedes Centralizadas)
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(80) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(120),
    opening_hours VARCHAR(150) DEFAULT 'Lunes a Sábado: 08:30 - 19:30',
    open_time VARCHAR(10) DEFAULT '08:30',
    close_time VARCHAR(10) DEFAULT '19:30',
    sunday_open BOOLEAN DEFAULT 0,
    google_maps_url TEXT,
    map_embed_url TEXT,
    image VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_branch_city (city),
    INDEX idx_branch_active (active)
);

CREATE TABLE IF NOT EXISTS branch_exceptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT 1,
    open_time VARCHAR(10) NULL,
    close_time VARCHAR(10) NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exception_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_exception_branch_date (branch_id, date)
);

-- 2. CATEGORÍAS DE SERVICIOS
CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATÁLOGO DE TRATAMIENTOS (40 Tratamientos Oficiales)
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NULL,
    category_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL COMMENT 'Precio en Bolivianos (BOB)',
    duration INT NOT NULL COMMENT 'Duración en minutos',
    type ENUM('FACIAL', 'CORPORAL', 'LUNA', 'MASAJE') NOT NULL,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_category (category_code),
    INDEX idx_service_type (type),
    INDEX idx_service_status (status)
);

CREATE TABLE IF NOT EXISTS branch_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    service_id INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bs_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY uk_branch_service (branch_id, service_id)
);

-- 4. USUARIOS Y CLIENTES (Control de Roles y Ficha Clínica)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('CLIENTE', 'ENCARGADO', 'ADMINISTRADOR') NOT NULL DEFAULT 'CLIENTE',
    phone VARCHAR(40),
    avatar VARCHAR(255),
    branch_id INT NULL COMMENT 'Sucursal asignada si es Encargado',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    preferred_branch_id INT NULL,
    birth_date DATE,
    gender VARCHAR(30) DEFAULT 'No especificado',
    emergency_contact VARCHAR(120),
    emergency_phone VARCHAR(40),
    skin_type VARCHAR(60) DEFAULT 'Normal/Mixta',
    medical_notes TEXT,
    allergies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_branch FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- 5. PERSONAL Y HORARIOS
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    branch_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(80) NOT NULL DEFAULT 'Terapeuta Estética',
    phone VARCHAR(40),
    email VARCHAR(120),
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS staff_services (
    staff_id INT NOT NULL,
    service_id INT NOT NULL,
    PRIMARY KEY (staff_id, service_id),
    CONSTRAINT fk_ss_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    day_of_week INT NOT NULL COMMENT '1: Lun, 6: Sab',
    start_time VARCHAR(10) NOT NULL DEFAULT '08:30',
    end_time VARCHAR(10) NOT NULL DEFAULT '19:30',
    break_start VARCHAR(10) NULL,
    break_end VARCHAR(10) NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT fk_schedule_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- 6. PRODUCTOS E INVENTARIO POR SUCURSAL
CREATE TABLE IF NOT EXISTS beauty_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    function_desc TEXT,
    type ENUM('FACIAL', 'CORPORAL') NOT NULL DEFAULT 'FACIAL',
    related_treatment VARCHAR(150),
    usage_instructions TEXT,
    frequency VARCHAR(100),
    unit VARCHAR(30) DEFAULT 'Unidad',
    price DECIMAL(10, 2) DEFAULT 0.00,
    image VARCHAR(255),
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_type (type),
    INDEX idx_product_status (status)
);

CREATE TABLE IF NOT EXISTS branch_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    last_restocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES beauty_products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_branch_product (branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    movement_type ENUM('ENTRADA', 'CONSUMO_TRATAMIENTO', 'AJUSTE', 'PERDIDA', 'VENCIDO') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    appointment_id INT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_mov_product FOREIGN KEY (product_id) REFERENCES beauty_products(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS treatment_consumption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_per_session INT NOT NULL DEFAULT 1,
    unit VARCHAR(30) DEFAULT 'Dosis',
    CONSTRAINT fk_tc_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_product FOREIGN KEY (product_id) REFERENCES beauty_products(id) ON DELETE CASCADE
);

-- 7. RESERVAS, CALENDARIO Y LISTA DE ESPERA
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    staff_id INT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status ENUM('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO') NOT NULL DEFAULT 'PENDIENTE',
    payment_status ENUM('PENDIENTE', 'PARCIAL', 'PAGADO') NOT NULL DEFAULT 'PENDIENTE',
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_appointment_branch_datetime (branch_id, date, time),
    INDEX idx_appointment_status (status)
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(40) NOT NULL,
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_range VARCHAR(80),
    status ENUM('PENDIENTE', 'NOTIFICADO', 'AGENDADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wl_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 8. NOTIFICACIONES Y ALERTAS SONORAS
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NULL,
    branch_id INT NULL,
    appointment_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'RESERVA',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    INDEX idx_notif_client (client_id, is_read)
);

-- 9. HISTORIAL DE TRATAMIENTOS Y REGLAS DE SEGUIMIENTO
CREATE TABLE IF NOT EXISTS treatment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treatment_name VARCHAR(150) NOT NULL,
    treatment_type VARCHAR(50) NOT NULL,
    recommended_interval INT NOT NULL COMMENT 'Intervalo en días',
    interval_unit VARCHAR(20) DEFAULT 'DIAS',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    appointment_id INT NULL,
    branch_id INT NOT NULL,
    treatment_name VARCHAR(150) NOT NULL,
    treatment_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    observations TEXT,
    professional VARCHAR(120) NOT NULL,
    suggested_next_session DATE,
    status VARCHAR(60) NOT NULL DEFAULT 'COMPLETADO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

-- 10. MÓDULO FINANCIERO Y CAJA
CREATE TABLE IF NOT EXISTS cash_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    opened_by INT NOT NULL,
    closed_by INT NULL,
    opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    closing_amount DECIMAL(10, 2) NULL,
    system_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    notes TEXT,
    CONSTRAINT fk_cash_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    branch_id INT NOT NULL,
    appointment_id INT NULL,
    cash_session_id INT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL,
    payment_method ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR_SIMPLE', 'OTRO') NOT NULL DEFAULT 'EFECTIVO',
    status ENUM('PENDIENTE', 'PARCIAL', 'PAGADO') NOT NULL DEFAULT 'PENDIENTE',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    cash_session_id INT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    registered_by VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);

-- 11. CONVERSACIONES DEL CHATBOT Y N8N
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(40),
    branch_id INT NULL,
    channel VARCHAR(30) DEFAULT 'WEB',
    status ENUM('ACTIVA', 'CERRADA', 'TRANSFERIDA_HUMANO') NOT NULL DEFAULT 'ACTIVA',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender ENUM('CLIENTE', 'ASISTENTE_IA', 'PERSONAL') NOT NULL,
    message_text TEXT NOT NULL,
    tool_used VARCHAR(80) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_conv FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);
