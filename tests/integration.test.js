/**
 * Pruebas de integración contra los emuladores reales de Firebase (Auth + Firestore + Functions).
 * Ejecutar con:
 *   npm run test:integration
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const { initializeApp: initAdminApp, getApps: getAdminApps } = require('firebase-admin/app');
const { getFirestore: getAdminFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');
const { initializeApp, deleteApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');
const { ahoraBolivia, sumarDias } = require('../functions/src/lib/time');

const PROJECT_ID = 'demo-hermosa-talita-kumi';
const N8N_API_BASE = `http://127.0.0.1:5001/${PROJECT_ID}/southamerica-east1/n8nApi`;
const N8N_KEY = 'htk-demo-n8n-secret-key-2026';

let adminDb;
let adminAuth;
const clientApps = [];

function createClientCtx(name) {
  const app = initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
    },
    name
  );
  clientApps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const fns = getFunctions(app, 'southamerica-east1');
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  return {
    auth,
    call: async (fnName, data = {}) => (await httpsCallable(fns, fnName)(data)).data,
  };
}

function proximaFechaHabil(offsetDias = 3) {
  let f = sumarDias(ahoraBolivia().fecha, offsetDias);
  const dow = new Date(`${f}T12:00:00Z`).getUTCDay();
  if (dow === 0) f = sumarDias(f, 1);
  return f;
}

async function seedMinimo() {
  const users = [
    { uid: 'int-admin', email: 'int.admin@htk.bo', pass: 'Pass123!', nombre: 'Admin Int', role: 'admin', sucursales: [] },
    { uid: 'int-enc', email: 'int.enc@htk.bo', pass: 'Pass123!', nombre: 'Encargada VF', role: 'encargado', sucursales: ['villa-fatima'] },
    { uid: 'int-cli1', email: 'int.cli1@htk.bo', pass: 'Pass123!', nombre: 'Cliente Uno', role: 'cliente', sucursales: [] },
    { uid: 'int-cli2', email: 'int.cli2@htk.bo', pass: 'Pass123!', nombre: 'Cliente Dos', role: 'cliente', sucursales: [] },
  ];

  for (const u of users) {
    try {
      await adminAuth.deleteUser(u.uid);
    } catch (_e) {
      // ignore
    }
    await adminAuth.createUser({ uid: u.uid, email: u.email, password: u.pass, displayName: u.nombre });
    await adminAuth.setCustomUserClaims(u.uid, { role: u.role, sucursales: u.sucursales });
    await adminDb.collection('users').doc(u.uid).set({
      nombre: u.nombre,
      telefono: '+591 70000000',
      email: u.email,
      role: u.role,
      sucursales: u.sucursales,
      activo: true,
      creadoEn: FieldValue.serverTimestamp(),
    });
  }

  await adminDb.collection('sucursales').doc('villa-fatima').set({
    nombre: 'Villa Fátima',
    ciudad: 'La Paz',
    direccion: 'Av. Las Américas',
    whatsapp: '+591 77197857',
    horario: { apertura: '08:30', cierre: '19:30', dias: [1, 2, 3, 4, 5, 6], slotMin: 30 },
    capacidad: 1, // Capacidad 1 para probar carrera directa con 2 clientes concurrentes
    activa: true,
  });

  await adminDb.collection('sucursales').doc('upea').set({
    nombre: 'UPEA – El Alto',
    ciudad: 'El Alto',
    direccion: 'Av. Sucre A',
    whatsapp: '+591 79688750',
    horario: { apertura: '08:30', cierre: '19:30', dias: [1, 2, 3, 4, 5, 6], slotMin: 30 },
    capacidad: 2,
    activa: true,
  });

  await adminDb.collection('servicios').doc('serv-limpieza').set({
    nombre: 'Limpieza facial profunda',
    descripcion: 'Limpieza con vapor de ozono',
    precio: 150.0,
    duracionMin: 60,
    categoria: 'Tratamientos faciales',
    sucursales: ['villa-fatima', 'upea'],
    activo: true,
  });

  await adminDb.collection('productos').doc('prod-serum').set({
    nombre: 'Sérum Hialurónico',
    precio: 140.0,
    stockMinimo: 3,
    activo: true,
  });

  await adminDb.collection('faq').doc('faq-1').set({
    pregunta: '¿Horario de atención?',
    respuesta: 'Atendemos de lunes a sábado de 08:30 a 19:30.',
    palabrasClave: ['horario', 'atencion'],
  });
}

let adminCtx;
let encCtx;
let cli1Ctx;
let cli2Ctx;

before(async () => {
  if (getAdminApps().length === 0) {
    initAdminApp({ projectId: PROJECT_ID });
  }
  adminDb = getAdminFirestore();
  adminAuth = getAdminAuth();

  await seedMinimo();

  adminCtx = createClientCtx('admin-app');
  encCtx = createClientCtx('enc-app');
  cli1Ctx = createClientCtx('cli1-app');
  cli2Ctx = createClientCtx('cli2-app');

  await signInWithEmailAndPassword(adminCtx.auth, 'int.admin@htk.bo', 'Pass123!');
  await signInWithEmailAndPassword(encCtx.auth, 'int.enc@htk.bo', 'Pass123!');
  await signInWithEmailAndPassword(cli1Ctx.auth, 'int.cli1@htk.bo', 'Pass123!');
  await signInWithEmailAndPassword(cli2Ctx.auth, 'int.cli2@htk.bo', 'Pass123!');
});

after(async () => {
  for (const app of clientApps) {
    await deleteApp(app);
  }
});

describe('Integración contra emuladores de Firebase', () => {
  it('dos reservas simultáneas al mismo único cupo: exactamente una pasa y la otra falla', async () => {
    const fecha = proximaFechaHabil(3);

    const resultados = await Promise.allSettled([
      cli1Ctx.call('crearCita', {
        sucursalId: 'villa-fatima',
        servicioId: 'serv-limpieza',
        fecha,
        hora: '10:00',
      }),
      cli2Ctx.call('crearCita', {
        sucursalId: 'villa-fatima',
        servicioId: 'serv-limpieza',
        fecha,
        hora: '10:00',
      }),
    ]);

    const exitosas = resultados.filter((r) => r.status === 'fulfilled');
    const fallidas = resultados.filter((r) => r.status === 'rejected');

    assert.equal(exitosas.length, 1, 'Solo una reserva simultánea debe pasar');
    assert.equal(fallidas.length, 1, 'La segunda reserva simultánea debe ser rechazada');

    // Verificar también que el cliente ganador no puede tener otra cita cruzada en otra sucursal (upea)
    const ganadorCtx = resultados[0].status === 'fulfilled' ? cli1Ctx : cli2Ctx;
    await assert.rejects(
      ganadorCtx.call('crearCita', {
        sucursalId: 'upea',
        servicioId: 'serv-limpieza',
        fecha,
        hora: '10:30',
      }),
      /cruza/i
    );
  });

  it('inventario: movimientos, transferencia consistente entre sucursales y auditarInventario sin diferencias', async () => {
    // 1. Entrada inicial de 10 unidades en villa-fatima
    const entrada = await encCtx.call('registrarMovimiento', {
      sucursalId: 'villa-fatima',
      productoId: 'prod-serum',
      tipo: 'entrada',
      cantidad: 10,
      motivo: 'Compra proveedor',
    });
    assert.equal(entrada.stockAntes, 0);
    assert.equal(entrada.stockDespues, 10);

    // 2. Transferencia de 4 unidades de villa-fatima a upea
    const trans = await encCtx.call('transferirProducto', {
      sucursalOrigenId: 'villa-fatima',
      sucursalDestinoId: 'upea',
      productoId: 'prod-serum',
      cantidad: 4,
      motivo: 'Reposición UPEA',
    });
    assert.equal(trans.origen.stockDespues, 6);
    assert.equal(trans.destino.stockDespues, 4);

    // 3. Rechazar salida mayor al stock disponible (evita stock negativo)
    await assert.rejects(
      encCtx.call('registrarMovimiento', {
        sucursalId: 'villa-fatima',
        productoId: 'prod-serum',
        tipo: 'venta',
        cantidad: 99,
      }),
      /insuficiente/i
    );

    // 4. Auditar inventario (solo admin) -> 0 diferencias
    const audit = await adminCtx.call('auditarInventario');
    assert.equal(audit.ok, true);
    assert.equal(audit.totalDiferencias, 0);
  });

  it('tratamientos y pagos: rechaza pago mayor al saldo y cierra tratamiento en 0', async () => {
    const trat = await encCtx.call('registrarTratamiento', {
      clienteId: 'int-cli1',
      sucursalId: 'villa-fatima',
      servicioId: 'serv-limpieza',
      total: 100.0,
      cantidadCuotas: 3,
      notas: 'Plan 3 cuotas integración',
    });

    assert.equal(trat.cuotas.length, 3);
    assert.equal(trat.saldo, 100);

    // Pago mayor al saldo rechazado
    await assert.rejects(
      encCtx.call('registrarPago', {
        tratamientoId: trat.id,
        monto: 120.0,
        metodo: 'efectivo',
      }),
      /excede el saldo/i
    );

    // Pago parcial + pago final -> cierra en 0
    const p1 = await encCtx.call('registrarPago', {
      tratamientoId: trat.id,
      monto: 40.0,
      metodo: 'qr',
    });
    assert.equal(p1.saldoRestante, 60);
    assert.equal(p1.tratamientoCerrado, false);

    const p2 = await encCtx.call('registrarPago', {
      tratamientoId: trat.id,
      monto: 60.0,
      metodo: 'efectivo',
    });
    assert.equal(p2.saldoRestante, 0);
    assert.equal(p2.tratamientoCerrado, true);
  });

  it('chatbot responde con motor de respaldo local cuando n8n está apagado y n8nApi exige x-api-key', async () => {
    // Chatbot fallback
    const chatRes = await cli1Ctx.call('chatbotMensaje', {
      mensaje: '¿Cuánto cuesta la limpieza facial?',
      sessionId: 'test-session-1',
    });
    assert.equal(chatRes.origenRespuesta, 'fallback_local');
    assert.match(chatRes.respuesta, /Bs 150\.00/);

    // n8nApi sin API key -> 401
    const unauth = await fetch(`${N8N_API_BASE}/servicios`);
    assert.equal(unauth.status, 401);

    // n8nApi con API key -> 200
    const okResp = await fetch(`${N8N_API_BASE}/servicios`, {
      headers: { 'x-api-key': N8N_KEY },
    });
    assert.equal(okResp.status, 200);
    const body = await okResp.json();
    assert.equal(body.ok, true);
    assert.ok(body.servicios.length >= 1);

    // n8nApi saldo de cliente
    const saldoResp = await fetch(`${N8N_API_BASE}/saldo?clienteId=int-cli1`, {
      headers: { 'x-api-key': N8N_KEY },
    });
    assert.equal(saldoResp.status, 200);
    const saldoBody = await saldoResp.json();
    assert.equal(saldoBody.saldoTotal, 0);
  });

  it('registro (crearPerfil): valida teléfono Bolivia, términos obligatorios y nunca pisa rol existente', async () => {
    const nuevoUid = 'int-nuevo-reg';
    try {
      await adminAuth.deleteUser(nuevoUid);
    } catch (_e) {
      // ignore
    }
    await adminAuth.createUser({
      uid: nuevoUid,
      email: 'nuevo.cliente@htk.bo',
      password: 'Password123',
      displayName: 'Lucía Mamani',
    });

    const nuevoCtx = createClientCtx('nuevo-reg-app');
    await signInWithEmailAndPassword(nuevoCtx.auth, 'nuevo.cliente@htk.bo', 'Password123');

    // Rechaza si no acepta términos
    await assert.rejects(
      nuevoCtx.call('crearPerfil', {
        nombre: 'Lucía Mamani',
        telefono: '75551234',
        aceptaTerminos: false,
      }),
      /términos/i
    );

    // Rechaza teléfono fijo / inválido de Bolivia
    await assert.rejects(
      nuevoCtx.call('crearPerfil', {
        nombre: 'Lucía Mamani',
        telefono: '22112233',
        aceptaTerminos: true,
      }),
      /celular válido de Bolivia/i
    );

    // Registro válido con normalización de teléfono y sucursal preferida
    const creado = await nuevoCtx.call('crearPerfil', {
      nombre: '  Lucía   Mamani  ',
      telefono: '75551234',
      sucursalPreferida: 'villa-fatima',
      aceptaWhatsapp: true,
      aceptaTerminos: true,
    });
    assert.equal(creado.creado, true);
    assert.equal(creado.perfil.nombre, 'Lucía Mamani');
    assert.equal(creado.perfil.telefono, '+591 75551234');
    assert.equal(creado.perfil.sucursalPreferida, 'villa-fatima');
    assert.equal(creado.perfil.role, 'cliente');

    // Llamar crearPerfil desde un admin existente NUNCA sobrescribe su rol
    const noPisa = await adminCtx.call('crearPerfil', {
      nombre: 'Intento Sobrescribir',
      telefono: '70000001',
      aceptaTerminos: true,
    });
    assert.equal(noPisa.creado, false);
    assert.equal(noPisa.perfil.role, 'admin');
  });
});
