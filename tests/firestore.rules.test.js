const fs = require('fs');
const path = require('path');
const { describe, it, before, after, beforeEach } = require('node:test');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

const PROJECT_ID = 'demo-hermosa-talita-kumi';

let testEnv;

before(async () => {
  const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules,
    },
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'admin-1'), {
      nombre: 'Admin',
      telefono: '+591 70000001',
      email: 'admin@htk.bo',
      role: 'admin',
      sucursales: [],
      activo: true,
    });
    await setDoc(doc(db, 'users', 'enc-vf'), {
      nombre: 'Encargada VF',
      telefono: '+591 70000002',
      email: 'vf@htk.bo',
      role: 'encargado',
      sucursales: ['villa-fatima'],
      activo: true,
    });
    await setDoc(doc(db, 'users', 'cli-a'), {
      nombre: 'Cliente A',
      telefono: '+591 71111111',
      email: 'a@htk.bo',
      role: 'cliente',
      sucursales: [],
      activo: true,
    });
    await setDoc(doc(db, 'users', 'cli-b'), {
      nombre: 'Cliente B',
      telefono: '+591 72222222',
      email: 'b@htk.bo',
      role: 'cliente',
      sucursales: [],
      activo: true,
    });
    await setDoc(doc(db, 'users', 'cli-inactivo'), {
      nombre: 'Cliente Inactivo',
      telefono: '+591 73333333',
      email: 'inactivo@htk.bo',
      role: 'cliente',
      sucursales: [],
      activo: false,
    });

    await setDoc(doc(db, 'servicios', 's1'), {
      nombre: 'Limpieza facial',
      precio: 150,
      duracionMin: 60,
      activo: true,
    });
    await setDoc(doc(db, 'citas', 'cita-a-vf'), {
      clienteId: 'cli-a',
      sucursalId: 'villa-fatima',
      servicioId: 's1',
      fecha: '2026-12-01',
      hora: '10:00',
      estado: 'pendiente',
    });
    await setDoc(doc(db, 'citas', 'cita-b-upea'), {
      clienteId: 'cli-b',
      sucursalId: 'upea',
      servicioId: 's1',
      fecha: '2026-12-01',
      hora: '11:00',
      estado: 'pendiente',
    });
    await setDoc(doc(db, 'pagos', 'pago-b'), {
      clienteId: 'cli-b',
      sucursalId: 'upea',
      monto: 100,
    });
    await setDoc(doc(db, 'inventario', 'villa-fatima_p1'), {
      sucursalId: 'villa-fatima',
      productoId: 'p1',
      stock: 10,
    });
    await setDoc(doc(db, 'inventario', 'upea_p1'), {
      sucursalId: 'upea',
      productoId: 'p1',
      stock: 5,
    });
    await setDoc(doc(db, 'auditoria', 'aud-1'), {
      accion: 'CITA_CREADA',
    });
    await setDoc(doc(db, 'chats', 'chat-1'), {
      uid: 'cli-a',
    });
  });
});

describe('Reglas de seguridad de Firestore (firestore.rules)', () => {
  it('catálogo es público para lectura, pero solo admin puede escribir', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const cliDb = testEnv.authenticatedContext('cli-a').firestore();
    const adminDb = testEnv.authenticatedContext('admin-1').firestore();

    await assertSucceeds(getDoc(doc(anonDb, 'servicios', 's1')));
    await assertFails(updateDoc(doc(cliDb, 'servicios', 's1'), { precio: 1 }));
    await assertSucceeds(updateDoc(doc(adminDb, 'servicios', 's1'), { precio: 160 }));
  });

  it('un cliente lee sus propias citas pero NO lee citas ni pagos ajenos', async () => {
    const cliADb = testEnv.authenticatedContext('cli-a').firestore();

    await assertSucceeds(getDoc(doc(cliADb, 'citas', 'cita-a-vf')));
    await assertFails(getDoc(doc(cliADb, 'citas', 'cita-b-upea')));
    await assertFails(getDoc(doc(cliADb, 'pagos', 'pago-b')));
  });

  it('un encargado accede a su sucursal pero NO accede a otra sucursal', async () => {
    const encDb = testEnv.authenticatedContext('enc-vf').firestore();

    await assertSucceeds(getDoc(doc(encDb, 'citas', 'cita-a-vf')));
    await assertSucceeds(getDoc(doc(encDb, 'inventario', 'villa-fatima_p1')));

    await assertFails(getDoc(doc(encDb, 'citas', 'cita-b-upea')));
    await assertFails(getDoc(doc(encDb, 'inventario', 'upea_p1')));
  });

  it('nadie escribe directamente en citas ni inventario desde el navegador', async () => {
    const cliDb = testEnv.authenticatedContext('cli-a').firestore();
    const encDb = testEnv.authenticatedContext('enc-vf').firestore();
    const adminDb = testEnv.authenticatedContext('admin-1').firestore();

    await assertFails(setDoc(doc(cliDb, 'citas', 'nueva'), { clienteId: 'cli-a' }));
    await assertFails(setDoc(doc(encDb, 'citas', 'nueva'), { sucursalId: 'villa-fatima' }));
    await assertFails(setDoc(doc(adminDb, 'citas', 'nueva'), { sucursalId: 'villa-fatima' }));

    await assertFails(updateDoc(doc(encDb, 'inventario', 'villa-fatima_p1'), { stock: 999 }));
    await assertFails(updateDoc(doc(adminDb, 'inventario', 'villa-fatima_p1'), { stock: 999 }));
  });

  it('un usuario puede editar sus datos de perfil permitidos pero NO role, activo ni campos prohibidos', async () => {
    const cliADb = testEnv.authenticatedContext('cli-a').firestore();

    await assertSucceeds(
      updateDoc(doc(cliADb, 'users', 'cli-a'), {
        nombre: 'Cliente A Editado',
        telefono: '+591 79999999',
        sucursalPreferida: 'villa-fatima',
        aceptaWhatsapp: true,
        fechaNacimiento: '1995-04-12',
      })
    );

    await assertFails(updateDoc(doc(cliADb, 'users', 'cli-a'), { role: 'admin' }));
    await assertFails(updateDoc(doc(cliADb, 'users', 'cli-a'), { sucursales: ['villa-fatima'] }));
    await assertFails(updateDoc(doc(cliADb, 'users', 'cli-a'), { activo: false }));
    await assertFails(updateDoc(doc(cliADb, 'users', 'cli-a'), { tipoPiel: 'Seca' }));
  });

  it('solo admin lee auditoria y chats; usuarios inactivos quedan bloqueados', async () => {
    const encDb = testEnv.authenticatedContext('enc-vf').firestore();
    const adminDb = testEnv.authenticatedContext('admin-1').firestore();
    const inactivoDb = testEnv.authenticatedContext('cli-inactivo').firestore();

    await assertFails(getDoc(doc(encDb, 'auditoria', 'aud-1')));
    await assertFails(getDoc(doc(encDb, 'chats', 'chat-1')));
    await assertSucceeds(getDoc(doc(adminDb, 'auditoria', 'aud-1')));
    await assertSucceeds(getDoc(doc(adminDb, 'chats', 'chat-1')));

    await assertFails(updateDoc(doc(inactivoDb, 'users', 'cli-inactivo'), { nombre: 'Hack' }));
  });
});
