const { HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../lib/firebase');
const { registrarAuditoria } = require('../lib/audit');
const { puedeOperarSucursal } = require('../lib/auth');
const { ahoraBolivia, esFechaValida } = require('../lib/time');
const { repartirCuotas, aplicarPagoACuotas, redondearBs } = require('../lib/money');

const METODOS_PAGO = ['efectivo', 'qr', 'transferencia', 'tarjeta'];

async function registrarTratamientoCore({
  actor,
  clienteId,
  clienteNombre = '',
  sucursalId,
  servicioId,
  fecha = null,
  notas = '',
  total = null,
  cantidadCuotas = 1,
}) {
  if (!clienteId || !sucursalId || !servicioId) {
    throw new HttpsError('invalid-argument', 'Debes indicar clienteId, sucursalId y servicioId.');
  }
  if (!puedeOperarSucursal(actor, sucursalId)) {
    throw new HttpsError('permission-denied', 'No tienes permiso para registrar tratamientos en esta sucursal.');
  }

  const fechaFinal = fecha && esFechaValida(fecha) ? fecha : ahoraBolivia().fecha;

  const [cliSnap, sucSnap, servSnap] = await Promise.all([
    db.collection('users').doc(clienteId).get(),
    db.collection('sucursales').doc(sucursalId).get(),
    db.collection('servicios').doc(servicioId).get(),
  ]);

  if (!sucSnap.exists) throw new HttpsError('not-found', 'Sucursal no encontrada.');
  if (!servSnap.exists) throw new HttpsError('not-found', 'Servicio no encontrado.');

  const sucursal = sucSnap.data();
  const servicio = servSnap.data();
  const nombreClienteFinal = cliSnap.exists ? cliSnap.data().nombre : String(clienteNombre || 'Cliente');

  const montoTotal = redondearBs(total !== null && total !== undefined ? total : servicio.precio);
  let cuotas;
  try {
    cuotas = repartirCuotas(montoTotal, Number(cantidadCuotas) || 1, fechaFinal);
  } catch (err) {
    throw new HttpsError('invalid-argument', err.message);
  }

  const tratRef = db.collection('tratamientos').doc();
  const tratDoc = {
    clienteId,
    clienteNombre: nombreClienteFinal,
    sucursalId,
    sucursalNombre: sucursal.nombre,
    servicioId,
    servicioNombre: servicio.nombre,
    fecha: fechaFinal,
    notas: String(notas || '').slice(0, 600),
    total: montoTotal,
    saldo: montoTotal,
    estado: 'activo',
    cuotas,
    creadoPor: actor.uid,
    creadoPorNombre: actor.nombre || actor.email || actor.uid,
    creadoEn: FieldValue.serverTimestamp(),
    actualizadoEn: FieldValue.serverTimestamp(),
  };

  await tratRef.set(tratDoc);

  await registrarAuditoria({
    accion: 'TRATAMIENTO_REGISTRADO',
    modulo: 'tratamientos',
    entidadId: tratRef.id,
    sucursalId,
    usuarioId: actor.uid,
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: { clienteId, servicioId, total: montoTotal, cantidadCuotas: cuotas.length },
  });

  return { id: tratRef.id, ...tratDoc };
}

async function registrarPagoCore({ actor, tratamientoId, monto, metodo = 'efectivo', notas = '' }) {
  if (!tratamientoId) {
    throw new HttpsError('invalid-argument', 'Debes indicar tratamientoId.');
  }
  const metodoLimpio = METODOS_PAGO.includes(metodo) ? metodo : 'efectivo';
  const montoRedondeado = redondearBs(monto);
  if (!Number.isFinite(montoRedondeado) || montoRedondeado <= 0) {
    throw new HttpsError('invalid-argument', 'El monto del pago debe ser mayor a Bs 0.00.');
  }

  const tratRef = db.collection('tratamientos').doc(tratamientoId);

  return await db.runTransaction(async (tx) => {
    const tratSnap = await tx.get(tratRef);
    if (!tratSnap.exists) {
      throw new HttpsError('not-found', 'Tratamiento no encontrado.');
    }

    const trat = tratSnap.data();
    if (!puedeOperarSucursal(actor, trat.sucursalId)) {
      throw new HttpsError('permission-denied', 'No tienes permiso para registrar pagos en esta sucursal.');
    }

    let resultado;
    try {
      resultado = aplicarPagoACuotas(trat.cuotas, montoRedondeado);
    } catch (err) {
      throw new HttpsError('failed-precondition', err.message);
    }

    const nuevoEstado = resultado.cerrado ? 'completado' : 'activo';

    tx.update(tratRef, {
      cuotas: resultado.cuotasActualizadas,
      saldo: resultado.saldoRestante,
      estado: nuevoEstado,
      actualizadoEn: FieldValue.serverTimestamp(),
    });

    const pagoRef = db.collection('pagos').doc();
    const pagoDoc = {
      tratamientoId,
      clienteId: trat.clienteId,
      clienteNombre: trat.clienteNombre || 'Cliente',
      sucursalId: trat.sucursalId,
      sucursalNombre: trat.sucursalNombre || '',
      servicioNombre: trat.servicioNombre || '',
      monto: montoRedondeado,
      metodo: metodoLimpio,
      numeroCuota: resultado.numeroCuotaPrincipal,
      cuotasAfectadas: resultado.cuotasAfectadas,
      saldoDespues: resultado.saldoRestante,
      notas: String(notas || '').slice(0, 300),
      usuarioId: actor.uid,
      usuarioNombre: actor.nombre || actor.email || actor.uid,
      fechaStr: ahoraBolivia().fecha,
      fecha: FieldValue.serverTimestamp(),
    };
    tx.set(pagoRef, pagoDoc);

    await registrarAuditoria(
      {
        accion: 'PAGO_REGISTRADO',
        modulo: 'pagos',
        entidadId: pagoRef.id,
        sucursalId: trat.sucursalId,
        usuarioId: actor.uid,
        usuarioEmail: actor.email || null,
        usuarioRol: actor.role,
        detalle: {
          tratamientoId,
          clienteId: trat.clienteId,
          monto: montoRedondeado,
          metodo: metodoLimpio,
          saldoRestante: resultado.saldoRestante,
          cerrado: resultado.cerrado,
        },
      },
      tx
    );

    return {
      pagoId: pagoRef.id,
      tratamientoId,
      monto: montoRedondeado,
      metodo: metodoLimpio,
      numeroCuota: resultado.numeroCuotaPrincipal,
      cuotasAfectadas: resultado.cuotasAfectadas,
      saldoRestante: resultado.saldoRestante,
      tratamientoCerrado: resultado.cerrado,
    };
  });
}

module.exports = {
  registrarTratamientoCore,
  registrarPagoCore,
};
