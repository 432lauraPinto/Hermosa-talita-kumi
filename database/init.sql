-- =====================================================================
-- INIT SCRIPT PARA MYSQL EN DOCKER (docker-entrypoint-initdb.d)
-- CENTRO ESTÉTICO CRISTIANO HERMOSA TALITA KUMI
-- =====================================================================

CREATE DATABASE IF NOT EXISTS estetica_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estetica_db;

-- 1. TABLAS
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('CLIENTE', 'ADMINISTRADOR') NOT NULL DEFAULT 'CLIENTE',
    phone VARCHAR(40),
    avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(80) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL COMMENT 'Duración en minutos',
    type ENUM('FACIAL', 'CORPORAL') NOT NULL,
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_type (type),
    INDEX idx_service_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branch_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    service_id INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bs_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY uk_branch_service (branch_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS treatment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treatment_name VARCHAR(150) NOT NULL,
    treatment_type ENUM('FACIAL', 'CORPORAL') NOT NULL,
    recommended_interval INT NOT NULL COMMENT 'Número de días/semanas/meses',
    interval_unit ENUM('DIAS', 'SEMANAS', 'MESES') NOT NULL DEFAULT 'DIAS',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rule_name (treatment_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NULL,
    status ENUM('PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    INDEX idx_appointment_branch_datetime (branch_id, date, time),
    INDEX idx_appointment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    appointment_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'RESERVA',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_notif_client (client_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS treatments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NULL,
    name VARCHAR(150) NOT NULL,
    type ENUM('FACIAL', 'CORPORAL') NOT NULL,
    protocol TEXT,
    contraindications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_treatments_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS treatment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    appointment_id INT NULL,
    branch_id INT NOT NULL,
    treatment_name VARCHAR(150) NOT NULL,
    treatment_type ENUM('FACIAL', 'CORPORAL') NOT NULL,
    date DATE NOT NULL,
    observations TEXT,
    professional VARCHAR(120) NOT NULL,
    suggested_next_session DATE,
    status VARCHAR(60) NOT NULL DEFAULT 'COMPLETADO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_history_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    INDEX idx_history_client_date (client_id, date),
    INDEX idx_history_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beauty_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    related_treatment VARCHAR(150),
    usage_instructions TEXT,
    frequency VARCHAR(100),
    status ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    price DECIMAL(10, 2) DEFAULT 0.00,
    image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    product_id INT NOT NULL,
    start_date DATE NOT NULL,
    usage_frequency VARCHAR(100) NOT NULL,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_product_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_product_product FOREIGN KEY (product_id) REFERENCES beauty_products(id) ON DELETE RESTRICT,
    INDEX idx_client_product (client_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    branch_id INT NOT NULL,
    appointment_id INT NULL,
    treatment_history_id INT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL,
    payment_method ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR_SIMPLE', 'OTRO') NOT NULL DEFAULT 'EFECTIVO',
    status ENUM('PENDIENTE', 'PARCIAL', 'PAGADO') NOT NULL DEFAULT 'PENDIENTE',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_history FOREIGN KEY (treatment_history_id) REFERENCES treatment_history(id) ON DELETE SET NULL,
    INDEX idx_payment_client (client_id),
    INDEX idx_payment_branch (branch_id),
    INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SEED DATA
INSERT IGNORE INTO branches (id, code, name, city, zone, address, phone, whatsapp, email, opening_hours, google_maps_url, map_embed_url, image, active) VALUES
(1, 'LPZ-01', 'Sede La Paz 1 — Sopocachi (Central)', 'La Paz', 'Sopocachi / San Jorge', 
 'Av. 20 de Octubre #2140 esq. Guachalla, Edificio El Prado Real, Mezzanine 1', 
 '+591 2 2441122', '+591 70123456', 'sopocachi@hermosatalitakumi.com', 
 'Lunes a Sábado: 08:30 - 19:30', 
 'https://maps.google.com/?q=-16.5085,-68.1287', 
 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.4418654165683!2d-68.1308889!3d-16.5085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915edf0a1c7c9e0d%3A0x6b8764a85c8e3124!2sAv.+20+de+Octubre%2C+La+Paz!5e0!3m2!1ses!2sbo!4v1700000000000!5m2!1ses!2sbo', 
 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600', 1),

(2, 'LPZ-02', 'Sede La Paz 2 — Calacoto (Zona Sur)', 'La Paz', 'Calacoto / San Miguel', 
 'Calle 15 de Calacoto esq. Av. Ballivián #8050, Torre Empresarial Cesur, Piso 2', 
 '+591 2 2773344', '+591 70123457', 'calacoto@hermosatalitakumi.com', 
 'Lunes a Sábado: 09:00 - 20:00', 
 'https://maps.google.com/?q=-16.5412,-68.0845', 
 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.7891234567!2d-68.0867!3d-16.5412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915f20f012345678%3A0xabcdef1234567890!2sCalacoto%20Calle%2015%2C+La+Paz!5e0!3m2!1ses!2sbo!4v1700000000001!5m2!1ses!2sbo', 
 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', 1),

(3, 'CBB-01', 'Sede Cochabamba — América (Zona Norte)', 'Cochabamba', 'Recoleta / América Este', 
 'Av. América Este #845 entre Pando y Melchor Urquidi, Torre Barcelona, Mezzanine', 
 '+591 4 4455566', '+591 70123458', 'cochabamba@hermosatalitakumi.com', 
 'Lunes a Sábado: 08:30 - 19:00', 
 'https://maps.google.com/?q=-17.3756,-66.1524', 
 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.5612345678!2d-66.1546!3d-17.3756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e374abcdef1234%3A0x567890abcdef1234!2sAv.+Am%C3%A9rica+Este%2C+Cochabamba!5e0!3m2!1ses!2sbo!4v1700000000002!5m2!1ses!2sbo', 
 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600', 1);

INSERT IGNORE INTO users (id, name, email, password, role, phone, avatar) VALUES
(1, 'Dra. Valeria Montes (Directora General)', 'admin@auraestetica.com', '$2a$10$1xKFnOg6c8tsPcQo/DqsGuksmKgp5Bl9ZdglzW5sh21uKvQ5wdUpe', 'ADMINISTRADOR', '+591 70011223', 'https://images.unsplash.com/photo-1594824813588-e8cb9b7dcaaa?w=300'),
(2, 'María González (Cliente)', 'maria.gonzalez@example.com', '$2a$10$4fkaZ9Zh2FSlDbh0hFSYW.am72gz9A4BZAIw.hIIOp7mKWzkiJZGK', 'CLIENTE', '+591 71122334', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'),
(3, 'Sofía Martínez (Cliente)', 'sofia.martinez@example.com', '$2a$10$4fkaZ9Zh2FSlDbh0hFSYW.am72gz9A4BZAIw.hIIOp7mKWzkiJZGK', 'CLIENTE', '+591 72233445', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300');

INSERT IGNORE INTO clients (id, user_id, preferred_branch_id, birth_date, gender, emergency_contact, emergency_phone, skin_type, medical_notes, allergies) VALUES
(1, 2, 1, '1994-05-14', 'Femenino', 'Carlos González (Hermano)', '+591 78899001', 'Mixta a grasa con tendencia a poros dilatados', 'Sin antecedentes de riesgo. Buena tolerancia dérmica.', 'Ninguna conocida'),
(2, 3, 3, '1990-11-20', 'Femenino', 'Andrea Suárez (Amiga)', '+591 76655443', 'Sensible / Seca', 'Tendencia a rojeces leves.', 'Sensibilidad a fragancias intensas');

INSERT IGNORE INTO services (id, name, description, category, price, duration, type, status, image) VALUES
(1, 'Limpieza Facial Profunda con Espátula Ultrasónica', 'Higiene dérmica intensiva con extracción de comedones, desincrustación con ultrasonido, mascarilla descongestiva y alta frecuencia.', 'Facial Purificante', 180.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),
(2, 'Hidrafacial Glow & Detox', 'Tecnología de hidrodermoabrasión que limpia, exfolia, extrae e hidrata simultáneamente con infusión de sueros antioxidantes.', 'Facial Hidratante', 250.00, 75, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),
(3, 'Peeling Químico Renovador Talita Kumi', 'Exfoliación química controlada con ácido mandélico y glicólico para mejorar textura, manchas solares y líneas finas.', 'Facial Renovador', 220.00, 45, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),
(4, 'Radiofrecuencia Facial Lifting', 'Estímulo de colágeno y elastina mediante calor electromagnético para tensar óvalo facial y atenuar flacidez.', 'Facial Reafirmante', 200.00, 50, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
(5, 'Drenaje Linfático Manual Corporal', 'Técnica suave de bombeo ganglionar para desinflamar, reducir retención de líquidos y eliminar toxinas cotidianas.', 'Corporal Reductor', 190.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
(6, 'Masaje Reductor & Moldeador Abdominal', 'Maniobras enérgicas y termogénicas focalizadas en zona abdominal y flancos para moldear figura y reactivar circulación.', 'Corporal Moldeador', 210.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
(7, 'Maderoterapia Reafirmante Integral', 'Terapia holística con piezas anatómicas de madera noble para reducir adiposidad localizada y tonificar tejidos.', 'Corporal Tonificante', 230.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
(8, 'Exfoliación e Hidratación Corporal Velvety', 'Renovación de células muertas con sales minerales aromáticas y envoltura nutritiva de karité.', 'Corporal Relajante', 170.00, 50, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600');

INSERT IGNORE INTO branch_services (branch_id, service_id, active) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1), (1, 5, 1), (1, 6, 1), (1, 7, 1), (1, 8, 1),
(2, 1, 1), (2, 2, 1), (2, 3, 1), (2, 4, 1), (2, 5, 1), (2, 8, 1),
(3, 1, 1), (3, 2, 1), (3, 4, 1), (3, 5, 1), (3, 6, 1), (3, 7, 1), (3, 8, 1);

INSERT IGNORE INTO treatment_rules (id, treatment_name, treatment_type, recommended_interval, interval_unit, description, active) VALUES
(1, 'Limpieza Facial Profunda con Espátula Ultrasónica', 'FACIAL', 15, 'DIAS', 'Recomendado cada 15 a 21 días para mantener poros limpios y regular secreción sebácea.', 1),
(2, 'Hidrafacial Glow & Detox', 'FACIAL', 21, 'DIAS', 'Recomendado cada 3 semanas para sostener la barrera lipídica y luminosidad óptima.', 1),
(3, 'Peeling Químico Renovador Talita Kumi', 'FACIAL', 30, 'DIAS', 'Requiere intervalo de 30 días para completar el ciclo de regeneración celular dérmica.', 1),
(4, 'Radiofrecuencia Facial Lifting', 'FACIAL', 10, 'DIAS', 'Protocolo intensivo cada 10 a 14 días para síntesis continua de colágeno.', 1),
(5, 'Drenaje Linfático Manual Corporal', 'CORPORAL', 7, 'DIAS', 'Sesiones semanales recomendadas para control de retención de líquidos y edemas.', 1),
(6, 'Masaje Reductor & Moldeador Abdominal', 'CORPORAL', 5, 'DIAS', 'Recomendado cada 5 días durante el protocolo de 8 a 10 sesiones consecutivas.', 1),
(7, 'Maderoterapia Reafirmante Integral', 'CORPORAL', 7, 'DIAS', 'Recomendado cada 7 días para moldear tejidos sin sobrecargar la musculatura.', 1),
(8, 'Exfoliación e Hidratación Corporal Velvety', 'CORPORAL', 28, 'DIAS', 'Renovación cutánea recomendada mensualmente con cambio de ciclo epidérmico.', 1);

INSERT IGNORE INTO beauty_products (id, name, brand, category, description, related_treatment, usage_instructions, frequency, status, price, image) VALUES
(1, 'Sérum Ácido Hialurónico Puro 2% + B5 Talita Kumi', 'Talita Kumi Dermo', 'Hidratación Facial', 'Concentrado para restaurar volumen y retener humedad.', 'Limpieza Facial Profunda con Espátula Ultrasónica', 'Aplicar 4 gotas sobre el rostro limpio dando toques suaves antes de la crema.', 'Mañana y Noche diariamente', 'ACTIVO', 135.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'),
(2, 'Protector Solar FPS 50+ Invisible Touch', 'Dermashield Pro', 'Fotoprotección', 'Fluido ultra ligero con filtros minerales y toque seco. No comedogénico.', 'Peeling Químico Renovador Talita Kumi', 'Aplicar generosamente antes de la exposición solar y reaplicar cada 3 a 4 horas.', 'Cada 3-4 horas en el día', 'ACTIVO', 150.00, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'),
(3, 'Crema Regeneradora Calmante Cera-Repair', 'Talita Kumi Care', 'Nutrición Facial', 'Triple ceramidas y niacinamida para calmar rojeces y sellar hidratación.', 'Hidrafacial Glow & Detox', 'Distribuir una pequeña cantidad sobre rostro y cuello con movimientos ascendentes.', 'Noche antes de dormir', 'ACTIVO', 140.00, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'),
(4, 'Gel Criogénico Reductor con Centella Asiática', 'Silhouette Pro', 'Corporal Modelador', 'Efecto frío tonificante para favorecer la microcirculación y firmeza tisular.', 'Masaje Reductor & Moldeador Abdominal', 'Aplicar con masaje circular ascendente hasta total absorción en abdomen y caderas.', 'Diario por las mañanas', 'ACTIVO', 160.00, 'https://images.unsplash.com/photo-1608248597359-00e9ec02bc56?w=400'),
(5, 'Aceite Corporal Reafirmante Almendras & Café', 'Lumina Oil Therapy', 'Corporal Nutritivo', 'Aceite prensado en frío antioxidante para nutrir la piel y potenciar la firmeza.', 'Maderoterapia Reafirmante Integral', 'Masajear sobre piel húmeda tras la ducha con movimientos firmes hacia el corazón.', '3 veces por semana', 'ACTIVO', 125.00, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400');

INSERT IGNORE INTO client_products (id, client_id, product_id, start_date, usage_frequency, observations) VALUES
(1, 1, 1, '2026-09-20', 'Mañana y noche diariamente', 'Indicado tras limpieza facial profunda en Sede Sopocachi para barrera dérmica.'),
(2, 1, 2, '2026-09-20', 'Cada 3-4 horas en el día', 'Obligatorio para fotoprotección continua.');

INSERT IGNORE INTO appointments (id, client_id, service_id, branch_id, date, time, status, observations) VALUES
(1, 1, 1, 1, '2026-09-20', '10:00', 'REALIZADA', 'Sesión inaugural en Sede La Paz 1 (Sopocachi).'),
(2, 1, 1, 1, '2026-10-15', '16:00', 'CONFIRMADA', 'Seguimiento programado en Sede La Paz 1.'),
(3, 2, 2, 3, '2026-10-18', '11:00', 'PENDIENTE', 'Consulta en Sede Cochabamba América para hidratación facial.');

INSERT IGNORE INTO treatment_history (id, client_id, appointment_id, branch_id, treatment_name, treatment_type, date, observations, professional, suggested_next_session, status) VALUES
(1, 1, 1, 1, 'Limpieza Facial Profunda con Espátula Ultrasónica', 'FACIAL', '2026-09-20', 'Extracción exitosa en zona T. Mascarilla descongestiva aplicada en Sede Sopocachi.', 'Dra. Valeria Montes', '2026-10-05', 'COMPLETADO');

INSERT IGNORE INTO payments (id, client_id, branch_id, appointment_id, treatment_history_id, total_amount, paid_amount, pending_balance, payment_date, payment_method, status, notes) VALUES
(1, 1, 1, 1, 1, 180.00, 180.00, 0.00, '2026-09-20', 'TARJETA', 'PAGADO', 'Pago completo en Sede La Paz Sopocachi.'),
(2, 1, 1, 2, NULL, 180.00, 50.00, 130.00, '2026-10-02', 'QR_SIMPLE', 'PARCIAL', 'Seña mediante QR Simple para reserva en Sede Sopocachi.');
