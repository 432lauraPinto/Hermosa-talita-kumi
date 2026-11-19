const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let pool = null;
let sqliteDb = null;
let currentEngine = 'UNKNOWN';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'estetica_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'estetica_pass_2026';
const DB_NAME = process.env.DB_NAME || 'estetica_db';

const SQLITE_DIR = path.join(__dirname, '../../data');
const SQLITE_FILE = path.join(SQLITE_DIR, 'estetica.sqlite');

function saveSqliteToDisk() {
  if (sqliteDb) {
    try {
      if (!fs.existsSync(SQLITE_DIR)) {
        fs.mkdirSync(SQLITE_DIR, { recursive: true });
      }
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(SQLITE_FILE, buffer);
    } catch (err) {
      console.error('[DB-Fallback] Error al guardar datos en disco:', err.message);
    }
  }
}

async function initSqliteFallback() {
  console.log('[DB] Inicializando motor SQLite para HERMOSA TALITA KUMI...');
  const SQL = await initSqlJs();
  if (!fs.existsSync(SQLITE_DIR)) {
    fs.mkdirSync(SQLITE_DIR, { recursive: true });
  }

  let db = new SQL.Database();

  const sqliteSchema = `
    -- 1. SUCURSALES (4 Sedes Oficiales)
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      zone TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT NOT NULL,
      email TEXT,
      opening_hours TEXT DEFAULT 'Lunes a Sábado: 08:30 - 19:30',
      open_time TEXT DEFAULT '08:30',
      close_time TEXT DEFAULT '19:30',
      sunday_open INTEGER DEFAULT 0,
      google_maps_url TEXT,
      map_embed_url TEXT,
      image TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branch_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      is_closed INTEGER NOT NULL DEFAULT 1,
      open_time TEXT,
      close_time TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    -- Agenda por sucursal sin puestos ni camillas: franjas únicas
    CREATE TABLE IF NOT EXISTS appointment_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      appointment_id INTEGER NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      UNIQUE(branch_id, date, slot_time)
    );

    -- 2. USUARIOS Y ROLES (ADMIN_GENERAL, ENCARGADO, CLIENTE)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENTE',
      assigned_branch_id INTEGER,
      phone TEXT,
      avatar TEXT,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      backup_codes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      preferred_branch_id INTEGER,
      birth_date TEXT,
      gender TEXT DEFAULT 'Femenino',
      emergency_contact TEXT,
      emergency_phone TEXT,
      skin_type TEXT DEFAULT 'Normal/Mixta',
      medical_notes TEXT,
      allergies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (preferred_branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    -- 3. CATEGORÍAS Y SERVICIOS (7 Categorías)
    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      category_code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      cosmetic_benefits TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVO',
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS branch_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE(branch_id, service_id)
    );

    -- 4. PROMOCIONES (Globales para todo el centro - Módulo 12)
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      service_id INTEGER,
      regular_price REAL NOT NULL,
      promo_price REAL NOT NULL,
      discount_percent INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      badge TEXT DEFAULT 'OFERTA ESPECIAL',
      image TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. VERSÍCULOS BÍBLICOS Y CONTENIDO
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT NOT NULL,
      version TEXT DEFAULT 'RVR1960',
      text TEXT NOT NULL,
      reflection TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1
    );

    -- 6. CITAS, RESERVAS Y BLOQUEOS
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT UNIQUE,
      client_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL DEFAULT 1,
      station_id INTEGER,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      end_time TEXT,
      duration INTEGER DEFAULT 60,
      total_price REAL DEFAULT 0.00,
      status TEXT NOT NULL DEFAULT 'CONFIRMADA',
      client_name TEXT,
      client_phone TEXT,
      client_email TEXT,
      observations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS appointment_holds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      session_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL
    );

    -- 7. NOTIFICACIONES
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      client_id INTEGER,
      appointment_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'RESERVA',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    -- 8. PRODUCTOS E INVENTARIO POR SUCURSAL
    CREATE TABLE IF NOT EXISTS beauty_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT DEFAULT 'FACIAL',
      description TEXT,
      usage_instructions TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVO',
      price REAL DEFAULT 0.00,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branch_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      min_stock INTEGER NOT NULL DEFAULT 3,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (product_id) REFERENCES beauty_products(id),
      UNIQUE(branch_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      movement_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Solicitudes de productos (sin cobro web, coordinadas presencialmente)
    CREATE TABLE IF NOT EXISTS product_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      user_id INTEGER,
      product_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      client_name TEXT,
      client_phone TEXT,
      client_email TEXT,
      status TEXT NOT NULL DEFAULT 'RECIBIDA',
      notes TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES beauty_products(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    -- 9. TRATAMIENTOS REALIZADOS Y SEGUIMIENTO
    CREATE TABLE IF NOT EXISTS treatment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      appointment_id INTEGER,
      branch_id INTEGER NOT NULL DEFAULT 1,
      treatment_name TEXT NOT NULL,
      treatment_type TEXT NOT NULL,
      date TEXT NOT NULL,
      observations TEXT,
      skin_reaction TEXT,
      professional TEXT NOT NULL,
      suggested_next_session TEXT,
      status TEXT NOT NULL DEFAULT 'COMPLETADO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS treatment_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treatment_name TEXT NOT NULL,
      treatment_type TEXT NOT NULL,
      recommended_interval INTEGER NOT NULL,
      interval_unit TEXT NOT NULL DEFAULT 'DIAS',
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. PAGOS Y SALDOS
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL DEFAULT 1,
      appointment_id INTEGER,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0.00,
      pending_balance REAL NOT NULL DEFAULT 0.00,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'EFECTIVO',
      status TEXT NOT NULL DEFAULT 'COMPLETADO',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
    );
  `;
  db.run(sqliteSchema);

  // Vistas de compatibilidad directa para esquema oficial en español V12
  const compatibilityViews = `
    CREATE VIEW IF NOT EXISTS sucursales AS 
    SELECT id, code as codigo, name as nombre, city as municipio, 'La Paz' as departamento, 
           address as direccion, zone as referencia, google_maps_url as enlace_google_maps, 
           phone as telefono, CASE WHEN active=1 THEN 'activo' ELSE 'inactivo' END as estado, 
           1 as es_demo, created_at as creado_en, updated_at as actualizado_en 
    FROM branches;

    CREATE VIEW IF NOT EXISTS servicios AS 
    SELECT id, category_id as categoria_id, name as nombre, description as descripcion, 
           cosmetic_benefits as beneficios, duration as duracion_minutos, price as precio_base, 
           image as imagen_url, 0 as admite_paquetes, 0 as orden_visual, 
           CASE WHEN status='ACTIVO' THEN 1 ELSE 0 END as activo, 1 as es_demo, 
           created_at as creado_en, updated_at as actualizado_en 
    FROM services;

    CREATE VIEW IF NOT EXISTS categorias_servicios AS 
    SELECT id, code as codigo, name as nombre, description as descripcion, 
           image as imagen_url, sort_order as orden_visual, active as activo 
    FROM service_categories;

    CREATE VIEW IF NOT EXISTS configuracion_general AS 
    SELECT 'whatsapp_central' as clave, '+59162353452' as valor, 'WhatsApp central oficial' as descripcion 
    UNION SELECT 'moneda_oficial', 'Bs', 'Moneda oficial' 
    UNION SELECT 'zona_horaria', 'America/La_Paz', 'Zona horaria';
  `;
  try { db.run(compatibilityViews); } catch (e) { /* views created */ }

  // Semillas completas
  const seedSql = `
    -- 1. SUCURSALES (4 Sedes Oficiales Exactas - Módulo 06)
    INSERT OR IGNORE INTO branches (id, code, name, city, zone, address, phone, whatsapp, email, opening_hours, open_time, close_time, sunday_open, google_maps_url, map_embed_url, image, active) VALUES
    (1, 'VILLA-FATIMA', 'Villa Fátima', 'La Paz', 'Zona Villa Fátima', 
     'Zona Villa Fátima, avenida principal (referencial) [DEMO]', 
     '+591 2 2210011', '+591 62353452', 'villafatima@hermosatalitakumi.com', 
     'Lunes a Sábado: 08:30 - 19:30', '08:30', '19:30', 0,
     'https://maps.google.com/?q=-16.4862,-68.1182', 
     'https://maps.google.com/maps?q=-16.4862,-68.1182&z=16&output=embed', 
     '/banner-rosa.jpg', 1),

    (2, 'UPEA-EL-ALTO', 'UPEA – El Alto', 'El Alto', 'Zona Villa Esperanza', 
     'Zona UPEA, avenida principal (referencial) [DEMO]', 
     '+591 2 2840022', '+591 62353452', 'upea@hermosatalitakumi.com', 
     'Lunes a Sábado: 08:30 - 19:30', '08:30', '19:30', 0,
     'https://maps.google.com/?q=-16.4925,-68.1942', 
     'https://maps.google.com/maps?q=-16.4925,-68.1942&z=16&output=embed', 
     '/banner-rosa.jpg', 1),

    (3, 'CEJA-EL-ALTO', 'Ceja – El Alto', 'El Alto', 'Zona Ceja', 
     'Zona Ceja, avenida principal (referencial) [DEMO]', 
     '+591 2 2820033', '+591 62353452', 'ceja@hermosatalitakumi.com', 
     'Lunes a Sábado: 08:30 - 19:30', '08:30', '19:30', 0,
     'https://maps.google.com/?q=-16.5056,-68.1633', 
     'https://maps.google.com/maps?q=-16.5056,-68.1633&z=16&output=embed', 
     '/banner-rosa.jpg', 1),

    (4, 'MAX-PAREDES', 'Max Paredes', 'La Paz', 'Zona Max Paredes', 
     'Zona Max Paredes, avenida principal (referencial) [DEMO]', 
     '+591 2 2450044', '+591 62353452', 'maxparedes@hermosatalitakumi.com', 
     'Lunes a Sábado: 08:30 - 19:30', '08:30', '19:30', 0,
     'https://maps.google.com/?q=-16.4998,-68.1435', 
     'https://maps.google.com/maps?q=-16.4998,-68.1435&z=16&output=embed', 
     '/banner-rosa.jpg', 1);

    -- 2. USUARIOS CON LOS 3 ROLES
    -- Password para todos: Admin123! o Encargado123! o Cliente123!
    -- Hash $2a$10$1xKFnOg6c8tsPcQo/DqsGuksmKgp5Bl9ZdglzW5sh21uKvQ5wdUpe corresponde a Admin123!
    INSERT OR IGNORE INTO users (id, name, email, password, role, assigned_branch_id, phone, avatar) VALUES
    (1, 'Directora General (Jefes)', 'admin@talitakumi.com', '$2a$10$1xKFnOg6c8tsPcQo/DqsGuksmKgp5Bl9ZdglzW5sh21uKvQ5wdUpe', 'ADMINISTRADOR', NULL, '+591 70011223', '/logo-talitakumi.jpg'),
    (2, 'Encargado La Paz (Villa Fátima / Max Paredes)', 'encargado.lapaz@talitakumi.com', '$2a$10$1xKFnOg6c8tsPcQo/DqsGuksmKgp5Bl9ZdglzW5sh21uKvQ5wdUpe', 'ENCARGADO', 1, '+591 77197857', '/logo-talitakumi.jpg'),
    (3, 'Encargado El Alto (UPEA / Ceja)', 'encargado.elalto@talitakumi.com', '$2a$10$1xKFnOg6c8tsPcQo/DqsGuksmKgp5Bl9ZdglzW5sh21uKvQ5wdUpe', 'ENCARGADO', 2, '+591 79688750', '/logo-talitakumi.jpg'),
    (4, 'María González (Cliente)', 'maria.gonzalez@example.com', '$2a$10$4fkaZ9Zh2FSlDbh0hFSYW.am72gz9A4BZAIw.hIIOp7mKWzkiJZGK', 'CLIENTE', 1, '+591 71122334', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'),
    (5, 'Cliente Demo', 'cliente@ejemplo.com', '$2a$10$4fkaZ9Zh2FSlDbh0hFSYW.am72gz9A4BZAIw.hIIOp7mKWzkiJZGK', 'CLIENTE', 1, '+591 72233445', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300');

    INSERT OR IGNORE INTO clients (id, user_id, preferred_branch_id, birth_date, gender, skin_type) VALUES
    (1, 4, 1, '1995-04-12', 'Femenino', 'Mixta'),
    (2, 5, 2, '1992-08-25', 'Femenino', 'Sensible');

    -- 3. CATEGORÍAS DE SERVICIOS (7 Categorías)
    INSERT OR IGNORE INTO service_categories (id, code, name, description, image, sort_order) VALUES
    (1, 'FACIAL', 'Tratamientos faciales', 'Cuidado, limpieza profunda y revitalización de la piel del rostro', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600', 1),
    (2, 'LUNA', 'Baño de Luna', 'Exfoliación corporal integral, luminosidad y nutrición dermo-cosmética', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600', 2),
    (3, 'CORPORAL', 'Cuidado corporal', 'Tratamientos corporales reductores, reafirmantes e hidratantes', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600', 3),
    (4, 'MASAJES', 'Masajes corporales', 'Técnicas de relajación muscular, maderoterapia y piedras calientes', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', 4),
    (5, 'DEPILACION', 'Depilación facial y corporal', 'Depilación cosmética profesional y suave para diversas zonas', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 5),
    (6, 'PESTANAS', 'Lifting de pestañas', 'Realce natural, curvatura y nutrición profunda de pestañas', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600', 6),
    (7, 'CEJAS', 'Perfilado de cejas', 'Diseño armónico, perfilado y definición estética de cejas', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600', 7);

    -- 4. 51 TRATAMIENTOS OFICIALES (Precios en Bolivianos Bs)
    INSERT OR IGNORE INTO services (id, category_id, category_code, name, description, cosmetic_benefits, category, price, duration, type, status, image) VALUES
    -- 1. Faciales (10)
    (1, 1, 'FACIAL', 'Limpieza facial básica', 'Higiene facial para retirar impurezas superficiales y tonificar el cutis.', 'Mejora la frescura y suavidad de la piel.', 'Tratamientos faciales', 120.00, 45, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),
    (2, 1, 'FACIAL', 'Limpieza facial profunda', 'Exfoliación, vapor de ozono y descongestión para poros limpios y luminosos.', 'Favorece la oxigenación dermo-cutánea.', 'Tratamientos faciales', 180.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),
    (3, 1, 'FACIAL', 'Limpieza facial con extracción de impurezas', 'Protocolo intensivo con espátula ultrasónica y extracción manual higiénica.', 'Purifica la textura cutánea y reduce brillo.', 'Tratamientos faciales', 200.00, 75, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),
    (4, 1, 'FACIAL', 'Hidratación facial intensiva', 'Velo hidratante con ácido hialurónico y activos nutritivos.', 'Aporta elasticidad y sensación de confort.', 'Tratamientos faciales', 160.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (5, 1, 'FACIAL', 'Tratamiento facial iluminador', 'Aporte de brillo y revitalización cosmética para pieles fatigadas.', 'Uniforma el aspecto y devuelve vitalidad.', 'Tratamientos faciales', 190.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),
    (6, 1, 'FACIAL', 'Tratamiento antioxidante con vitamina C', 'Infusión tópica con extractos cítricos que protegen del estrés ambiental.', 'Sensación de luminosidad y frescura.', 'Tratamientos faciales', 210.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),
    (7, 1, 'FACIAL', 'Tratamiento para piel con acné', 'Protocolo cosmético calmante y seborregulador.', 'Contribuye a descongestionar zonas propensas a brotes.', 'Tratamientos faciales', 220.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),
    (8, 1, 'FACIAL', 'Tratamiento para mejorar la apariencia de manchas', 'Aplicación de sueros botánicos aclarantes y mascarilla regeneradora.', 'Atenúa contrastes tonales en la piel.', 'Tratamientos faciales', 230.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (9, 1, 'FACIAL', 'Tratamiento antiedad y para líneas de expresión', 'Estimulación facial con colágeno cosmético y masaje tensor.', 'Apariencia más tersa y descansada.', 'Tratamientos faciales', 250.00, 75, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),
    (10, 1, 'FACIAL', 'Exfoliación facial o peeling cosmético', 'Renovación superficial suave con micropartículas nutritivas.', 'Favorece una textura sedosa y uniforme.', 'Tratamientos faciales', 210.00, 50, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

    -- 2. Baño de Luna (10)
    (11, 2, 'LUNA', 'Baño de Luna cuerpo completo', 'Exfoliación, aclarado sutil y nutrición dermo-corporal en todo el cuerpo.', 'Piel suave, radiante y vellos sutilmente dorados.', 'Baño de Luna', 280.00, 90, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (12, 2, 'LUNA', 'Baño de Luna para brazos', 'Protocolo exfoliante y aclarante cosmético específico para brazos.', 'Suavidad y luminosidad homogénea en extremidades.', 'Baño de Luna', 120.00, 40, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),
    (13, 2, 'LUNA', 'Baño de Luna para piernas', 'Cuidado exfoliante e hidratante intensivo para piernas.', 'Textura aterciopelada y brillo natural.', 'Baño de Luna', 140.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (14, 2, 'LUNA', 'Baño de Luna para espalda', 'Limpieza exfoliante en zona dorsal con mascarilla nutritiva.', 'Sensación de pureza y lozanía en la espalda.', 'Baño de Luna', 150.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (15, 2, 'LUNA', 'Baño de Luna para cuello y escote', 'Tratamiento delicado para la piel sensible del escote.', 'Hidratación y luminosidad reconfortante.', 'Baño de Luna', 110.00, 35, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (16, 2, 'LUNA', 'Baño de Luna para manos y brazos', 'Envoltura de parafina y exfoliación de brazos y manos.', 'Manos tersas y revitalizadas.', 'Baño de Luna', 130.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),
    (17, 2, 'LUNA', 'Baño de Luna para piernas y pies', 'Renovación cutánea y masaje relajante en piernas y pies.', 'Alivio y estética sedosa en pies cansados.', 'Baño de Luna', 160.00, 50, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (18, 2, 'LUNA', 'Exfoliación corporal iluminadora', 'Masaje exfoliante con cristales minerales y esencias florales.', 'Remueve células muertas sin irritar.', 'Baño de Luna', 180.00, 60, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (19, 2, 'LUNA', 'Hidratación corporal después de la exfoliación', 'Aplicación de manteca de karité tibia y aceites reconfortantes.', 'Nutrición profunda y barrera protectora.', 'Baño de Luna', 150.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (20, 2, 'LUNA', 'Ritual de luminosidad corporal', 'Experiencia completa de baño de luna con masaje aromático.', 'Máximo bienestar y brillo radiante en la piel.', 'Baño de Luna', 320.00, 100, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),

    -- 3. Cuidado corporal (10)
    (21, 3, 'CORPORAL', 'Exfoliación corporal completa', 'Pulido dérmico suave en espalda, brazos y piernas.', 'Prepara la piel para absorber nutrientes.', 'Cuidado corporal', 170.00, 50, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (22, 3, 'CORPORAL', 'Hidratación corporal intensiva', 'Envoltura corporal nutritiva con extractos de almendra.', 'Alivia la sequedad y aspereza cutánea.', 'Cuidado corporal', 180.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (23, 3, 'CORPORAL', 'Tratamiento corporal iluminador', 'Serum cosmético enriquecido con perlas botánicas.', 'Sensación satinada y homogénea.', 'Cuidado corporal', 200.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (24, 3, 'CORPORAL', 'Tratamiento cosmético para la apariencia de manchas', 'Cuidado localizado con agentes vegetales unificadores.', 'Mejora visual de zonas hiperpigmentadas.', 'Cuidado corporal', 220.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),
    (25, 3, 'CORPORAL', 'Tratamiento reafirmante corporal', 'Terapia manual con geles criógenos y activos tensores.', 'Favorece la turgencia y firmeza de los tejidos.', 'Cuidado corporal', 230.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (26, 3, 'CORPORAL', 'Tratamiento anticelulítico', 'Masaje vigoroso complementado con activos de cafeína.', 'Ayuda a mejorar el aspecto de piel de naranja.', 'Cuidado corporal', 240.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (27, 3, 'CORPORAL', 'Tratamiento reductor corporal', 'Protocolo reductor con termoterapia en zonas localizadas.', 'Sensación de ligereza y silueta definida.', 'Cuidado corporal', 250.00, 70, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (28, 3, 'CORPORAL', 'Envoltura corporal hidratante', 'Mascarilla corporal con lodo termal y velo de seda.', 'Desintoxicación y tersura profunda.', 'Cuidado corporal', 210.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),
    (29, 3, 'CORPORAL', 'Tratamiento para mejorar la apariencia de la piel seca', 'Infusión lipídica reparadora para codos, rodillas y zonas ásperas.', 'Recupera la suavidad perdida.', 'Cuidado corporal', 190.00, 50, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (30, 3, 'CORPORAL', 'Tratamiento localizado para zonas específicas del cuerpo', 'Enfoque personalizado en abdomen, flancos o muslos.', 'Atención concentrada según necesidad del cliente.', 'Cuidado corporal', 160.00, 45, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),

    -- 4. Masajes corporales (10)
    (31, 4, 'MASAJES', 'Masaje relajante', 'Maniobras suaves y fluidas con aceites esenciales neutros.', 'Disminuye la tensión y promueve el descanso.', 'Masajes corporales', 180.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600'),
    (32, 4, 'MASAJES', 'Masaje descontracturante', 'Presión moderada a profunda en zonas con sobrecarga muscular.', 'Alivia contracturas y rigidez en espalda y cuello.', 'Masajes corporales', 200.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (33, 4, 'MASAJES', 'Masaje de espalda y cuello', 'Focalizado en cervicales y trapecios para descanso rápido.', 'Especial para jornadas sedentarias o de oficina.', 'Masajes corporales', 130.00, 40, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600'),
    (34, 4, 'MASAJES', 'Masaje de piernas y pies', 'Técnica descongestiva para estimular la circulación.', 'Sensación de alivio y ligereza en las piernas.', 'Masajes corporales', 140.00, 40, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (35, 4, 'MASAJES', 'Masaje corporal completo', 'Sesión integral desde pies a cabeza para relajación total.', 'Armonía corporal y bienestar emocional.', 'Masajes corporales', 220.00, 75, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
    (36, 4, 'MASAJES', 'Masaje reductor', 'Movimientos activos y termogénicos en abdomen y cadera.', 'Estimula la microcirculación cutánea.', 'Masajes corporales', 210.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (37, 4, 'MASAJES', 'Masaje anticelulítico', 'Fricciones especializadas para descompactar tejidos.', 'Mejora la textura y tono de la piel.', 'Masajes corporales', 210.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),
    (38, 4, 'MASAJES', 'Masaje con piedras calientes', 'Terapia geotermal con piedras volcánicas templadas.', 'Calor reconfortante que relaja los músculos en profundidad.', 'Masajes corporales', 240.00, 75, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600'),
    (39, 4, 'MASAJES', 'Maderoterapia corporal', 'Masaje con rodillos y copas anatómicas de madera noble.', 'Tonificación de tejidos y modelado corporal.', 'Masajes corporales', 230.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
    (40, 4, 'MASAJES', 'Masaje con aromaterapia', 'Masaje sensorial con selección de esencias de lavanda y jazmín.', 'Calma mental, descanso y aromaterapia pura.', 'Masajes corporales', 190.00, 60, 'MASAJES', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),

    -- 5. Depilación facial y corporal (5) [DEMO]
    (41, 5, 'DEPILACION', 'Depilación facial (bozo y mentón) [DEMO]', 'Extracción con cera tibia hipoalergénica.', 'Elimina vellitos delicadamente.', 'Depilación facial y corporal', 50.00, 20, 'DEPILACION', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (42, 5, 'DEPILACION', 'Depilación facial completa [DEMO]', 'Tratamiento en frente, mejillas, bozo y mentón.', 'Rostro suave y uniforme.', 'Depilación facial y corporal', 90.00, 35, 'DEPILACION', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (43, 5, 'DEPILACION', 'Depilación de axilas [DEMO]', 'Cera con aloe vera para pieles delicadas.', 'Axilas limpias y suaves.', 'Depilación facial y corporal', 60.00, 25, 'DEPILACION', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (44, 5, 'DEPILACION', 'Depilación de piernas completas [DEMO]', 'Retiro de vello desde muslos hasta tobillos.', 'Piernas sedosas por varias semanas.', 'Depilación facial y corporal', 140.00, 50, 'DEPILACION', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),
    (45, 5, 'DEPILACION', 'Depilación corporal completa [DEMO]', 'Sesión integral que incluye piernas, axilas y brazos.', 'Piel suave sin vello en todo el cuerpo.', 'Depilación facial y corporal', 260.00, 90, 'DEPILACION', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),

    -- 6. Lifting de pestañas (3) [DEMO]
    (46, 6, 'PESTANAS', 'Lifting de pestañas natural [DEMO]', 'Curvatura elegante desde la raíz con almohadillas de silicona.', 'Abre la mirada de forma natural.', 'Lifting de pestañas', 120.00, 45, 'PESTANAS', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),
    (47, 6, 'PESTANAS', 'Lifting de pestañas con tinte y keratina [DEMO]', 'Curvatura, color negro intenso y baño nutritivo de keratina.', 'Efecto rímel duradero sin maquillaje.', 'Lifting de pestañas', 150.00, 60, 'PESTANAS', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),
    (48, 6, 'PESTANAS', 'Retoque y nutrición de pestañas [DEMO]', 'Cuidado de mantenimiento y suero fortificante.', 'Pestañas fuertes y nutridas.', 'Lifting de pestañas', 90.00, 35, 'PESTANAS', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

    -- 7. Perfilado de cejas (3) [DEMO]
    (49, 7, 'CEJAS', 'Perfilado y diseño de cejas [DEMO]', 'Diseño personalizado según morfología facial con pinza.', 'Cejas definidas y armónicas.', 'Perfilado de cejas', 50.00, 30, 'CEJAS', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),
    (50, 7, 'CEJAS', 'Perfilado de cejas con tinte henna [DEMO]', 'Definición y sombreado semipermanente con tinte orgánico.', 'Aspecto de cejas más tupidas y pulidas.', 'Perfilado de cejas', 80.00, 40, 'CEJAS', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),
    (51, 7, 'CEJAS', 'Diseño y depilación armónica de cejas [DEMO]', 'Mapeo facial con hilo y remoción precisa de excedentes.', 'Líneas limpias que resaltan la expresión.', 'Perfilado de cejas', 65.00, 35, 'CEJAS', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600');

    -- Asociar todos los servicios a las 4 sucursales
    INSERT OR IGNORE INTO branch_services (branch_id, service_id, active)
    SELECT b.id, s.id, 1
    FROM branches b
    CROSS JOIN services s;

    -- 5. PROMOCIONES ESPECIALES (Módulo 12)
    -- 5. PROMOCIONES GLOBALES (Módulo 12)
    INSERT OR IGNORE INTO promotions (id, title, description, service_id, regular_price, promo_price, discount_percent, start_date, end_date, badge, image, active) VALUES
    (1, 'Renovación Total: Baño de Luna + Facial', 'Combina nuestro Baño de Luna cuerpo completo con una limpieza facial iluminadora a precio especial.', 11, 460.00, 320.00, 30, '2026-01-01', '2026-12-31', 'OFERTA DESTACADA', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600', 1),
    (2, 'Dúo Relajante & Piedras Calientes', 'Sesión de masaje geotermal y aromaterapia profunda para renovar cuerpo y mente.', 38, 430.00, 280.00, 35, '2026-01-01', '2026-12-31', 'MÁS POPULAR', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', 1),
    (3, 'Pack Mirada Radiante (Lifting + Perfilado)', 'Lifting de pestañas con keratina y diseño armónico de cejas en una sola cita.', 47, 230.00, 160.00, 30, '2026-01-01', '2026-12-31', 'BELLEZA INTEGRAL', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600', 1);

    -- 6. VERSÍCULOS BÍBLICOS INSPIRADORES (Módulo 08)
    INSERT OR IGNORE INTO verses (id, reference, version, text, reflection, sort_order, active) VALUES
    (1, 'Salmos 139:14', 'RVR1960 [PROVISIONAL]', 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.', 'Cada persona es una creación maravillosa y tiene un valor único.', 1, 1),
    (2, '1 Samuel 16:7', 'RVR1960 [PROVISIONAL]', '…porque Jehová no mira lo que mira el hombre; pues el hombre mira lo que está delante de sus ojos, pero Jehová mira el corazón.', 'La belleza interior tiene un valor que va más allá de la apariencia física.', 2, 1),
    (3, '1 Corintios 6:19', 'RVR1960 [PROVISIONAL]', '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros?', 'Cuidar nuestro cuerpo también es valorar la vida que hemos recibido.', 3, 1),
    (4, 'Proverbios 31:30', 'RVR1960 [PROVISIONAL]', 'Engañosa es la gracia, y vana la hermosura; la mujer que teme a Jehová, ésa será alabada.', 'La verdadera belleza también está relacionada con el carácter y los valores.', 4, 1);

    -- 7. PRODUCTOS COSMÉTICOS Y EXISTENCIAS POR SUCURSAL
    INSERT OR IGNORE INTO beauty_products (id, name, brand, category, type, description, usage_instructions, status, price, image) VALUES
    (1, 'Serum Facial Ácido Hialurónico Puro', 'Talita Kumi Dermo', 'Hidratación', 'FACIAL', 'Concentrado al 2% para retener hidratación dérmica.', 'Aplicar 4 gotas sobre el rostro limpio por la mañana y noche.', 'ACTIVO', 140.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'),
    (2, 'Gel Exfoliante Renovador de Bambú', 'Talita Kumi Botanical', 'Exfoliación', 'FACIAL', 'Microgránulos vegetales que pulen la piel con suavidad.', 'Usar 1 a 2 veces por semana con movimientos circulares.', 'ACTIVO', 95.00, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'),
    (3, 'Loción Tónica Descongestiva de Rosas', 'Talita Kumi Herbal', 'Tonificación', 'FACIAL', 'Agua de rosas destilada para balancear el pH dérmico.', 'Rociar a 20 cm del rostro tras la limpieza.', 'ACTIVO', 80.00, 'https://images.unsplash.com/photo-1608248597359-5f284b39b56f?w=400'),
    (4, 'Crema Corporal Nutritiva Manteca de Karité', 'Talita Kumi Body Care', 'Corporal', 'CORPORAL', 'Emulsión densa para zonas secas y codos.', 'Aplicar generosamente tras el baño.', 'ACTIVO', 110.00, 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400'),
    (5, 'Aceite de Almendras Dulces & Vitamina E', 'Talita Kumi Body Care', 'Corporal', 'CORPORAL', 'Aceite ligero para masaje y prevención de sequedad.', 'Masajear suavemente sobre la piel ligeramente húmeda.', 'ACTIVO', 85.00, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400'),
    (6, 'Mascarilla Facial de Arcilla Volcánica', 'Talita Kumi Dermo', 'Purificante', 'FACIAL', 'Arcilla purificante que absorbe el exceso de sebo.', 'Dejar actuar 10 minutos y retirar con agua templada.', 'ACTIVO', 105.00, 'https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=400'),
    (7, 'Protector Solar Facial FPS 50+ Invisible', 'Talita Kumi Sun Care', 'Protección', 'FACIAL', 'Filtro solar mineral sin residuo blanco ni brillo graso.', 'Aplicar cada mañana 20 minutos antes de salir.', 'ACTIVO', 160.00, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'),
    (8, 'Sales de Baño Exfoliantes con Lavanda', 'Talita Kumi Spa', 'Spa Corporal', 'CORPORAL', 'Sales marinas aromatizadas para pediluvio o baño.', 'Disolver 2 cucharadas en agua templada.', 'ACTIVO', 75.00, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400');

    -- Inventario por sucursal (stock diferenciado para las 4 sedes)
    INSERT OR IGNORE INTO branch_inventory (branch_id, product_id, stock, min_stock) VALUES
    (1, 1, 15, 4), (1, 2, 10, 3), (1, 3, 12, 3), (1, 4, 8, 2), (1, 5, 20, 5), (1, 6, 9, 3), (1, 7, 18, 5), (1, 8, 14, 4),
    (2, 1, 12, 4), (2, 2, 8, 3),  (2, 3, 10, 3), (2, 4, 6, 2), (2, 5, 15, 5), (2, 6, 7, 3), (2, 7, 14, 5), (2, 8, 10, 4),
    (3, 1, 14, 4), (3, 2, 11, 3), (3, 3, 14, 3), (3, 4, 9, 2), (3, 5, 18, 5), (3, 6, 8, 3), (3, 7, 16, 5), (3, 8, 12, 4),
    (4, 1, 10, 4), (4, 2, 7, 3),  (4, 3, 9, 3),  (4, 4, 5, 2), (4, 5, 12, 5), (4, 6, 6, 3), (4, 7, 11, 5), (4, 8, 8, 4);

    -- 8. REGLAS DE SEGUIMIENTO (Módulo 15)
    INSERT OR IGNORE INTO treatment_rules (id, treatment_name, treatment_type, recommended_interval, interval_unit, description, active) VALUES
    (1, 'Limpieza facial profunda', 'FACIAL', 21, 'DIAS', 'Recomendado cada 21 a 30 días para renovación celular óptima.', 1),
    (2, 'Baño de Luna cuerpo completo', 'LUNA', 28, 'DIAS', 'Recomendado cada 4 semanas para sostener la luminosidad corporal.', 1),
    (3, 'Tratamiento reafirmante corporal', 'CORPORAL', 7, 'DIAS', 'Sesiones semanales recomendadas para tonificación constante.', 1),
    (4, 'Masaje descontracturante', 'MASAJES', 14, 'DIAS', 'Recomendado cada 2 semanas para alivio de tensiones musculares.', 1),
    (5, 'Lifting de pestañas', 'PESTANAS', 45, 'DIAS', 'Ciclo de curvatura natural recomendado cada 6 semanas.', 1);

    -- 9. NOTIFICACIÓN INICIAL DE BIENVENIDA
    INSERT OR IGNORE INTO notifications (id, branch_id, client_id, title, message, type, is_read) VALUES
    (1, 1, 1, '¡Bienvenida a Hermosa Talita Kumi!', 'Gracias por confiar en nosotros. Puedes agendar tu primera cita desde nuestra web.', 'BIENVENIDA', 0);
  `;
  db.run(seedSql);

  sqliteDb = db;
  currentEngine = 'SQLITE_LOCAL';
  saveSqliteToDisk();
  console.log('[DB] Motor SQLite local inicializado exitosamente con las 4 sucursales y 51 tratamientos.');
}

async function initDatabase() {
  try {
    console.log(`[DB] Intentando conectar con MySQL en ${DB_HOST}:${DB_PORT} (DB: ${DB_NAME})...`);
    const tempPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2500
    });

    const conn = await tempPool.getConnection();
    await conn.ping();
    conn.release();

    pool = tempPool;
    currentEngine = 'MYSQL';
    console.log(`[DB] Conexión exitosa a MySQL en ${DB_HOST}:${DB_PORT} [PRODUCCIÓN/DOCKER]`);
  } catch (error) {
    console.warn(`[DB-AVISO] No se pudo conectar directamente con MySQL (${error.message}).`);
    await initSqliteFallback();
  }
}

async function query(sql, params = []) {
  if (currentEngine === 'UNKNOWN') {
    await initDatabase();
  }

  if (currentEngine === 'MYSQL' && pool) {
    return await pool.query(sql, params);
  }

  // Ejecución en SQLite Fallback
  if (sqliteDb) {
    let cleanSql = sql.trim();
    cleanSql = cleanSql.replace(/NOW\(\)/gi, "datetime('now')");

    const isSelect = /^SELECT\b/i.test(cleanSql);

    if (isSelect) {
      const stmt = sqliteDb.prepare(cleanSql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows];
    } else {
      const stmt = sqliteDb.prepare(cleanSql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();

      let lastInsertId = 0;
      let changes = 0;
      try {
        const idRes = sqliteDb.exec("SELECT last_insert_rowid() AS id, changes() AS ch");
        if (idRes.length > 0 && idRes[0].values.length > 0) {
          lastInsertId = idRes[0].values[0][0];
          changes = idRes[0].values[0][1];
        }
      } catch (e) {
        // Ignorar
      }

      saveSqliteToDisk();
      return [{ insertId: lastInsertId, affectedRows: changes }];
    }
  }

  throw new Error('Base de datos no inicializada.');
}

function getEngine() {
  return currentEngine;
}

module.exports = {
  initDatabase,
  query,
  getEngine
};
