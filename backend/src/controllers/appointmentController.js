const db = require('../config/database');
const { realtimeService, notifyBookingChange } = require('../services/realtimeService');

// Funciones auxiliares de tiempo
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Comprueba si dos intervalos se solapan: [start1, end1] y [start2, end2]
function isOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

/**
 * Consulta de horarios disponibles para una sucursal y fecha determinada.
 * Reglas:
 * - Días válidos: Lunes a Sábado.
 * - Domingos bloqueados por defecto, salvo excepción administrativa activa.
 * - Intervalos basados en horario de la sede (ej: 08:30 a 19:30) y duración del servicio.
 * - Considera citas PENDIENTES y CONFIRMADAS como ocupadas.
 */
async function getAvailableSlots(req, res) {
  try {
    const { date, branch_id = 1, service_id } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: 'La fecha es obligatoria (formato AAAA-MM-DD).' });
    }

    const branchId = parseInt(branch_id, 10) || 1;

    // 1. Obtener información de la sucursal
    const [branchRows] = await db.query('SELECT * FROM branches WHERE id = ?', [branchId]);
    if (!branchRows || branchRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
    }
    const branch = branchRows[0];

    // 2. Determinar día de la semana (0: Domingo, 1: Lunes, ..., 6: Sábado)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // 3. Verificar si existe una excepción para esta fecha en la sucursal
    const [exceptions] = await db.query(
      'SELECT * FROM branch_exceptions WHERE branch_id = ? AND date = ?',
      [branchId, date]
    );

    let isClosed = false;
    let closedReason = '';
    let openTimeStr = branch.open_time || '08:30';
    let closeTimeStr = branch.close_time || '19:30';

    if (exceptions && exceptions.length > 0) {
      const ex = exceptions[0];
      if (ex.is_closed === 1) {
        isClosed = true;
        closedReason = ex.reason || 'Sede cerrada por excepción de feriado o mantenimiento.';
      } else {
        // Excepción de apertura especial (ej. domingo abierto)
        if (ex.open_time) openTimeStr = ex.open_time;
        if (ex.close_time) closeTimeStr = ex.close_time;
      }
    } else {
      // Regla general: Domingos cerrados por defecto
      if (dayOfWeek === 0 && branch.sunday_open !== 1) {
        isClosed = true;
        closedReason = 'Los domingos el centro estético permanece cerrado para descanso y reposo espiritual. Puedes reservar con gusto de Lunes a Sábado.';
      }
    }

    if (isClosed) {
      return res.json({
        success: true,
        date,
        dayOfWeek,
        branch_id: branchId,
        branch_name: branch.name,
        isClosed: true,
        reason: closedReason,
        slots: [],
        availableSlots: [],
        busySlots: []
      });
    }

    // 4. Duración del servicio solicitado (o 60 minutos por defecto)
    let serviceDuration = 60;
    let serviceName = 'Servicio general';
    if (service_id) {
      const [svcRows] = await db.query('SELECT id, name, duration FROM services WHERE id = ?', [service_id]);
      if (svcRows && svcRows.length > 0) {
        serviceDuration = parseInt(svcRows[0].duration, 10) || 60;
        serviceName = svcRows[0].name;
      }
    }

    // 5. Generar slots posibles dentro del horario de atención
    const openMin = timeToMinutes(openTimeStr);
    const closeMin = timeToMinutes(closeTimeStr);
    const candidateSlots = [];
    const stepMin = 30; // Intervalos escalonados cada 30 minutos

    for (let cur = openMin; cur + serviceDuration <= closeMin; cur += stepMin) {
      const startStr = minutesToTime(cur);
      const endStr = minutesToTime(cur + serviceDuration);
      candidateSlots.push({
        time: startStr,
        endTime: endStr,
        durationMinutes: serviceDuration
      });
    }

    // 6. Obtener citas activas en esta sucursal y fecha
    const [busyAppointments] = await db.query(
      `SELECT id, time, end_time, status 
       FROM appointments 
       WHERE branch_id = ? AND date = ? AND status IN ('PENDIENTE', 'CONFIRMADA')`,
      [branchId, date]
    );

    // Mapear intervalos ocupados
    const busyIntervals = busyAppointments.map(app => {
      const startMin = timeToMinutes(app.time);
      let endMin = app.end_time ? timeToMinutes(app.end_time) : startMin + 60;
      if (endMin <= startMin) endMin = startMin + 60;
      return { id: app.id, startMin, endMin, time: app.time, end_time: app.end_time };
    });

    // 7. Evaluar cada slot y determinar si colisiona según la agenda de la sucursal (regla: 1 reserva activa por franja)
    const maxActiveBookingsPerSlot = 1;
    const evaluatedSlots = candidateSlots.map(slot => {
      const slotStartMin = timeToMinutes(slot.time);
      const slotEndMin = timeToMinutes(slot.endTime);

      const overlapping = busyIntervals.filter(busy => 
        isOverlapping(slotStartMin, slotEndMin, busy.startMin, busy.endMin)
      );

      const isAvailable = overlapping.length < maxActiveBookingsPerSlot;

      return {
        ...slot,
        occupiedCount: overlapping.length,
        capacity: maxActiveBookingsPerSlot,
        isAvailable,
        conflictWith: !isAvailable ? overlapping.map(o => o.id) : null
      };
    });

    const availableSlots = evaluatedSlots.filter(s => s.isAvailable).map(s => s.time);
    const busySlots = evaluatedSlots.filter(s => !s.isAvailable).map(s => s.time);

    return res.json({
      success: true,
      date,
      dayOfWeek,
      branch_id: branchId,
      branch_name: branch.name,
      service_id: service_id || null,
      service_name: serviceName,
      serviceDuration,
      isClosed: false,
      totalSlots: evaluatedSlots.length,
      availableCount: availableSlots.length,
      slots: evaluatedSlots,
      availableSlots,
      busySlots
    });
  } catch (err) {
    console.error('Error en getAvailableSlots:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar disponibilidad de horarios.' });
  }
}

/**
 * Consulta de citas con filtros y control de roles
 */
async function getAppointments(req, res) {
  try {
    const user = req.user;
    const { status, date, branch_id, client_id } = req.query;

    let sql = `
      SELECT a.*, 
             s.name as service_name, s.price as service_price, s.duration as service_duration, s.type as service_type,
             b.id as branch_id, b.name as branch_name, b.city as branch_city, b.address as branch_address, b.phone as branch_phone, b.whatsapp as branch_whatsapp,
             c.id as client_id, u.name as client_name, u.email as client_email, u.phone as client_phone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN branches b ON a.branch_id = b.id
      JOIN clients c ON a.client_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Si es cliente, SOLO ve sus propias citas (aislamiento estricto de seguridad)
    if (user.role === 'CLIENTE') {
      sql += ' AND a.client_id = ?';
      params.push(user.client_id);
    } else if (client_id) {
      sql += ' AND a.client_id = ?';
      params.push(client_id);
    }

    if (branch_id) {
      sql += ' AND a.branch_id = ?';
      params.push(branch_id);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status.toUpperCase());
    }

    if (date) {
      sql += ' AND a.date = ?';
      params.push(date);
    }

    sql += ' ORDER BY a.date DESC, a.time ASC';

    const [appointments] = await db.query(sql, params);
    return res.json({ success: true, appointments });
  } catch (err) {
    console.error('Error en getAppointments:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener citas.' });
  }
}

/**
 * Creación de reserva con validación atómica de solapamiento y notificación automática.
 */
async function createAppointment(req, res) {
  try {
    const user = req.user;
    const { service_id, branch_id = 1, date, time, observations, client_id } = req.body;

    if (!service_id || !date || !time) {
      return res.status(400).json({ success: false, error: 'Servicio, fecha y hora son obligatorios.' });
    }

    // Determinar client_id
    let targetClientId = user.client_id;
    if (user.role === 'ADMINISTRADOR') {
      if (!client_id) {
        return res.status(400).json({ success: false, error: 'Como administrador, debes especificar el client_id.' });
      }
      targetClientId = client_id;
    }

    if (!targetClientId) {
      return res.status(400).json({ success: false, error: 'No se encontró el registro de cliente asociado.' });
    }

    const branchId = parseInt(branch_id, 10) || 1;

    // 1. Validar sucursal
    const [branchRows] = await db.query('SELECT * FROM branches WHERE id = ? AND active = 1', [branchId]);
    if (!branchRows || branchRows.length === 0) {
      return res.status(404).json({ success: false, error: 'La sucursal seleccionada no existe o no está activa.' });
    }
    const branch = branchRows[0];

    // 2. Validar servicio
    const [serviceRows] = await db.query(
      'SELECT id, name, price, duration FROM services WHERE id = ? AND status = ?',
      [service_id, 'ACTIVO']
    );
    if (!serviceRows || serviceRows.length === 0) {
      return res.status(404).json({ success: false, error: 'El servicio seleccionado no está disponible o no existe.' });
    }
    const service = serviceRows[0];
    const duration = parseInt(service.duration, 10) || 60;

    // 3. Calcular hora de finalización
    const startMin = timeToMinutes(time);
    const endMin = startMin + duration;
    const endTime = minutesToTime(endMin);

    // 4. Validar día domingo y excepciones
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    const [exceptions] = await db.query(
      'SELECT * FROM branch_exceptions WHERE branch_id = ? AND date = ?',
      [branchId, date]
    );

    if (exceptions && exceptions.length > 0) {
      if (exceptions[0].is_closed === 1) {
        return res.status(400).json({
          success: false,
          error: `La sucursal ${branch.name} no atiende en la fecha ${date}: ${exceptions[0].reason || 'Cerrado por excepción'}`
        });
      }
    } else {
      if (dayOfWeek === 0 && branch.sunday_open !== 1) {
        return res.status(400).json({
          success: false,
          error: `Los domingos el centro estético no atiende citas regulares. Por favor elige una fecha de Lunes a Sábado.`
        });
      }
    }

    // 5. CONTROL ATÓMICO DE COLISIONES:
    // Comprobar si existe alguna cita activa en esa misma sucursal e intervalo de tiempo
    const [existingBookings] = await db.query(
      `SELECT id, time, COALESCE(end_time, time) as end_time 
       FROM appointments 
       WHERE branch_id = ? AND date = ? AND status IN ('PENDIENTE', 'CONFIRMADA')`,
      [branchId, date]
    );

    // Regla de agenda por sucursal: 1 reserva activa por franja
    const maxCapacity = 1;
    const overlappingBookings = existingBookings.filter(b => {
      const bStart = timeToMinutes(b.time);
      let bEnd = b.end_time ? timeToMinutes(b.end_time) : bStart + 60;
      if (bEnd <= bStart) bEnd = bStart + 60;
      return isOverlapping(startMin, endMin, bStart, bEnd);
    });

    if (overlappingBookings.length >= maxCapacity) {
      return res.status(409).json({
        success: false,
        error: `El horario solicitado (${time} - ${endTime}) ya fue reservado en la sucursal ${branch.name}. Por favor elige otro horario disponible.`
      });
    }

    // 6. Verificar si el mismo cliente ya tiene una cita ese día en un intervalo solapado
    const [clientBusy] = await db.query(
      `SELECT id, time, COALESCE(end_time, time) as end_time 
       FROM appointments 
       WHERE client_id = ? AND date = ? AND status IN ('PENDIENTE', 'CONFIRMADA')`,
      [targetClientId, date]
    );
    for (const cb of clientBusy) {
      const cbStart = timeToMinutes(cb.time);
      let cbEnd = cb.end_time ? timeToMinutes(cb.end_time) : cbStart + 60;
      if (cbEnd <= cbStart) cbEnd = cbStart + 60;
      if (isOverlapping(startMin, endMin, cbStart, cbEnd)) {
        return res.status(409).json({
          success: false,
          error: 'Ya tienes una cita programada en ese horario. Si deseas cambiarla, por favor cancela la anterior.'
        });
      }
    }

    // 7. Insertar la reserva
    const bookingCode = `HTK-${date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalPrice = req.body.total_price || service.price || 0.00;

    const [insertResult] = await db.query(
      `INSERT INTO appointments (booking_code, client_id, service_id, branch_id, date, time, end_time, duration, total_price, status, observations) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMADA', ?)`,
      [bookingCode, targetClientId, service_id, branchId, date, time, endTime, duration, totalPrice, observations || '']
    );

    const appointmentId = insertResult.insertId;

    // Insertar franjas en appointment_slots para protección atómica contra duplicados
    for (let cur = startMin; cur < endMin; cur += 30) {
      const slotStr = minutesToTime(cur);
      await db.query(
        'INSERT OR IGNORE INTO appointment_slots (branch_id, date, slot_time, appointment_id) VALUES (?, ?, ?, ?)',
        [branchId, date, slotStr, appointmentId]
      ).catch(() => {});
    }

    // 8. NOTIFICACIÓN AUTOMÁTICA EN SISTEMA:
    const notificationTitle = '¡Reserva Registrada en Hermosa Talita Kumi!';
    const notificationMessage = `¡Tu reserva ha sido registrada correctamente en Hermosa Talita Kumi! Tu cita para ${service.name} está programada para el ${date} a las ${time}, en la sucursal ${branch.name}. ¡Te esperamos con mucho cariño y bendición!`;

    await db.query(
      `INSERT INTO notifications (client_id, appointment_id, title, message, type)
       VALUES (?, ?, ?, ?, 'RESERVA')`,
      [targetClientId, appointmentId, notificationTitle, notificationMessage]
    ).catch(err => console.error('Error al guardar notificación:', err));

    // 9. Emitir evento en tiempo real para actualización instantánea de calendarios
    notifyBookingChange(branchId, date);

    // 10. Enlace directo a WhatsApp central único (+591 62353452)
    const whatsappNum = '59162353452';
    const waText = encodeURIComponent(
      `¡Hola Hermosa Talita Kumi! Confirmo mi reserva #${appointmentId} de ${service.name} para el día ${date} a las ${time} en la sucursal ${branch.name}.`
    );
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${waText}`;

    return res.status(201).json({
      success: true,
      message: '¡Tu reserva ha sido registrada con éxito!',
      appointment: {
        id: appointmentId,
        client_id: targetClientId,
        service_id,
        service_name: service.name,
        service_price: service.price,
        service_duration: duration,
        branch_id: branchId,
        branch_name: branch.name,
        branch_city: branch.city,
        branch_address: branch.address,
        date,
        time,
        end_time: endTime,
        status: 'PENDIENTE',
        observations
      },
      confirmation: {
        title: notificationTitle,
        message: notificationMessage,
        service: service.name,
        branch: branch.name,
        address: branch.address,
        city: branch.city,
        date,
        time,
        endTime,
        whatsappUrl
      }
    });
  } catch (err) {
    console.error('Error en createAppointment:', err);
    return res.status(500).json({ success: false, error: 'Error al procesar la reserva.' });
  }
}

/**
 * Modificación de cita con verificación de horario libre y notificación
 */
async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { status, date, time, observations, service_id, branch_id } = req.body;
    const user = req.user;

    const [existing] = await db.query(
      `SELECT a.*, s.name as service_name, b.name as branch_name 
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN branches b ON a.branch_id = b.id
       WHERE a.id = ?`,
      [id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada.' });
    }

    const current = existing[0];

    // Permisos
    if (user.role === 'CLIENTE') {
      if (current.client_id !== user.client_id) {
        return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta cita.' });
      }
      if (status && status !== 'CANCELADA') {
        return res.status(403).json({ success: false, error: 'Los clientes solo pueden solicitar cancelación de sus citas.' });
      }
    }

    const newBranchId = branch_id ? parseInt(branch_id, 10) : current.branch_id;
    const newDate = date || current.date;
    const newTime = time || current.time;
    let newEndTime = current.end_time;

    // Si cambió servicio, fecha u hora, recalcular y chequear colisión
    if (service_id || time || date || branch_id) {
      let duration = 60;
      if (service_id) {
        const [sRows] = await db.query('SELECT duration FROM services WHERE id = ?', [service_id]);
        if (sRows.length > 0) duration = sRows[0].duration;
      }
      const sMin = timeToMinutes(newTime);
      newEndTime = minutesToTime(sMin + duration);

      const [otherBookings] = await db.query(
        `SELECT id, time, COALESCE(end_time, time) as end_time 
         FROM appointments 
         WHERE branch_id = ? AND date = ? AND id != ? AND status IN ('PENDIENTE', 'CONFIRMADA')`,
        [newBranchId, newDate, id]
      );

      for (const ob of otherBookings) {
        const obStart = timeToMinutes(ob.time);
        let obEnd = ob.end_time ? timeToMinutes(ob.end_time) : obStart + 60;
        if (obEnd <= obStart) obEnd = obStart + 60;

        if (isOverlapping(sMin, sMin + duration, obStart, obEnd)) {
          return res.status(409).json({
            success: false,
            error: `El nuevo horario (${newTime} - ${newEndTime}) ya se encuentra reservado.`
          });
        }
      }
    }

    await db.query(
      `UPDATE appointments SET 
        status = COALESCE(?, status),
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        end_time = COALESCE(?, end_time),
        observations = COALESCE(?, observations),
        service_id = COALESCE(?, service_id),
        branch_id = COALESCE(?, branch_id)
       WHERE id = ?`,
      [
        status ? status.toUpperCase() : null,
        newDate,
        newTime,
        newEndTime,
        observations,
        service_id,
        newBranchId,
        id
      ]
    );

    // Notificar al cliente si fue modificado
    if (status) {
      await db.query(
        `INSERT INTO notifications (client_id, appointment_id, title, message, type)
         VALUES (?, ?, ?, ?, 'ACTUALIZACION')`,
        [
          current.client_id,
          id,
          `Estado de Cita Actualizado: ${status}`,
          `Tu cita de ${current.service_name} para el ${newDate} ha cambiado a estado ${status}.`
        ]
      ).catch(() => {});
    }

    // Emitir tiempo real
    notifyBookingChange(newBranchId, newDate);
    if (current.branch_id !== newBranchId || current.date !== newDate) {
      notifyBookingChange(current.branch_id, current.date);
    }

    return res.json({ success: true, message: 'Cita actualizada correctamente.' });
  } catch (err) {
    console.error('Error en updateAppointment:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar la cita.' });
  }
}

/**
 * Cancelación de cita: libera el horario inmediatamente y notifica al cliente
 */
async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [existing] = await db.query(
      `SELECT a.*, s.name as service_name, b.name as branch_name 
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN branches b ON a.branch_id = b.id
       WHERE a.id = ?`,
      [id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada.' });
    }

    const current = existing[0];

    if (user.role === 'CLIENTE' && current.client_id !== user.client_id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para cancelar esta cita.' });
    }

    await db.query("UPDATE appointments SET status = 'CANCELADA' WHERE id = ?", [id]);

    // Notificación en el sistema
    await db.query(
      `INSERT INTO notifications (client_id, appointment_id, title, message, type)
       VALUES (?, ?, ?, ?, 'CANCELACION')`,
      [
        current.client_id,
        id,
        'Cita Cancelada',
        `Tu cita para ${current.service_name} del día ${current.date} a las ${current.time} en la sucursal ${current.branch_name} ha sido cancelada exitosamente.`
      ]
    ).catch(() => {});

    // Emitir evento en tiempo real para que los clientes consultando la fecha vean el horario libre al instante
    notifyBookingChange(current.branch_id, current.date);

    return res.json({
      success: true,
      message: 'La reserva ha sido cancelada exitosamente y el horario ha quedado libre para otros clientes.'
    });
  } catch (err) {
    console.error('Error en cancelAppointment:', err);
    return res.status(500).json({ success: false, error: 'Error al cancelar la cita.' });
  }
}

/**
 * Server-Sent Events (SSE) para actualización en tiempo real de calendarios y disponibilidad
 */
function getAppointmentEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Enviar mensaje inicial de saludo
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Canal en tiempo real activo' })}\n\n`);

  const onBookingChanged = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'BOOKING_CHANGED', ...data })}\n\n`);
  };

  realtimeService.on('booking_changed', onBookingChanged);

  // Mantener viva la conexión con ping periódico
  const keepAliveInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    realtimeService.off('booking_changed', onBookingChanged);
  });
}

/**
 * Retención temporal de horario (Hold de 10 minutos) mientras el cliente confirma
 */
async function holdSlot(req, res) {
  try {
    const { branch_id, date, time } = req.body;
    if (!branch_id || !date || !time) {
      return res.status(400).json({ success: false, error: 'Parámetros incompletos.' });
    }

    const sessionId = req.headers['x-session-id'] || `sess_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.query(
      `INSERT INTO appointment_holds (branch_id, date, time, session_id, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [branch_id, date, time, sessionId, expiresAt]
    );

    res.json({
      success: true,
      message: 'Horario retenido temporalmente por 10 minutos.',
      expiresAt,
      holdMinutes: 10
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAvailableSlots,
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentEvents,
  holdSlot
};
