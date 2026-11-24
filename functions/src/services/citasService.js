const { HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../lib/firebase');
const { registrarAuditoria } = require('../lib/audit');
const { puedeOperarSucursal } = require('../lib/auth');
const {
  generarSlotsDisponibles,
  validarHorarioCita,
  tieneCitaCruzadaCliente,
  puedeCancelarCliente,
} = require('../lib/slots');

const TRANSICIONES_VALIDAS = {
  pendiente: ['confirmada', 'completada', 'no_asistio', 'cancelada'],
  confirmada: ['completada', 'no_asistio', 'cancelada'],
  completada: [],
  no_asistio: [],
  cancelada: [],
};

const CANALES_VALIDOS = ['web', 'whatsapp', 'presencial', 'chatbot'];

function lockIdPara(sucursalId, fecha) {
  return `${sucursalId}_${fecha}`;
}

async function consultarDisponibilidad({ sucursalId, servicioId, fecha, excluirCitaId = null }) {
  if (!sucursalId || !servicioId || !fecha) {
    throw new HttpsError('invalid-argument', 'Debes indicar sucursalId, servicioId y fecha (AAAA-MM-DD).');
  }

  const [sucSnap, servSnap] = await Promise.all([
    db.collection('sucursales').doc(sucursalId).get(),
    db.collection('servicios').doc(servicioId).get(),
  ]);

  if (!sucSnap.exists || sucSnap.data().activa === false) {
    throw new HttpsError('not-found', 'Sucursal no encontrada o inactiva.');
  }
  if (!servSnap.exists || servSnap.data().activo === false) {
    throw new HttpsError('not-found', 'Servicio no encontrado o inactivo.');
  }

  const sucursal = { id: sucSnap.id, ...sucSnap.data() };
  const servicio = { id: servSnap.id, ...servSnap.data() };

  if (Array.isArray(servicio.sucursales) && !servicio.sucursales.includes(sucursalId)) {
    throw new HttpsError('failed-precondition', 'El servicio no está disponible en la sucursal seleccionada.');
  }

  const citasSnap = await db
    .collection('citas')
    .where('sucursalId', '==', sucursalId)
    .where('fecha', '==', fecha)
    .get();

  const citasExistentes = citasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const resultado = generarSlotsDisponibles({
    fecha,
    horario: sucursal.horario,
    capacidad: sucursal.capacidad || 2,
    duracionMin: servicio.duracionMin || 60,
    citasExistentes,
    excluirCitaId,
  });

  return {
    ...resultado,
    sucursal: { id: sucursal.id, nombre: sucursal.nombre, capacidad: sucursal.capacidad || 2 },
    servicio: {
      id: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precio,
      duracionMin: servicio.duracionMin,
    },
  };
}

async function crearCitaCore({
  actor,
  clienteId = null,
  clienteNombre = null,
  clienteTelefono = null,
  sucursalId,
  servicioId,
  fecha,
  hora,
  canal = 'web',
  notas = '',
}) {
  if (!sucursalId || !servicioId || !fecha || !hora) {
    throw new HttpsError('invalid-argument', 'Faltan datos obligatorios: sucursalId, servicioId, fecha y hora.');
  }

  const canalSeguro = CANALES_VALIDOS.includes(canal) ? canal : 'web';
  const esStaff = actor.role === 'admin' || actor.role === 'encargado';

  let clienteIdFinal = clienteId;
  let clienteNombreFinal = clienteNombre ? String(clienteNombre).trim() : '';
  let clienteTelefonoFinal = clienteTelefono ? String(clienteTelefono).trim() : '';

  if (actor.role === 'cliente') {
    clienteIdFinal = actor.uid;
    clienteNombreFinal = actor.nombre || clienteNombreFinal || 'Cliente';
    clienteTelefonoFinal = actor.telefono || clienteTelefonoFinal || '';
  } else if (esStaff) {
    if (!puedeOperarSucursal(actor, sucursalId)) {
      throw new HttpsError('permission-denied', 'No tienes permiso para agendar citas en esta sucursal.');
    }
    if (!clienteIdFinal && !clienteNombreFinal) {
      throw new HttpsError(
        'invalid-argument',
        'Para registrar una cita presencial o por WhatsApp debes indicar un clienteId o el nombre del cliente.'
      );
    }
  } else if (actor.role === 'n8n') {
    if (!clienteIdFinal) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para reservar una cita desde el chatbot.');
    }
  }

  // Si hay clienteId, cargar su perfil para snapshot de nombre/teléfono
  if (clienteIdFinal) {
    const cliSnap = await db.collection('users').doc(clienteIdFinal).get();
    if (!cliSnap.exists) {
      throw new HttpsError('not-found', 'El cliente indicado no existe.');
    }
    const cliData = cliSnap.data();
    clienteNombreFinal = cliData.nombre || clienteNombreFinal || 'Cliente';
    clienteTelefonoFinal = cliData.telefono || clienteTelefonoFinal || '';
  }

  const sucRef = db.collection('sucursales').doc(sucursalId);
  const servRef = db.collection('servicios').doc(servicioId);
  const lockRef = db.collection('agendaLocks').doc(lockIdPara(sucursalId, fecha));

  const citaCreada = await db.runTransaction(async (tx) => {
    // 1. Todas las lecturas primero (requisito estricto de Firestore)
    const [sucSnap, servSnap, lockSnap] = await Promise.all([
      tx.get(sucRef),
      tx.get(servRef),
      tx.get(lockRef),
    ]);

    if (!sucSnap.exists || sucSnap.data().activa === false) {
      throw new HttpsError('not-found', 'Sucursal no encontrada o inactiva.');
    }
    if (!servSnap.exists || servSnap.data().activo === false) {
      throw new HttpsError('not-found', 'Servicio no encontrado o inactivo.');
    }

    const sucursal = sucSnap.data();
    const servicio = servSnap.data();

    if (Array.isArray(servicio.sucursales) && !servicio.sucursales.includes(sucursalId)) {
      throw new HttpsError('failed-precondition', 'El servicio seleccionado no está habilitado en esa sucursal.');
    }

    const citasSucursalQuery = db
      .collection('citas')
      .where('sucursalId', '==', sucursalId)
      .where('fecha', '==', fecha);

    const queries = [tx.get(citasSucursalQuery)];
    if (clienteIdFinal) {
      const citasClienteQuery = db
        .collection('citas')
        .where('clienteId', '==', clienteIdFinal)
        .where('fecha', '==', fecha);
      queries.push(tx.get(citasClienteQuery));
    }

    const [citasSucSnap, citasCliSnap] = await Promise.all(queries);
    const citasExistentes = citasSucSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const citasCliente = citasCliSnap ? citasCliSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];

    // 2. Validar horario y capacidad con lógica pura
    const duracionMin = Number(servicio.duracionMin) || 60;
    const validacion = validarHorarioCita({
      fecha,
      hora,
      duracionMin,
      horario: sucursal.horario,
      capacidad: sucursal.capacidad || 2,
      citasExistentes,
      validarAlineacionSlot: !esStaff,
    });

    if (!validacion.valido) {
      const code = validacion.codigo === 'SIN_CUPO' ? 'resource-exhausted' : 'failed-precondition';
      throw new HttpsError(code, validacion.motivo);
    }

    // 3. El cliente no puede tener dos citas cruzadas (en ninguna sucursal)
    if (
      clienteIdFinal &&
      tieneCitaCruzadaCliente({
        fecha,
        hora,
        duracionMin,
        citasCliente,
      })
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Ya tienes otra cita activa que se cruza con este horario.'
      );
    }

    // 4. Escrituras atómicas: lock + cita + auditoría
    const prevRev = lockSnap.exists ? Number(lockSnap.data().rev || 0) : 0;
    tx.set(
      lockRef,
      {
        sucursalId,
        fecha,
        rev: prevRev + 1,
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const citaRef = db.collection('citas').doc();
    const citaDoc = {
      clienteId: clienteIdFinal || null,
      clienteNombre: clienteNombreFinal,
      clienteTelefono: clienteTelefonoFinal,
      sucursalId,
      sucursalNombre: sucursal.nombre,
      servicioId,
      servicioNombre: servicio.nombre,
      precio: Number(servicio.precio || 0),
      fecha,
      hora,
      horaFin: validacion.horaFin,
      duracionMin,
      estado: 'pendiente',
      canal: canalSeguro,
      notas: String(notas || '').slice(0, 400),
      recordatorioEnviado: false,
      creadoPor: actor.uid || 'n8n',
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    };

    tx.set(citaRef, citaDoc);

    await registrarAuditoria(
      {
        accion: 'CITA_CREADA',
        modulo: 'citas',
        entidadId: citaRef.id,
        sucursalId,
        usuarioId: actor.uid || 'n8n',
        usuarioEmail: actor.email || null,
        usuarioRol: actor.role,
        detalle: { fecha, hora, servicioId, canal: canalSeguro, clienteId: clienteIdFinal },
      },
      tx
    );

    return { id: citaRef.id, ...citaDoc };
  });

  return citaCreada;
}

async function modificarCitaCore({ actor, citaId, fecha, hora, sucursalId = null, servicioId = null }) {
  if (!citaId || !fecha || !hora) {
    throw new HttpsError('invalid-argument', 'Debes indicar citaId, nueva fecha y nueva hora.');
  }

  const citaRef = db.collection('citas').doc(citaId);
  const preSnap = await citaRef.get();
  if (!preSnap.exists) {
    throw new HttpsError('not-found', 'La cita no existe.');
  }

  const preData = preSnap.data();
  const nuevaSucursalId = sucursalId || preData.sucursalId;
  const nuevoServicioId = servicioId || preData.servicioId;

  const esStaff = actor.role === 'admin' || actor.role === 'encargado';
  if (actor.role === 'cliente') {
    if (preData.clienteId !== actor.uid) {
      throw new HttpsError('permission-denied', 'Solo puedes modificar tus propias citas.');
    }
    const checkCancel = puedeCancelarCliente(preData.fecha, preData.hora);
    if (!checkCancel.permitido) {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes reprogramar tu cita con al menos 2 horas de anticipación.'
      );
    }
  } else if (esStaff) {
    if (!puedeOperarSucursal(actor, preData.sucursalId) || !puedeOperarSucursal(actor, nuevaSucursalId)) {
      throw new HttpsError('permission-denied', 'No tienes permiso sobre la sucursal de esta cita.');
    }
  }

  // Bloquear ambos días/sucursales en orden determinista para evitar deadlocks
  const lockIds = Array.from(
    new Set([lockIdPara(preData.sucursalId, preData.fecha), lockIdPara(nuevaSucursalId, fecha)])
  ).sort();
  const lockRefs = lockIds.map((id) => db.collection('agendaLocks').doc(id));

  return await db.runTransaction(async (tx) => {
    const sucRef = db.collection('sucursales').doc(nuevaSucursalId);
    const servRef = db.collection('servicios').doc(nuevoServicioId);

    const [citaSnap, sucSnap, servSnap, ...lockSnaps] = await Promise.all([
      tx.get(citaRef),
      tx.get(sucRef),
      tx.get(servRef),
      ...lockRefs.map((r) => tx.get(r)),
    ]);

    if (!citaSnap.exists) {
      throw new HttpsError('not-found', 'La cita ya no existe.');
    }
    const actual = citaSnap.data();
    if (!['pendiente', 'confirmada'].includes(actual.estado)) {
      throw new HttpsError(
        'failed-precondition',
        `No se puede modificar una cita en estado "${actual.estado}".`
      );
    }
    if (!sucSnap.exists || sucSnap.data().activa === false) {
      throw new HttpsError('not-found', 'Sucursal no encontrada o inactiva.');
    }
    if (!servSnap.exists || servSnap.data().activo === false) {
      throw new HttpsError('not-found', 'Servicio no encontrado o inactivo.');
    }

    const sucursal = sucSnap.data();
    const servicio = servSnap.data();

    const citasSucQuery = db
      .collection('citas')
      .where('sucursalId', '==', nuevaSucursalId)
      .where('fecha', '==', fecha);

    const queries = [tx.get(citasSucQuery)];
    if (actual.clienteId) {
      queries.push(
        tx.get(
          db.collection('citas').where('clienteId', '==', actual.clienteId).where('fecha', '==', fecha)
        )
      );
    }

    const [citasSucSnap, citasCliSnap] = await Promise.all(queries);
    const citasExistentes = citasSucSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const citasCliente = citasCliSnap ? citasCliSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];

    const duracionMin = Number(servicio.duracionMin) || 60;
    const validacion = validarHorarioCita({
      fecha,
      hora,
      duracionMin,
      horario: sucursal.horario,
      capacidad: sucursal.capacidad || 2,
      citasExistentes,
      excluirCitaId: citaId,
      validarAlineacionSlot: !esStaff,
    });

    if (!validacion.valido) {
      const code = validacion.codigo === 'SIN_CUPO' ? 'resource-exhausted' : 'failed-precondition';
      throw new HttpsError(code, validacion.motivo);
    }

    if (
      actual.clienteId &&
      tieneCitaCruzadaCliente({
        fecha,
        hora,
        duracionMin,
        citasCliente,
        excluirCitaId: citaId,
      })
    ) {
      throw new HttpsError(
        'failed-precondition',
        'El cliente ya tiene otra cita que se cruza con el nuevo horario.'
      );
    }

    // Actualizar locks
    lockRefs.forEach((ref, idx) => {
      const snap = lockSnaps[idx];
      const prevRev = snap.exists ? Number(snap.data().rev || 0) : 0;
      tx.set(ref, { rev: prevRev + 1, actualizadoEn: FieldValue.serverTimestamp() }, { merge: true });
    });

    const cambios = {
      sucursalId: nuevaSucursalId,
      sucursalNombre: sucursal.nombre,
      servicioId: nuevoServicioId,
      servicioNombre: servicio.nombre,
      precio: Number(servicio.precio || 0),
      fecha,
      hora,
      horaFin: validacion.horaFin,
      duracionMin,
      recordatorioEnviado: false,
      actualizadoEn: FieldValue.serverTimestamp(),
    };

    tx.update(citaRef, cambios);

    await registrarAuditoria(
      {
        accion: 'CITA_MODIFICADA',
        modulo: 'citas',
        entidadId: citaId,
        sucursalId: nuevaSucursalId,
        usuarioId: actor.uid,
        usuarioEmail: actor.email || null,
        usuarioRol: actor.role,
        detalle: {
          antes: { fecha: actual.fecha, hora: actual.hora, sucursalId: actual.sucursalId },
          despues: { fecha, hora, sucursalId: nuevaSucursalId },
        },
      },
      tx
    );

    return { id: citaId, ...actual, ...cambios };
  });
}

async function cancelarCitaCore({ actor, citaId, motivo = '' }) {
  if (!citaId) {
    throw new HttpsError('invalid-argument', 'Debes indicar citaId.');
  }

  const citaRef = db.collection('citas').doc(citaId);
  const snap = await citaRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Cita no encontrada.');
  }

  const cita = snap.data();
  if (!['pendiente', 'confirmada'].includes(cita.estado)) {
    throw new HttpsError('failed-precondition', `La cita ya se encuentra en estado "${cita.estado}".`);
  }

  if (actor.role === 'cliente' || actor.role === 'n8n') {
    if (cita.clienteId !== actor.uid) {
      throw new HttpsError('permission-denied', 'No puedes cancelar citas de otro cliente.');
    }
    const check = puedeCancelarCliente(cita.fecha, cita.hora);
    if (!check.permitido) {
      throw new HttpsError(
        'failed-precondition',
        'Solo puedes cancelar tu cita con 2 horas o más de anticipación.'
      );
    }
  } else if (!puedeOperarSucursal(actor, cita.sucursalId)) {
    throw new HttpsError('permission-denied', 'No tienes permiso para cancelar citas de esta sucursal.');
  }

  await citaRef.update({
    estado: 'cancelada',
    motivoCancelacion: String(motivo || '').slice(0, 300),
    canceladaPor: actor.uid || 'n8n',
    actualizadoEn: FieldValue.serverTimestamp(),
  });

  await registrarAuditoria({
    accion: 'CITA_CANCELADA',
    modulo: 'citas',
    entidadId: citaId,
    sucursalId: cita.sucursalId,
    usuarioId: actor.uid || 'n8n',
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: { fecha: cita.fecha, hora: cita.hora, motivo: String(motivo || '') },
  });

  return { id: citaId, estado: 'cancelada' };
}

async function cambiarEstadoCitaCore({ actor, citaId, nuevoEstado }) {
  if (!citaId || !nuevoEstado) {
    throw new HttpsError('invalid-argument', 'Debes indicar citaId y nuevoEstado.');
  }

  const citaRef = db.collection('citas').doc(citaId);
  const snap = await citaRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Cita no encontrada.');
  }

  const cita = snap.data();
  if (!puedeOperarSucursal(actor, cita.sucursalId)) {
    throw new HttpsError('permission-denied', 'No tienes permiso sobre esta sucursal.');
  }

  const permitidos = TRANSICIONES_VALIDAS[cita.estado] || [];
  if (!permitidos.includes(nuevoEstado)) {
    throw new HttpsError(
      'failed-precondition',
      `Transición inválida: no se puede pasar de "${cita.estado}" a "${nuevoEstado}".`
    );
  }

  await citaRef.update({
    estado: nuevoEstado,
    actualizadoEn: FieldValue.serverTimestamp(),
  });

  await registrarAuditoria({
    accion: 'CITA_CAMBIO_ESTADO',
    modulo: 'citas',
    entidadId: citaId,
    sucursalId: cita.sucursalId,
    usuarioId: actor.uid,
    usuarioEmail: actor.email || null,
    usuarioRol: actor.role,
    detalle: { estadoAnterior: cita.estado, estadoNuevo: nuevoEstado },
  });

  return { id: citaId, estadoAnterior: cita.estado, estadoNuevo: nuevoEstado };
}

module.exports = {
  consultarDisponibilidad,
  crearCitaCore,
  modificarCitaCore,
  cancelarCitaCore,
  cambiarEstadoCitaCore,
};
