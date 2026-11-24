const { HttpsError } = require('firebase-functions/v2/https');
const { db, auth, FieldValue } = require('../lib/firebase');
const { registrarAuditoria } = require('../lib/audit');
const {
  validarNombreCompleto,
  validarTelefonoBolivia,
  validarFechaNacimiento,
} = require('../lib/validators');

const ROLES_VALIDOS = ['admin', 'encargado', 'cliente'];

/**
 * Crea el perfil en `users/{uid}` con rol `cliente` tras el registro en Auth.
 * Valida nombre completo, teléfono celular Bolivia, términos y sucursal preferida opcional.
 * NUNCA sobrescribe un perfil o rol existente.
 */
async function crearPerfilCore({
  authContext,
  nombre = '',
  telefono = '',
  sucursalPreferida = null,
  aceptaWhatsapp = true,
  aceptaTerminos = false,
  fechaNacimiento = null,
}) {
  if (!authContext || !authContext.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para crear tu perfil.');
  }

  const uid = authContext.uid;
  const email = String(authContext.token?.email || '').trim().toLowerCase();
  const userRef = db.collection('users').doc(uid);

  // Comprobar primero si ya existe para ser idempotente y nunca pisar roles existentes
  const existenteSnap = await userRef.get();
  if (existenteSnap.exists) {
    return { creado: false, perfil: { uid, ...existenteSnap.data() } };
  }

  // Validaciones de negocio para nuevo registro de cliente
  if (aceptaTerminos !== true) {
    throw new HttpsError(
      'invalid-argument',
      'Debes aceptar los Términos de uso, Privacidad y la política de cancelación (2 h).'
    );
  }

  const checkNombre = validarNombreCompleto(nombre || authContext.token?.name || '');
  if (!checkNombre.valido) {
    throw new HttpsError('invalid-argument', checkNombre.motivo);
  }

  const checkTel = validarTelefonoBolivia(telefono);
  if (!checkTel.valido) {
    throw new HttpsError('invalid-argument', checkTel.motivo);
  }

  const checkFechaNac = validarFechaNacimiento(fechaNacimiento);
  if (!checkFechaNac.valido) {
    throw new HttpsError('invalid-argument', checkFechaNac.motivo);
  }

  let sucursalPrefLimpia = null;
  if (sucursalPreferida && String(sucursalPreferida).trim() !== '') {
    const sucId = String(sucursalPreferida).trim();
    const sucSnap = await db.collection('sucursales').doc(sucId).get();
    if (!sucSnap.exists || sucSnap.data().activa === false) {
      throw new HttpsError('invalid-argument', 'La sucursal preferida seleccionada no es válida.');
    }
    sucursalPrefLimpia = sucId;
  }

  const resultado = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (snap.exists) {
      return { creado: false, perfil: { uid, ...snap.data() } };
    }

    const nuevoPerfil = {
      nombre: checkNombre.valor,
      telefono: checkTel.valor,
      email,
      role: 'cliente',
      sucursales: [],
      sucursalPreferida: sucursalPrefLimpia,
      aceptaWhatsapp: Boolean(aceptaWhatsapp),
      aceptaTerminos: true,
      aceptaTerminosEn: FieldValue.serverTimestamp(),
      fechaNacimiento: checkFechaNac.valor,
      activo: true,
      creadoEn: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    tx.set(userRef, nuevoPerfil);
    return { creado: true, perfil: { uid, ...nuevoPerfil } };
  });

  if (resultado.creado) {
    await auth.setCustomUserClaims(uid, { role: 'cliente', sucursales: [] });
    await registrarAuditoria({
      accion: 'PERFIL_CLIENTE_CREADO',
      modulo: 'usuarios',
      entidadId: uid,
      sucursalId: sucursalPrefLimpia,
      usuarioId: uid,
      usuarioEmail: email,
      usuarioRol: 'cliente',
      detalle: {
        nombre: checkNombre.valor,
        sucursalPreferida: sucursalPrefLimpia,
        aceptaWhatsapp: Boolean(aceptaWhatsapp),
      },
    });
  }

  return resultado;
}

/**
 * Solo admin: crea un usuario de personal (encargado o admin) en Auth + Firestore + Custom Claims.
 */
async function crearStaffCore({ actor, nombre, email, password, telefono = '', role = 'encargado', sucursales = [] }) {
  if (!nombre || !email || !password) {
    throw new HttpsError('invalid-argument', 'Debes indicar nombre, email y contraseña (mínimo 6 caracteres).');
  }
  if (!['admin', 'encargado'].includes(role)) {
    throw new HttpsError('invalid-argument', 'El rol de personal debe ser "admin" o "encargado".');
  }
  if (String(password).length < 6) {
    throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
  }

  const sucursalesLimpias =
    role === 'admin'
      ? []
      : Array.isArray(sucursales)
      ? Array.from(new Set(sucursales.map(String).filter(Boolean)))
      : [];

  if (role === 'encargado' && sucursalesLimpias.length === 0) {
    throw new HttpsError('invalid-argument', 'Debes asignar al menos una sucursal al encargado.');
  }

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      displayName: String(nombre).trim().slice(0, 120),
    });
  } catch (err) {
    throw new HttpsError('already-exists', `No se pudo crear el usuario en Auth: ${err.message}`);
  }

  const uid = userRecord.uid;
  const perfil = {
    nombre: String(nombre).trim().slice(0, 120),
    telefono: String(telefono || '').trim().slice(0, 30),
    email: userRecord.email,
    role,
    sucursales: sucursalesLimpias,
    activo: true,
    creadoEn: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(uid).set(perfil);
  await auth.setCustomUserClaims(uid, { role, sucursales: sucursalesLimpias });

  await registrarAuditoria({
    accion: 'STAFF_CREADO',
    modulo: 'usuarios',
    entidadId: uid,
    usuarioId: actor.uid,
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: { email: userRecord.email, role, sucursales: sucursalesLimpias },
  });

  return { uid, ...perfil };
}

/**
 * Solo admin: actualiza rol, sucursales y/o estado activo de un usuario y sincroniza Custom Claims.
 */
async function asignarRolCore({ actor, targetUid, role, sucursales = null, activo = null }) {
  if (!targetUid || !ROLES_VALIDOS.includes(role)) {
    throw new HttpsError('invalid-argument', 'Debes indicar targetUid y un rol válido (admin/encargado/cliente).');
  }

  const userRef = db.collection('users').doc(targetUid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado.');
  }

  const actual = snap.data();
  const sucursalesFinal =
    role === 'encargado'
      ? Array.isArray(sucursales)
        ? Array.from(new Set(sucursales.map(String).filter(Boolean)))
        : actual.sucursales || []
      : [];

  const activoFinal = typeof activo === 'boolean' ? activo : actual.activo !== false;

  await userRef.update({
    role,
    sucursales: sucursalesFinal,
    activo: activoFinal,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await auth.setCustomUserClaims(targetUid, { role, sucursales: sucursalesFinal });

  await registrarAuditoria({
    accion: 'ROL_ASIGNADO',
    modulo: 'usuarios',
    entidadId: targetUid,
    usuarioId: actor.uid,
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: {
      antes: { role: actual.role, sucursales: actual.sucursales || [], activo: actual.activo },
      despues: { role, sucursales: sucursalesFinal, activo: activoFinal },
    },
  });

  return { uid: targetUid, role, sucursales: sucursalesFinal, activo: activoFinal };
}

module.exports = {
  crearPerfilCore,
  crearStaffCore,
  asignarRolCore,
};
