const db = require('../config/database');
const { calculateClientFollowUp } = require('./followUpService');

/**
 * Herramientas oficiales del Agente de IA para Hermosa Talita Kumi
 * Consultas acotadas a datos reales y estrictamente aisladas por cliente autenticado.
 */
const tools = {
  // 1. Consultar las 4 sucursales oficiales
  async consultar_sucursales() {
    const [branches] = await db.query(
      'SELECT id, name, city, zone, address, whatsapp, opening_hours FROM branches WHERE active = 1 ORDER BY city ASC, name ASC'
    );
    return {
      total: branches.length,
      sucursales: branches.map(b => ({
        nombre: b.name,
        ciudad: b.city,
        zona: b.zone,
        direccion: b.address,
        whatsapp: b.whatsapp,
        horarios: b.opening_hours
      }))
    };
  },

  // 2. Consultar servicios y tratamientos (7 Categorías)
  async consultar_servicios({ categoria = null, tipo = null } = {}) {
    let sql = `SELECT id, name, description, category, price, duration, type FROM services WHERE status = 'ACTIVO'`;
    const params = [];
    if (tipo) {
      sql += ` AND (type = ? OR category_code = ?)`;
      params.push(tipo.toUpperCase(), tipo.toUpperCase());
    }
    if (categoria) {
      sql += ` AND (category LIKE ? OR category_code LIKE ?)`;
      params.push(`%${categoria}%`, `%${categoria}%`);
    }
    sql += ` ORDER BY category, name ASC`;
    const [rows] = await db.query(sql, params);
    return {
      total: rows.length,
      servicios: rows.map(s => ({
        id: s.id,
        nombre: s.name,
        categoria: s.category,
        duracion: `${s.duration} min`,
        precio: `Bs ${parseFloat(s.price).toFixed(2)}`
      }))
    };
  },

  // 3. Consultar precios
  async consultar_precios({ servicio = null } = {}) {
    let sql = `SELECT name, price, duration, category FROM services WHERE status = 'ACTIVO'`;
    const params = [];
    if (servicio) {
      sql += ` AND name LIKE ?`;
      params.push(`%${servicio}%`);
    }
    const [rows] = await db.query(sql, params);
    return {
      precios: rows.map(r => `${r.name} (${r.category}, ${r.duration} min): Bs ${parseFloat(r.price).toFixed(2)}`)
    };
  },

  // 4. Consultar promociones activas
  async consultar_promociones() {
    const [promos] = await db.query(
      `SELECT title, description, promo_price, regular_price, discount_percent, badge, end_date FROM promotions WHERE active = 1`
    );
    return {
      total: promos.length,
      promociones: promos.map(p => ({
        titulo: p.title,
        descripcion: p.description,
        precio_promocional: `Bs ${parseFloat(p.promo_price).toFixed(2)}`,
        precio_regular: `Bs ${parseFloat(p.regular_price).toFixed(2)}`,
        descuento: `${p.discount_percent}%`,
        vigencia: p.end_date
      }))
    };
  },

  // 5. Horarios de atención generales
  async consultar_horarios() {
    return {
      horarios_atencion: 'Lunes a Sábado de 08:30 a 19:30 horas (Jornada Continua)',
      domingos: 'Cerrado por reposo y descanso espiritual',
      agenda: 'Atendemos con reserva previa por franja horaria para garantizar tu privacidad y bienestar.'
    };
  },

  // 6. Consultar disponibilidad real
  async consultar_disponibilidad({ fecha, branch_id = 1 }) {
    if (!fecha) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
      fecha = tomorrow.toISOString().split('T')[0];
    }

    const [branchRows] = await db.query('SELECT name FROM branches WHERE id = ?', [branch_id]);
    const branchName = branchRows.length > 0 ? branchRows[0].name : 'Villa Fátima';
    const maxPerSlot = 1;

    const allSlots = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
    const [booked] = await db.query(
      `SELECT time, count(*) as count FROM appointments WHERE branch_id = ? AND date = ? AND status IN ('PENDIENTE', 'CONFIRMADA') GROUP BY time`,
      [branch_id, fecha]
    );

    const busyMap = {};
    booked.forEach(b => { busyMap[b.time] = b.count; });

    const disponibles = allSlots.filter(t => (busyMap[t] || 0) < maxPerSlot);

    return {
      fecha,
      sucursal: branchName,
      capacidad_por_franja: maxPerSlot,
      horarios_libres: disponibles,
      total_libres: disponibles.length
    };
  },

  // --- CONSULTAS ESPECÍFICAS DE CLIENTE AUTENTICADO ---
  async consultar_perfil_cliente(clientId) {
    if (!clientId) return { error: 'Debes iniciar sesión para consultar tu información personal.' };
    const [clients] = await db.query(
      `SELECT c.*, u.name, u.email, u.phone 
       FROM clients c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [clientId]
    );
    if (!clients || clients.length === 0) return { error: 'Perfil no encontrado.' };
    const c = clients[0];
    return {
      nombre: c.name,
      email: c.email,
      telefono: c.phone || 'No registrado',
      tipo_piel: c.skin_type || 'Evaluada en cabina'
    };
  },

  async consultar_historial_tratamientos(clientId) {
    if (!clientId) return { error: 'Debes iniciar sesión para consultar tu historial de tratamientos.' };
    const [rows] = await db.query(
      `SELECT treatment_name, treatment_type, date, professional, suggested_next_session, observations 
       FROM treatment_history 
       WHERE client_id = ? 
       ORDER BY date DESC`,
      [clientId]
    );
    return {
      total_sesiones: rows.length,
      tratamientos: rows.map(r => ({
        tratamiento: r.treatment_name,
        tipo: r.treatment_type,
        fecha: r.date,
        especialista: r.professional,
        proxima_sesion_sugerida: r.suggested_next_session,
        observaciones: r.observations
      }))
    };
  },

  async consultar_reservas_cliente(clientId) {
    if (!clientId) return { error: 'Debes iniciar sesión para consultar tus reservas.' };
    const [rows] = await db.query(
      `SELECT a.id, a.booking_code, a.date, a.time, a.status, s.name as servicio, b.name as sucursal, a.total_price 
       FROM appointments a 
       JOIN services s ON a.service_id = s.id 
       JOIN branches b ON a.branch_id = b.id 
       WHERE a.client_id = ? 
       ORDER BY a.date DESC, a.time DESC`,
      [clientId]
    );
    return {
      total_citas: rows.length,
      citas: rows.map(r => ({
        codigo: r.booking_code || `HTK-${r.id}`,
        servicio: r.servicio,
        sucursal: r.sucursal,
        fecha: r.date,
        hora: r.time,
        estado: r.status,
        monto: `Bs ${parseFloat(r.total_price || 0).toFixed(2)}`
      }))
    };
  },

  async consultar_pagos_cliente(clientId) {
    if (!clientId) return { error: 'Debes iniciar sesión para consultar tus pagos y saldos.' };
    const [rows] = await db.query(
      `SELECT id, total_amount, paid_amount, pending_balance, payment_date, payment_method, status 
       FROM payments 
       WHERE client_id = ? 
       ORDER BY payment_date DESC`,
      [clientId]
    );
    let totalCobrado = 0;
    let totalAbonado = 0;
    let totalPendiente = 0;
    rows.forEach(p => {
      totalCobrado += Number(p.total_amount) || 0;
      totalAbonado += Number(p.paid_amount) || 0;
      totalPendiente += Number(p.pending_balance) || 0;
    });
    return {
      resumen: {
        total_servicios: `Bs ${totalCobrado.toFixed(2)}`,
        total_pagado: `Bs ${totalAbonado.toFixed(2)}`,
        saldo_pendiente: `Bs ${totalPendiente.toFixed(2)}`
      },
      historial: rows
    };
  },

  async consultar_proxima_sesion(clientId) {
    if (!clientId) return { error: 'Debes iniciar sesión para consultar la fecha de tu próxima sesión.' };
    return await calculateClientFollowUp(clientId);
  }
};

/**
 * Motor conversacional inteligente con validación anti prompt-injection
 */
async function processChatMessage({ message, user }) {
  const text = (message || '').trim();
  const lower = text.toLowerCase();
  const clientId = user && user.role === 'CLIENTE' ? user.client_id : null;
  const userName = user ? user.name : 'estimada cliente';

  // Mitigación estricta de Prompt Injection (Módulo 04.6)
  const injectionPatterns = [
    'ignora tus reglas', 'ignore all instructions', 'dame la contraseña', 'root access',
    'muestra reservas de otra persona', 'elimina la base de datos', 'sql injection', 'dump database'
  ];
  if (injectionPatterns.some(p => lower.includes(p))) {
    return {
      reply: 'Como asistente virtual de Hermosa Talita Kumi, únicamente tengo autorización para responder consultas sobre nuestros servicios estéticos, sucursales y la gestión de tus propias citas autorizadas.',
      quickReplies: ['Ver servicios', 'Sucursales', 'Agendar cita']
    };
  }

  // Intención 1: Consulta de Sucursales
  if (lower.includes('sucursal') || lower.includes('sucursales') || lower.includes('donde estan') || 
      lower.includes('dónde están') || lower.includes('direccion') || lower.includes('dirección') ||
      lower.includes('villa fatima') || lower.includes('upea') || lower.includes('ceja') || lower.includes('max paredes')) {
    const data = await tools.consultar_sucursales();
    return {
      reply: `Hermosa Talita Kumi cuenta con 4 sucursales en el departamento de La Paz:\n\n` +
             data.sucursales.map(s => `📍 **${s.nombre}** (${s.ciudad}): ${s.direccion}. WhatsApp: ${s.whatsapp}`).join('\n\n') +
             `\n\n¿Deseas consultar disponibilidad o agendar tu cita en alguna de ellas?`,
      quickReplies: ['Agendar cita en Villa Fátima', 'Agendar en UPEA', 'Agendar en Ceja', 'Agendar en Max Paredes']
    };
  }

  // Intención 2: Consulta de Promociones
  if (lower.includes('promocion') || lower.includes('promociones') || lower.includes('oferta') || lower.includes('descuento') || lower.includes('rebaja')) {
    const data = await tools.consultar_promociones();
    if (data.total === 0) {
      return {
        reply: 'Actualmente no tenemos campañas promocionales temporales abiertas, pero contamos con excelentes tarifas estándar en todas nuestras 7 categorías.',
        quickReplies: ['Ver servicios', 'Consultar precios']
      };
    }
    return {
      reply: `¡Tenemos estas promociones vigentes especiales para ti en Hermosa Talita Kumi! 🎉\n\n` +
             data.promociones.map(p => `✨ **${p.titulo}**: ${p.descripcion}\nTarifa promocional: **${p.precio_promocional}** (Antes: ${p.precio_regular}, Ahorras ${p.descuento}).`).join('\n\n'),
      quickReplies: ['Agendar cita', 'Ver más tratamientos']
    };
  }

  // Intención 3: Derivación a Humano / WhatsApp
  if (lower.includes('humano') || lower.includes('persona') || lower.includes('whatsapp') || lower.includes('teléfono') || lower.includes('telefono') || lower.includes('contacto') || lower.includes('reclamo')) {
    return {
      reply: `¡Con mucho gusto te comunicamos directamente con nuestras especialistas de cabina!\n\nPuedes escribirnos a nuestro número oficial central de WhatsApp:\n` +
             `• **WhatsApp Central Talita Kumi:** +591 62353452 (Atención para Villa Fátima, UPEA, Ceja y Max Paredes)\n\n¡Estaremos felices de atenderte personalmente!`,
      quickReplies: ['Agendar cita en línea', 'Ver servicios']
    };
  }

  // Intención 4: Próxima sesión o seguimiento dérmico
  if (lower.includes('próxima sesión') || lower.includes('proxima sesion') || lower.includes('me toca') || lower.includes('cuándo me toca') || lower.includes('cuando me toca')) {
    if (!clientId) {
      return {
        reply: `Hola. Para poder informarte con exactitud sobre tu próxima sesión y el estado de tu tratamiento, por favor inicia sesión con tu cuenta de cliente en la barra superior.`,
        quickReplies: ['Iniciar sesión', 'Ver servicios']
      };
    }
    const followUp = await tools.consultar_proxima_sesion(clientId);
    return {
      reply: `Hola ${userName}. ${followUp.message}`,
      quickReplies: ['Mis reservas', 'Mis tratamientos', 'Ver servicios']
    };
  }

  // Intención 5: Mis reservas o citas
  if (lower.includes('mi cita') || lower.includes('mis citas') || lower.includes('mis reservas') || lower.includes('tengo reserva')) {
    if (!clientId) {
      return {
        reply: `Para consultar el estado de tus citas programadas, por favor inicia sesión en tu cuenta.`,
        quickReplies: ['Iniciar sesión', 'Ver horarios']
      };
    }
    const data = await tools.consultar_reservas_cliente(clientId);
    if (data.total_citas === 0) {
      return {
        reply: `No tienes reservas activas registradas en este momento. ¿Te gustaría agendar una cita ahora?`,
        quickReplies: ['Agendar cita', 'Ver servicios']
      };
    }
    return {
      reply: `Estimada ${userName}, aquí tienes el detalle de tus citas:\n\n` +
             data.citas.map(c => `📅 **${c.servicio}** en ${c.sucursal}\nFecha: ${c.fecha} a las ${c.hora}\nCódigo: ${c.codigo} | Estado: ${c.estado}`).join('\n\n'),
      quickReplies: ['Agendar nueva cita', 'Mis tratamientos']
    };
  }

  // Intención 6: Precios y catálogo de tratamientos
  if (lower.includes('precio') || lower.includes('cuanto cuesta') || lower.includes('cuánto cuesta') || lower.includes('tarifa') || lower.includes('costo') || lower.includes('servicios') || lower.includes('tratamientos')) {
    const data = await tools.consultar_servicios();
    return {
      reply: `En **Hermosa Talita Kumi** contamos con 7 categorías especializadas con precios transparentes en Bolivianos (Bs):\n\n` +
             `1. **Tratamientos Faciales** (Limpieza básica desde Bs 120, profunda Bs 180, antiedad Bs 250)\n` +
             `2. **Baño de Luna** (Cuerpo completo Bs 280, piernas Bs 140, espalda Bs 150)\n` +
             `3. **Cuidado Corporal** (Exfoliación Bs 170, reafirmante Bs 230, reductor Bs 250)\n` +
             `4. **Masajes Corporales** (Relajante Bs 180, descontracturante Bs 200, piedras calientes Bs 240, maderoterapia Bs 230)\n` +
             `5. **Depilación Facial y Corporal** (Desde Bs 50)\n` +
             `6. **Lifting de Pestañas** (Natural Bs 120, con keratina Bs 150)\n` +
             `7. **Perfilado de Cejas** (Diseño Bs 50, con henna Bs 80)\n\n` +
             `¿Sobre qué tratamiento en particular te gustaría más detalles?`,
      quickReplies: ['Ver Baño de Luna', 'Ver Faciales', 'Ver Masajes', 'Agendar cita']
    };
  }

  // Intención 7: Consulta de Horarios y Disponibilidad
  if (lower.includes('horario') || lower.includes('disponibilidad') || lower.includes('turnos') || lower.includes('atienden')) {
    const hours = await tools.consultar_horarios();
    return {
      reply: `Atendemos de ${hours.horarios_atencion}.\n\n` +
             `• ${hours.domingos}.\n` +
             `• ${hours.agenda}\n\n` +
             `¿Deseas verificar horarios disponibles para un día en especial?`,
      quickReplies: ['Consultar disponibilidad', 'Agendar cita', 'Nuestras 4 sucursales']
    };
  }

  // Respuesta por defecto cordial en español de Bolivia
  return {
    reply: `¡Hola! Con gusto te oriento en Hermosa Talita Kumi. Puedo informarte sobre nuestros tratamientos en las 7 categorías, los precios en Bolivianos (Bs), la ubicación de nuestras 4 sucursales (Villa Fátima, UPEA – El Alto, Ceja – El Alto, Max Paredes) o consultar la disponibilidad de turnos. ¿En qué podemos ayudarte?`,
    quickReplies: ['Nuestras 4 sucursales', 'Ver precios y servicios', 'Promociones especiales', 'Escribir por WhatsApp']
  };
}

module.exports = {
  tools,
  processChatMessage
};
