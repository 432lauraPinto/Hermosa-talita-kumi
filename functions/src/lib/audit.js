const { db, FieldValue } = require('./firebase');

/**
 * Registra un evento en la bitácora inmutable `auditoria`.
 * Si se pasa una transacción `tx`, escribe dentro de la misma transacción atómica.
 */
async function registrarAuditoria(
  {
    accion,
    modulo,
    entidadId = null,
    sucursalId = null,
    usuarioId = 'sistema',
    usuarioEmail = null,
    usuarioRol = 'sistema',
    detalle = {},
  },
  tx = null
) {
  const ref = db.collection('auditoria').doc();
  const doc = {
    accion,
    modulo,
    entidadId,
    sucursalId,
    usuarioId,
    usuarioEmail,
    usuarioRol,
    detalle,
    fecha: FieldValue.serverTimestamp(),
  };

  if (tx) {
    tx.set(ref, doc);
    return ref.id;
  }
  await ref.set(doc);
  return ref.id;
}

module.exports = { registrarAuditoria };
