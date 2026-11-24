const { HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../lib/firebase');
const { registrarAuditoria } = require('../lib/audit');
const { puedeOperarSucursal } = require('../lib/auth');

const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'venta'];

function inventarioDocId(sucursalId, productoId) {
  return `${sucursalId}_${productoId}`;
}

async function registrarMovimientoCore({ actor, sucursalId, productoId, tipo, cantidad, motivo = '' }) {
  if (!sucursalId || !productoId || !TIPOS_MOVIMIENTO.includes(tipo)) {
    throw new HttpsError('invalid-argument', 'Parámetros inválidos: sucursalId, productoId y tipo (entrada/salida/venta).');
  }

  const qty = Number(cantidad);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad debe ser un número entero mayor a 0.');
  }

  if (!puedeOperarSucursal(actor, sucursalId)) {
    throw new HttpsError('permission-denied', 'No tienes permiso para modificar inventario de esta sucursal.');
  }

  const sucRef = db.collection('sucursales').doc(sucursalId);
  const prodRef = db.collection('productos').doc(productoId);
  const invRef = db.collection('inventario').doc(inventarioDocId(sucursalId, productoId));

  return await db.runTransaction(async (tx) => {
    const [sucSnap, prodSnap, invSnap] = await Promise.all([
      tx.get(sucRef),
      tx.get(prodRef),
      tx.get(invRef),
    ]);

    if (!sucSnap.exists) throw new HttpsError('not-found', 'Sucursal no encontrada.');
    if (!prodSnap.exists) throw new HttpsError('not-found', 'Producto no encontrado.');

    const sucursal = sucSnap.data();
    const producto = prodSnap.data();
    const stockAntes = invSnap.exists ? Number(invSnap.data().stock || 0) : 0;
    const delta = tipo === 'entrada' ? qty : -qty;
    const stockDespues = stockAntes + delta;

    if (stockDespues < 0) {
      throw new HttpsError(
        'failed-precondition',
        `Stock insuficiente para ${producto.nombre} en ${sucursal.nombre}. Disponible: ${stockAntes}, solicitado: ${qty}.`
      );
    }

    tx.set(
      invRef,
      {
        sucursalId,
        sucursalNombre: sucursal.nombre,
        productoId,
        productoNombre: producto.nombre,
        stock: stockDespues,
        stockMinimo: Number(producto.stockMinimo ?? 2),
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const movRef = db.collection('movimientos').doc();
    const movDoc = {
      tipo,
      direccion: delta > 0 ? 'entrada' : 'salida',
      cantidad: qty,
      delta,
      stockAntes,
      stockDespues,
      sucursalId,
      sucursalNombre: sucursal.nombre,
      productoId,
      productoNombre: producto.nombre,
      motivo: String(motivo || '').slice(0, 300),
      usuario: actor.nombre || actor.email || actor.uid,
      usuarioId: actor.uid,
      fecha: FieldValue.serverTimestamp(),
    };
    tx.set(movRef, movDoc);

    await registrarAuditoria(
      {
        accion: `INVENTARIO_${tipo.toUpperCase()}`,
        modulo: 'inventario',
        entidadId: movRef.id,
        sucursalId,
        usuarioId: actor.uid,
        usuarioEmail: actor.email || null,
        usuarioRol: actor.role,
        detalle: { productoId, cantidad: qty, stockAntes, stockDespues, motivo },
      },
      tx
    );

    return {
      movimientoId: movRef.id,
      sucursalId,
      productoId,
      tipo,
      cantidad: qty,
      stockAntes,
      stockDespues,
    };
  });
}

async function transferirProductoCore({
  actor,
  sucursalOrigenId,
  sucursalDestinoId,
  productoId,
  cantidad,
  motivo = '',
}) {
  if (!sucursalOrigenId || !sucursalDestinoId || !productoId) {
    throw new HttpsError('invalid-argument', 'Debes indicar sucursalOrigenId, sucursalDestinoId y productoId.');
  }
  if (sucursalOrigenId === sucursalDestinoId) {
    throw new HttpsError('invalid-argument', 'La sucursal de origen y destino deben ser distintas.');
  }

  const qty = Number(cantidad);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad a transferir debe ser un entero mayor a 0.');
  }

  if (!puedeOperarSucursal(actor, sucursalOrigenId)) {
    throw new HttpsError('permission-denied', 'No tienes permiso para transferir desde la sucursal de origen.');
  }

  const origenSucRef = db.collection('sucursales').doc(sucursalOrigenId);
  const destinoSucRef = db.collection('sucursales').doc(sucursalDestinoId);
  const prodRef = db.collection('productos').doc(productoId);
  const invOrigenRef = db.collection('inventario').doc(inventarioDocId(sucursalOrigenId, productoId));
  const invDestinoRef = db.collection('inventario').doc(inventarioDocId(sucursalDestinoId, productoId));

  return await db.runTransaction(async (tx) => {
    // Todas las lecturas antes que las escrituras
    const [oriSucSnap, destSucSnap, prodSnap, invOriSnap, invDestSnap] = await Promise.all([
      tx.get(origenSucRef),
      tx.get(destinoSucRef),
      tx.get(prodRef),
      tx.get(invOrigenRef),
      tx.get(invDestinoRef),
    ]);

    if (!oriSucSnap.exists) throw new HttpsError('not-found', 'Sucursal origen no encontrada.');
    if (!destSucSnap.exists) throw new HttpsError('not-found', 'Sucursal destino no encontrada.');
    if (!prodSnap.exists) throw new HttpsError('not-found', 'Producto no encontrado.');

    const sucOrigen = oriSucSnap.data();
    const sucDestino = destSucSnap.data();
    const producto = prodSnap.data();

    const stockOrigenAntes = invOriSnap.exists ? Number(invOriSnap.data().stock || 0) : 0;
    const stockDestinoAntes = invDestSnap.exists ? Number(invDestSnap.data().stock || 0) : 0;

    if (stockOrigenAntes < qty) {
      throw new HttpsError(
        'failed-precondition',
        `Stock insuficiente en ${sucOrigen.nombre}. Disponible: ${stockOrigenAntes}, solicitado: ${qty}.`
      );
    }

    const stockOrigenDespues = stockOrigenAntes - qty;
    const stockDestinoDespues = stockDestinoAntes + qty;
    const transferenciaId = db.collection('movimientos').doc().id;

    tx.set(
      invOrigenRef,
      {
        sucursalId: sucursalOrigenId,
        sucursalNombre: sucOrigen.nombre,
        productoId,
        productoNombre: producto.nombre,
        stock: stockOrigenDespues,
        stockMinimo: Number(producto.stockMinimo ?? 2),
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      invDestinoRef,
      {
        sucursalId: sucursalDestinoId,
        sucursalNombre: sucDestino.nombre,
        productoId,
        productoNombre: producto.nombre,
        stock: stockDestinoDespues,
        stockMinimo: Number(producto.stockMinimo ?? 2),
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const movSalidaRef = db.collection('movimientos').doc();
    const movEntradaRef = db.collection('movimientos').doc();
    const motivoLimpio = String(motivo || `Transferencia ${sucOrigen.nombre} -> ${sucDestino.nombre}`).slice(0, 300);

    tx.set(movSalidaRef, {
      tipo: 'transferencia',
      direccion: 'salida',
      transferenciaId,
      sucursalContraparteId: sucursalDestinoId,
      cantidad: qty,
      delta: -qty,
      stockAntes: stockOrigenAntes,
      stockDespues: stockOrigenDespues,
      sucursalId: sucursalOrigenId,
      sucursalNombre: sucOrigen.nombre,
      productoId,
      productoNombre: producto.nombre,
      motivo: motivoLimpio,
      usuario: actor.nombre || actor.email || actor.uid,
      usuarioId: actor.uid,
      fecha: FieldValue.serverTimestamp(),
    });

    tx.set(movEntradaRef, {
      tipo: 'transferencia',
      direccion: 'entrada',
      transferenciaId,
      sucursalContraparteId: sucursalOrigenId,
      cantidad: qty,
      delta: qty,
      stockAntes: stockDestinoAntes,
      stockDespues: stockDestinoDespues,
      sucursalId: sucursalDestinoId,
      sucursalNombre: sucDestino.nombre,
      productoId,
      productoNombre: producto.nombre,
      motivo: motivoLimpio,
      usuario: actor.nombre || actor.email || actor.uid,
      usuarioId: actor.uid,
      fecha: FieldValue.serverTimestamp(),
    });

    await registrarAuditoria(
      {
        accion: 'INVENTARIO_TRANSFERENCIA',
        modulo: 'inventario',
        entidadId: transferenciaId,
        sucursalId: sucursalOrigenId,
        usuarioId: actor.uid,
        usuarioEmail: actor.email || null,
        usuarioRol: actor.role,
        detalle: {
          productoId,
          cantidad: qty,
          sucursalOrigenId,
          sucursalDestinoId,
          stockOrigenAntes,
          stockOrigenDespues,
          stockDestinoAntes,
          stockDestinoDespues,
        },
      },
      tx
    );

    return {
      transferenciaId,
      productoId,
      cantidad: qty,
      origen: { sucursalId: sucursalOrigenId, stockAntes: stockOrigenAntes, stockDespues: stockOrigenDespues },
      destino: { sucursalId: sucursalDestinoId, stockAntes: stockDestinoAntes, stockDespues: stockDestinoDespues },
    };
  });
}

async function auditarInventarioCore({ actor }) {
  const [invSnap, movSnap, prodSnap, sucSnap] = await Promise.all([
    db.collection('inventario').get(),
    db.collection('movimientos').get(),
    db.collection('productos').get(),
    db.collection('sucursales').get(),
  ]);

  const productosMap = new Map(prodSnap.docs.map((d) => [d.id, d.data()]));
  const sucursalesMap = new Map(sucSnap.docs.map((d) => [d.id, d.data()]));

  // Recalcular stock esperado a partir de todos los movimientos
  const calculado = new Map();
  for (const doc of movSnap.docs) {
    const m = doc.data();
    const key = inventarioDocId(m.sucursalId, m.productoId);
    let delta = Number(m.delta);
    if (!Number.isFinite(delta)) {
      const qty = Number(m.cantidad || 0);
      if (m.tipo === 'entrada' || m.direccion === 'entrada') delta = qty;
      else delta = -qty;
    }
    calculado.set(key, (calculado.get(key) || 0) + delta);
  }

  const registrados = new Map();
  for (const doc of invSnap.docs) {
    const inv = doc.data();
    registrados.set(doc.id, inv);
  }

  const todasLasClaves = new Set([...calculado.keys(), ...registrados.keys()]);
  const diferencias = [];

  for (const key of todasLasClaves) {
    const inv = registrados.get(key);
    const stockRegistrado = inv ? Number(inv.stock || 0) : 0;
    const stockCalculado = calculado.get(key) || 0;

    if (stockRegistrado !== stockCalculado) {
      const [sucursalId, productoId] = inv
        ? [inv.sucursalId, inv.productoId]
        : key.split('_');
      diferencias.push({
        clave: key,
        sucursalId,
        sucursalNombre: sucursalesMap.get(sucursalId)?.nombre || sucursalId,
        productoId,
        productoNombre: productosMap.get(productoId)?.nombre || productoId,
        stockRegistrado,
        stockCalculado,
        diferencia: stockRegistrado - stockCalculado,
      });
    }
  }

  await registrarAuditoria({
    accion: 'INVENTARIO_AUDITORIA',
    modulo: 'inventario',
    usuarioId: actor.uid,
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: { totalEvaluados: todasLasClaves.size, totalDiferencias: diferencias.length },
  });

  return {
    ok: diferencias.length === 0,
    totalEvaluados: todasLasClaves.size,
    totalDiferencias: diferencias.length,
    diferencias,
  };
}

module.exports = {
  inventarioDocId,
  registrarMovimientoCore,
  transferirProductoCore,
  auditarInventarioCore,
};
