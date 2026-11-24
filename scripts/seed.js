/**
 * Script de datos iniciales (seed) idempotente para HERMOSA TALITA KUMI.
 * Ejecuta contra los emuladores locales de Firebase (Auth 9099 y Firestore 8080).
 *
 * Uso:
 *   node scripts/seed.js
 */

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { repartirCuotas } = require('../functions/src/lib/money');
const { ahoraBolivia, sumarDias } = require('../functions/src/lib/time');

const PROJECT_ID = 'demo-hermosa-talita-kumi';

if (getApps().length === 0) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();
const auth = getAuth();

const SUCURSALES_IDS = ['villa-fatima', 'upea', 'ceja', 'max-paredes'];

const SUCURSALES = [
  {
    id: 'villa-fatima',
    nombre: 'Villa Fátima',
    ciudad: 'La Paz',
    direccion: 'Zona Villa Fátima, Av. Las Américas (referencial)',
    referencia: 'A media cuadra de la Plaza Villarroel',
    whatsapp: '+591 77197857',
    googleMapsUrl: 'https://maps.google.com/?q=-16.4862,-68.1182',
    mapEmbedUrl: 'https://maps.google.com/maps?q=-16.4862,-68.1182&z=16&output=embed',
    horario: {
      apertura: '08:30',
      cierre: '19:30',
      dias: [1, 2, 3, 4, 5, 6],
      slotMin: 30,
    },
    capacidad: 2,
    activa: true,
  },
  {
    id: 'upea',
    nombre: 'UPEA – El Alto',
    ciudad: 'El Alto',
    direccion: 'Zona Villa Esperanza, Av. Sucre A (frente a la UPEA)',
    referencia: 'A pasos del campus principal de la UPEA',
    whatsapp: '+591 79688750',
    googleMapsUrl: 'https://maps.google.com/?q=-16.4925,-68.1942',
    mapEmbedUrl: 'https://maps.google.com/maps?q=-16.4925,-68.1942&z=16&output=embed',
    horario: {
      apertura: '08:30',
      cierre: '19:30',
      dias: [1, 2, 3, 4, 5, 6],
      slotMin: 30,
    },
    capacidad: 2,
    activa: true,
  },
  {
    id: 'ceja',
    nombre: 'Ceja – El Alto',
    ciudad: 'El Alto',
    direccion: 'Zona Ceja, Av. 6 de Marzo y Calle 2 (referencial)',
    referencia: 'A dos cuadras del distribuidor de la Ceja',
    whatsapp: '+591 76230119',
    googleMapsUrl: 'https://maps.google.com/?q=-16.5056,-68.1633',
    mapEmbedUrl: 'https://maps.google.com/maps?q=-16.5056,-68.1633&z=16&output=embed',
    horario: {
      apertura: '08:30',
      cierre: '19:30',
      dias: [1, 2, 3, 4, 5, 6],
      slotMin: 30,
    },
    capacidad: 2,
    activa: true,
  },
  {
    id: 'max-paredes',
    nombre: 'Max Paredes',
    ciudad: 'La Paz',
    direccion: 'Zona Max Paredes, Av. Buenos Aires (referencial)',
    referencia: 'Cerca de la galería comercial Max Paredes',
    whatsapp: '+591 77197857', // Comparte WhatsApp oficial con Villa Fátima
    googleMapsUrl: 'https://maps.google.com/?q=-16.4998,-68.1435',
    mapEmbedUrl: 'https://maps.google.com/maps?q=-16.4998,-68.1435&z=16&output=embed',
    horario: {
      apertura: '08:30',
      cierre: '19:30',
      dias: [1, 2, 3, 4, 5, 6],
      slotMin: 30,
    },
    capacidad: 2,
    activa: true,
  },
];

const USUARIOS = [
  {
    uid: 'admin-htk',
    email: 'admin@talitakumi.com',
    password: 'Admin123!',
    nombre: 'Directora General HTK',
    telefono: '+591 77197857',
    role: 'admin',
    sucursales: [],
  },
  {
    uid: 'encargado-villa-fatima',
    email: 'encargado.villafatima@talitakumi.com',
    password: 'Encargado123!',
    nombre: 'Encargada Villa Fátima',
    telefono: '+591 77197857',
    role: 'encargado',
    sucursales: ['villa-fatima'],
  },
  {
    uid: 'encargado-upea',
    email: 'encargado.upea@talitakumi.com',
    password: 'Encargado123!',
    nombre: 'Encargada UPEA',
    telefono: '+591 79688750',
    role: 'encargado',
    sucursales: ['upea'],
  },
  {
    uid: 'encargado-ceja',
    email: 'encargado.ceja@talitakumi.com',
    password: 'Encargado123!',
    nombre: 'Encargada Ceja',
    telefono: '+591 76230119',
    role: 'encargado',
    sucursales: ['ceja'],
  },
  {
    uid: 'encargado-max-paredes',
    email: 'encargado.maxparedes@talitakumi.com',
    password: 'Encargado123!',
    nombre: 'Encargada Max Paredes',
    telefono: '+591 77197857',
    role: 'encargado',
    sucursales: ['max-paredes'],
  },
  {
    uid: 'cliente-demo',
    email: 'cliente@talitakumi.com',
    password: 'Cliente123!',
    nombre: 'María González (Demo)',
    telefono: '+591 71122334',
    role: 'cliente',
    sucursales: [],
  },
];

const SERVICIOS = [
  // Tratamientos faciales
  { id: 'fac-limpieza-basica', nombre: 'Limpieza facial básica', descripcion: 'Higiene facial suave para retirar impurezas superficiales y tonificar el cutis.', precio: 100.0, duracionMin: 45, categoria: 'Tratamientos faciales', imagen: '/trat_limpieza_facial.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-limpieza-profunda', nombre: 'Limpieza facial profunda', descripcion: 'Exfoliación, vapor de ozono, extracción higiénica y mascarilla descongestiva.', precio: 150.0, duracionMin: 60, categoria: 'Tratamientos faciales', imagen: '/trat_limpieza_facial.png', destacado: true, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-hidratacion-intensiva', nombre: 'Hidratación facial intensiva', descripcion: 'Velo hidratante con ácido hialurónico y activos botánicos nutritivos.', precio: 130.0, duracionMin: 60, categoria: 'Tratamientos faciales', imagen: '/trat_hidratacion_facial.png', destacado: true, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-iluminador-vitc', nombre: 'Tratamiento facial iluminador con vitamina C', descripcion: 'Infusión antioxidante para devolver vitalidad y brillo natural al rostro.', precio: 150.0, duracionMin: 60, categoria: 'Tratamientos faciales', imagen: '/trat_iluminador_facial.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-acne', nombre: 'Tratamiento para piel con acné', descripcion: 'Protocolo calmante y seborregulador para piel grasa o con brotes.', precio: 180.0, duracionMin: 60, categoria: 'Tratamientos faciales', imagen: '/trat_acne_facial.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-antiedad', nombre: 'Tratamiento antiedad y líneas de expresión', descripcion: 'Cuidado reafirmante con colágeno cosmético y masaje facial tensor.', precio: 190.0, duracionMin: 60, categoria: 'Tratamientos faciales', imagen: '/trat_antiedad_facial.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'fac-peeling', nombre: 'Exfoliación facial o peeling cosmético', descripcion: 'Renovación dermo-cosmética superficial para textura suave y uniforme.', precio: 130.0, duracionMin: 45, categoria: 'Tratamientos faciales', imagen: '/trat_peeling_facial.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },

  // Baño de Luna
  { id: 'luna-cuerpo-completo', nombre: 'Baño de Luna cuerpo completo', descripcion: 'Ritual de exfoliación, aclarado suave del vello y nutrición dermo-corporal.', precio: 220.0, duracionMin: 90, categoria: 'Baño de Luna', imagen: '/trat_bano_luna_cuerpo.png', destacado: true, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'luna-brazos-piernas', nombre: 'Baño de Luna brazos y piernas', descripcion: 'Exfoliación e iluminación estética enfocada en extremidades.', precio: 140.0, duracionMin: 60, categoria: 'Baño de Luna', imagen: '/trat_bano_luna_zonas.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'luna-espalda-escote', nombre: 'Baño de Luna espalda, cuello y escote', descripcion: 'Limpieza exfoliante y aclarado sutil para zona superior.', precio: 120.0, duracionMin: 45, categoria: 'Baño de Luna', imagen: '/trat_bano_luna_zonas.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },

  // Cuidado corporal
  { id: 'corp-exfoliacion', nombre: 'Exfoliación corporal completa', descripcion: 'Pulido corporal con sales minerales y aceites nutritivos.', precio: 140.0, duracionMin: 60, categoria: 'Cuidado corporal', imagen: '/trat_cuidado_corporal.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'corp-reafirmante', nombre: 'Tratamiento reafirmante corporal', descripcion: 'Terapia manual y activos tensores para mejorar tonicidad de la piel.', precio: 170.0, duracionMin: 60, categoria: 'Cuidado corporal', imagen: '/trat_cuidado_corporal.png', destacado: false, sucursales: ['villa-fatima', 'ceja', 'max-paredes'], activo: true },
  { id: 'corp-envoltura', nombre: 'Envoltura corporal hidratante', descripcion: 'Mascarilla corporal nutritiva con lodo termal y velo hidratante.', precio: 150.0, duracionMin: 60, categoria: 'Cuidado corporal', imagen: '/trat_envoltura_corporal.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },

  // Masajes corporales
  { id: 'mas-relajante', nombre: 'Masaje relajante', descripcion: 'Maniobras rítmicas suaves con aceites aromáticos para aliviar el estrés.', precio: 160.0, duracionMin: 60, categoria: 'Masajes corporales', imagen: '/trat_masaje_relajante.png', destacado: true, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'mas-descontracturante', nombre: 'Masaje descontracturante', descripcion: 'Presión moderada a profunda en espalda, cuello y hombros.', precio: 180.0, duracionMin: 60, categoria: 'Masajes corporales', imagen: '/trat_masaje_descontracturante.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'mas-piedras-calientes', nombre: 'Masaje con piedras calientes', descripcion: 'Terapia geotermal con piedras volcánicas templadas y aromaterapia.', precio: 210.0, duracionMin: 75, categoria: 'Masajes corporales', imagen: '/trat_masaje_piedras.png', destacado: true, sucursales: ['villa-fatima', 'upea', 'ceja'], activo: true },
  { id: 'mas-maderoterapia', nombre: 'Maderoterapia corporal', descripcion: 'Modelado estético con piezas anatómicas de madera noble.', precio: 170.0, duracionMin: 60, categoria: 'Masajes corporales', imagen: '/trat_masaje_descontracturante.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },

  // Depilación, Pestañas y Cejas
  { id: 'dep-facial-completa', nombre: 'Depilación facial completa', descripcion: 'Depilación suave con cera tibia hipoalergénica en rostro.', precio: 90.0, duracionMin: 30, categoria: 'Depilación facial y corporal', imagen: '/trat_depilacion.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'dep-piernas-completas', nombre: 'Depilación de piernas completas', descripcion: 'Cera descartable de un solo uso con gel calmante post-depilatorio.', precio: 130.0, duracionMin: 60, categoria: 'Depilación facial y corporal', imagen: '/trat_depilacion.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'lift-pestanas-tinte', nombre: 'Lifting de pestañas con tinte y keratina', descripcion: 'Curvatura natural desde la raíz, color y nutrición profunda.', precio: 120.0, duracionMin: 60, categoria: 'Lifting de pestañas', imagen: '/cat_pestanas.png', destacado: true, sucursales: SUCURSALES_IDS, activo: true },
  { id: 'cejas-perfilado-henna', nombre: 'Perfilado de cejas con tinte henna', descripcion: 'Diseño visagista y sombreado semipermanente para cejas armónicas.', precio: 90.0, duracionMin: 45, categoria: 'Perfilado de cejas', imagen: '/cat_cejas.png', destacado: false, sucursales: SUCURSALES_IDS, activo: true },
];

const PROMOCIONES = [
  {
    id: 'promo-bano-luna-facial',
    titulo: 'Renovación Total: Baño de Luna + Facial',
    descripcion: 'Combina Baño de Luna cuerpo completo con limpieza facial iluminadora a precio especial.',
    descuento: '20% OFF',
    precioRegular: 370.0,
    precioPromo: 296.0,
    vigencia: 'Válido hasta 31/12/2026',
    servicioId: 'luna-cuerpo-completo',
    sucursales: SUCURSALES_IDS,
    imagen: '/promo_bano_luna_facial.png',
    activa: true,
  },
  {
    id: 'promo-piedras-relajante',
    titulo: 'Bienestar Integral: Piedras Calientes',
    descripcion: 'Descuento directo de Bs 30.00 en tu sesión de masaje con piedras calientes y aromaterapia.',
    descuento: 'Bs 30.00 OFF',
    precioRegular: 210.0,
    precioPromo: 180.0,
    vigencia: 'Válido hasta 31/12/2026',
    servicioId: 'mas-piedras-calientes',
    sucursales: ['villa-fatima', 'upea', 'ceja'],
    imagen: '/promo_masaje_piedras.png',
    activa: true,
  },
  {
    id: 'promo-mirada-radiante',
    titulo: 'Pack Mirada Radiante (Lifting + Cejas)',
    descripcion: 'Lifting de pestañas con keratina más perfilado armónico de cejas en una sola visita.',
    descuento: '25% OFF',
    precioRegular: 210.0,
    precioPromo: 157.5,
    vigencia: 'Válido hasta 31/12/2026',
    servicioId: 'lift-pestanas-tinte',
    sucursales: SUCURSALES_IDS,
    imagen: '/promo_mirada_radiante.png',
    activa: true,
  },
];

const PRODUCTOS = [
  { id: 'prod-serum-hialuronico', nombre: 'Sérum Facial Ácido Hialurónico 2%', categoria: 'Facial', precio: 140.0, stockMinimo: 4, imagen: '/prod_serum_facial.png', activo: true },
  { id: 'prod-protector-solar', nombre: 'Protector Solar Dermo-Silk FPS 50+', categoria: 'Facial', precio: 150.0, stockMinimo: 5, imagen: '/prod_protector_solar.png', activo: true },
  { id: 'prod-gel-exfoliante', nombre: 'Gel Exfoliante Botánico de Bambú', categoria: 'Facial', precio: 95.0, stockMinimo: 3, imagen: '/prod_gel_exfoliante.png', activo: true },
  { id: 'prod-tonico-rosas', nombre: 'Loción Tónica Descongestiva de Rosas', categoria: 'Facial', precio: 80.0, stockMinimo: 3, imagen: '/prod_tonico_rosas.png', activo: true },
  { id: 'prod-mascarilla-arcilla', nombre: 'Mascarilla Facial de Arcilla Volcánica', categoria: 'Facial', precio: 105.0, stockMinimo: 3, imagen: '/prod_mascarilla_arcilla.png', activo: true },
  { id: 'prod-crema-corporal', nombre: 'Crema Corporal Nutritiva Karité', categoria: 'Corporal', precio: 110.0, stockMinimo: 3, imagen: '/prod_crema_corporal.png', activo: true },
  { id: 'prod-aceite-almendras', nombre: 'Aceite de Almendras & Vitamina E', categoria: 'Corporal', precio: 85.0, stockMinimo: 4, imagen: '/prod_aceite_almendras.png', activo: true },
  { id: 'prod-sales-lavanda', nombre: 'Sales Exfoliantes de Lavanda', categoria: 'Corporal', precio: 75.0, stockMinimo: 3, imagen: '/prod_sales_lavanda.png', activo: true },
];

const FAQS = [
  {
    id: 'faq-horarios',
    pregunta: '¿Cuál es el horario de atención de las sucursales?',
    respuesta: 'Atendemos de lunes a sábado de 08:30 a 19:30 en nuestras 4 sucursales (Villa Fátima, UPEA, Ceja y Max Paredes). Los domingos permanecemos cerrados.',
    palabrasClave: ['horario', 'abierto', 'domingo', 'hora', 'atencion'],
  },
  {
    id: 'faq-cancelacion',
    pregunta: '¿Con cuánta anticipación puedo cancelar o reprogramar mi cita?',
    respuesta: 'Puedes cancelar o reprogramar tu cita desde "Mis citas" con al menos 2 horas de anticipación sin costo. Si falta menos tiempo, comunícate por WhatsApp con tu sucursal.',
    palabrasClave: ['cancelar', 'reprogramar', 'cambiar', 'anticipacion', 'horas'],
  },
  {
    id: 'faq-pagos',
    pregunta: '¿Qué métodos de pago aceptan y tienen plan de cuotas?',
    respuesta: 'Aceptamos efectivo, pago por QR Simple, transferencia bancaria y tarjeta en sucursal. Para tratamientos completos también ofrecemos planes en cuotas exactas en Bolivianos (Bs).',
    palabrasClave: ['pago', 'qr', 'tarjeta', 'efectivo', 'cuotas', 'transferencia'],
  },
  {
    id: 'faq-reservas',
    pregunta: '¿Cómo agendo una cita en línea?',
    respuesta: 'Inicia sesión o regístrate, ingresa a la sección "Reservar", elige tu sucursal, el servicio deseado, la fecha y uno de los horarios disponibles en tiempo real.',
    palabrasClave: ['reservar', 'agendar', 'cita', 'turno', 'como'],
  },
  {
    id: 'faq-capacidad',
    pregunta: '¿Pueden atender a dos personas al mismo tiempo?',
    respuesta: 'Sí, cada una de nuestras 4 sucursales cuenta con 2 especialistas disponibles simultáneamente para atender hasta 2 reservas en el mismo horario.',
    palabrasClave: ['dos', 'acompanante', 'simultaneo', 'capacidad', 'amiga'],
  },
  {
    id: 'faq-ubicaciones',
    pregunta: '¿Dónde están ubicadas las sucursales?',
    respuesta: 'Estamos en La Paz (Villa Fátima y Max Paredes — WhatsApp +591 77197857) y en El Alto (UPEA — +591 79688750 y Ceja — +591 76230119).',
    palabrasClave: ['donde', 'direccion', 'mapa', 'la paz', 'el alto'],
  },
];

const VERSICULOS = [
  {
    id: 'ver-1',
    referencia: 'Salmos 139:14',
    version: 'RVR1960',
    texto: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
    reflexion: 'Cada persona es una creación maravillosa y tiene un valor único.',
    orden: 1,
  },
  {
    id: 'ver-2',
    referencia: '1 Samuel 16:7',
    version: 'RVR1960',
    texto: '…porque Jehová no mira lo que mira el hombre; pues el hombre mira lo que está delante de sus ojos, pero Jehová mira el corazón.',
    reflexion: 'La belleza interior tiene un valor que va más allá de la apariencia física.',
    orden: 2,
  },
  {
    id: 'ver-3',
    referencia: '1 Corintios 6:19',
    version: 'RVR1960',
    texto: '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros?',
    reflexion: 'Cuidar nuestro cuerpo también es valorar la vida que hemos recibido.',
    orden: 3,
  },
  {
    id: 'ver-4',
    referencia: 'Proverbios 31:30',
    version: 'RVR1960',
    texto: 'Engañosa es la gracia, y vana la hermosura; la mujer que teme a Jehová, ésa será alabada.',
    reflexion: 'La verdadera belleza también refleja paz, carácter y cuidado integral.',
    orden: 4,
  },
];

async function upsertUsuario(u) {
  let record;
  try {
    record = await auth.getUserByEmail(u.email);
  } catch (_err) {
    record = await auth.createUser({
      uid: u.uid,
      email: u.email,
      password: u.password,
      displayName: u.nombre,
    });
  }

  await auth.setCustomUserClaims(record.uid, {
    role: u.role,
    sucursales: u.sucursales,
  });

  await db.collection('users').doc(record.uid).set(
    {
      nombre: u.nombre,
      telefono: u.telefono,
      email: u.email,
      role: u.role,
      sucursales: u.sucursales,
      sucursalPreferida: u.role === 'cliente' ? 'villa-fatima' : null,
      aceptaWhatsapp: true,
      aceptaTerminos: true,
      fechaNacimiento: null,
      activo: true,
      creadoEn: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return record.uid;
}

async function seed() {
  console.log(`Sembrando datos iniciales en proyecto "${PROJECT_ID}"...`);
  console.log(`  Auth Emulator:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`  Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  // 1. Sucursales
  for (const s of SUCURSALES) {
    const { id, ...data } = s;
    await db.collection('sucursales').doc(id).set(data, { merge: true });
  }
  console.log(`✔ ${SUCURSALES.length} sucursales creadas/actualizadas.`);

  // 2. Usuarios (Auth + Firestore + Custom Claims)
  for (const u of USUARIOS) {
    await upsertUsuario(u);
  }
  console.log(`✔ ${USUARIOS.length} usuarios demo creados/actualizados.`);

  // 3. Servicios
  for (const s of SERVICIOS) {
    const { id, ...data } = s;
    await db.collection('servicios').doc(id).set(data, { merge: true });
  }
  console.log(`✔ ${SERVICIOS.length} servicios creados/actualizados.`);

  // 4. Promociones
  for (const p of PROMOCIONES) {
    const { id, ...data } = p;
    await db.collection('promociones').doc(id).set(data, { merge: true });
  }
  console.log(`✔ ${PROMOCIONES.length} promociones creadas/actualizadas.`);

  // 5. Productos + Inventario inicial + Movimiento inicial consistente (auditarInventario = 0 diffs)
  const stockInicialPorSucursal = {
    'villa-fatima': [12, 10, 8, 9, 7, 6, 14, 10],
    upea: [10, 4, 7, 8, 6, 5, 10, 8], // protector solar (4 <= 5) en alerta stock bajo
    ceja: [11, 9, 2, 7, 6, 8, 12, 9], // gel exfoliante (2 <= 3) en alerta stock bajo
    'max-paredes': [9, 8, 6, 6, 5, 2, 11, 7], // crema corporal (2 <= 3) en alerta stock bajo
  };

  for (const p of PRODUCTOS) {
    const { id, ...data } = p;
    await db.collection('productos').doc(id).set(data, { merge: true });
  }

  let invCount = 0;
  for (const suc of SUCURSALES) {
    const stocks = stockInicialPorSucursal[suc.id];
    for (let i = 0; i < PRODUCTOS.length; i++) {
      const prod = PRODUCTOS[i];
      const stockInicial = stocks[i];
      const invId = `${suc.id}_${prod.id}`;
      const movId = `seed_init_${invId}`;

      const invRef = db.collection('inventario').doc(invId);
      const movRef = db.collection('movimientos').doc(movId);
      const existingMov = await movRef.get();

      if (!existingMov.exists) {
        await invRef.set({
          sucursalId: suc.id,
          sucursalNombre: suc.nombre,
          productoId: prod.id,
          productoNombre: prod.nombre,
          stock: stockInicial,
          stockMinimo: prod.stockMinimo,
          actualizadoEn: FieldValue.serverTimestamp(),
        });
        await movRef.set({
          tipo: 'entrada',
          direccion: 'entrada',
          cantidad: stockInicial,
          delta: stockInicial,
          stockAntes: 0,
          stockDespues: stockInicial,
          sucursalId: suc.id,
          sucursalNombre: suc.nombre,
          productoId: prod.id,
          productoNombre: prod.nombre,
          motivo: 'Stock inicial de apertura (seed)',
          usuario: 'Directora General HTK',
          usuarioId: 'admin-htk',
          fecha: FieldValue.serverTimestamp(),
        });
      }
      invCount++;
    }
  }
  console.log(`✔ ${PRODUCTOS.length} productos y ${invCount} registros de inventario inicializados.`);

  // 6. FAQ y Versículos
  for (const f of FAQS) {
    const { id, ...data } = f;
    await db.collection('faq').doc(id).set(data, { merge: true });
  }
  for (const v of VERSICULOS) {
    const { id, ...data } = v;
    await db.collection('versiculos').doc(id).set(data, { merge: true });
  }
  console.log(`✔ ${FAQS.length} FAQ y ${VERSICULOS.length} versículos sembrados.`);

  // 7. Datos demostrativos (1 cita próxima + 1 tratamiento en 3 cuotas con 1 pago)
  const hoy = ahoraBolivia().fecha;
  // Buscar el siguiente día hábil (Lunes a Sábado) a partir de mañana
  let fechaDemo = sumarDias(hoy, 1);
  const dow = new Date(`${fechaDemo}T12:00:00Z`).getUTCDay();
  if (dow === 0) fechaDemo = sumarDias(hoy, 2);

  const citaDemoRef = db.collection('citas').doc('cita-demo-1');
  if (!(await citaDemoRef.get()).exists) {
    await citaDemoRef.set({
      clienteId: 'cliente-demo',
      clienteNombre: 'María González (Demo)',
      clienteTelefono: '+591 71122334',
      sucursalId: 'villa-fatima',
      sucursalNombre: 'Villa Fátima',
      servicioId: 'fac-limpieza-profunda',
      servicioNombre: 'Limpieza facial profunda',
      precio: 150.0,
      fecha: fechaDemo,
      hora: '10:00',
      horaFin: '11:00',
      duracionMin: 60,
      estado: 'confirmada',
      canal: 'web',
      notas: 'Cita de ejemplo creada por seed',
      recordatorioEnviado: false,
      creadoPor: 'cliente-demo',
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    });
  }

  const tratDemoRef = db.collection('tratamientos').doc('tratamiento-demo-1');
  if (!(await tratDemoRef.get()).exists) {
    const cuotas = repartirCuotas(300.0, 3, hoy);
    cuotas[0].pagado = cuotas[0].monto;
    cuotas[0].saldo = 0;
    cuotas[0].estado = 'pagada';

    await tratDemoRef.set({
      clienteId: 'cliente-demo',
      clienteNombre: 'María González (Demo)',
      sucursalId: 'villa-fatima',
      sucursalNombre: 'Villa Fátima',
      servicioId: 'luna-cuerpo-completo',
      servicioNombre: 'Baño de Luna cuerpo completo (Plan 3 cuotas)',
      fecha: hoy,
      notas: 'Plan demostrativo con primera cuota cancelada por QR.',
      total: 300.0,
      saldo: 200.0,
      estado: 'activo',
      cuotas,
      creadoPor: 'encargado-villa-fatima',
      creadoPorNombre: 'Encargada Villa Fátima',
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    });

    await db.collection('pagos').doc('pago-demo-1').set({
      tratamientoId: 'tratamiento-demo-1',
      clienteId: 'cliente-demo',
      clienteNombre: 'María González (Demo)',
      sucursalId: 'villa-fatima',
      sucursalNombre: 'Villa Fátima',
      servicioNombre: 'Baño de Luna cuerpo completo (Plan 3 cuotas)',
      monto: 100.0,
      metodo: 'qr',
      numeroCuota: 1,
      cuotasAfectadas: [1],
      saldoDespues: 200.0,
      notas: 'Primera cuota abonada al iniciar el tratamiento',
      usuarioId: 'encargado-villa-fatima',
      usuarioNombre: 'Encargada Villa Fátima',
      fechaStr: hoy,
      fecha: FieldValue.serverTimestamp(),
    });
  }

  console.log('\n==============================================================');
  console.log(' SEED COMPLETADO — CREDENCIALES DE ACCESO LOCAL');
  console.log('==============================================================');
  console.log(' Admin:      admin@talitakumi.com                / Admin123!');
  console.log(' Enc. VF:    encargado.villafatima@talitakumi.com / Encargado123!');
  console.log(' Enc. UPEA:  encargado.upea@talitakumi.com        / Encargado123!');
  console.log(' Enc. Ceja:  encargado.ceja@talitakumi.com        / Encargado123!');
  console.log(' Enc. MP:    encargado.maxparedes@talitakumi.com  / Encargado123!');
  console.log(' Cliente:    cliente@talitakumi.com               / Cliente123!');
  console.log('==============================================================\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error al ejecutar seed:', err);
    process.exit(1);
  });
