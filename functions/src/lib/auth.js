const { HttpsError } = require('firebase-functions/v2/https');
const { db } = require('./firebase');

async function obtenerPerfilUsuario(uid) {
  if (!uid) return null;
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { uid: snap.id, ...snap.data() };
}

async function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para realizar esta operación.');
  }
  const perfil = await obtenerPerfilUsuario(request.auth.uid);
  if (!perfil) {
    throw new HttpsError('permission-denied', 'No se encontró un perfil activo para tu cuenta.');
  }
  if (perfil.activo === false) {
    throw new HttpsError('permission-denied', 'Tu cuenta se encuentra desactivada. Contacta al administrador.');
  }
  return perfil;
}

async function requireAdmin(request) {
  const perfil = await requireAuth(request);
  if (perfil.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Esta acción está reservada solo para el administrador.');
  }
  return perfil;
}

async function requireStaff(request) {
  const perfil = await requireAuth(request);
  if (perfil.role !== 'admin' && perfil.role !== 'encargado') {
    throw new HttpsError('permission-denied', 'Solo el personal autorizado puede realizar esta acción.');
  }
  return perfil;
}

function puedeOperarSucursal(perfil, sucursalId) {
  if (!perfil || perfil.activo === false) return false;
  if (perfil.role === 'admin') return true;
  if (perfil.role === 'encargado') {
    return Array.isArray(perfil.sucursales) && perfil.sucursales.includes(sucursalId);
  }
  return false;
}

async function requireStaffDeSucursal(request, sucursalId) {
  const perfil = await requireStaff(request);
  if (!sucursalId || !puedeOperarSucursal(perfil, sucursalId)) {
    throw new HttpsError('permission-denied', 'No tienes permisos para operar en la sucursal indicada.');
  }
  return perfil;
}

module.exports = {
  obtenerPerfilUsuario,
  requireAuth,
  requireAdmin,
  requireStaff,
  puedeOperarSucursal,
  requireStaffDeSucursal,
};
