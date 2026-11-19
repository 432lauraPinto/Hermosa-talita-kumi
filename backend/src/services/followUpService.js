const db = require('../config/database');

/**
 * Servicio de Cálculo de Seguimiento Basado en Reglas
 * La IA NO inventa fechas: este servicio calcula estrictamente en base a las reglas configuradas.
 */
async function calculateClientFollowUp(clientId) {
  // 1. Obtener el cliente
  const [clients] = await db.query(
    `SELECT c.*, u.name, u.email, u.phone 
     FROM clients c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`,
    [clientId]
  );

  if (!clients || clients.length === 0) {
    return {
      hasHistory: false,
      message: 'Cliente no encontrado en el sistema.'
    };
  }

  const client = clients[0];

  // 2. Obtener el último tratamiento realizado
  const [history] = await db.query(
    `SELECT * FROM treatment_history 
     WHERE client_id = ? 
     ORDER BY date DESC, id DESC 
     LIMIT 1`,
    [clientId]
  );

  if (!history || history.length === 0) {
    return {
      hasHistory: false,
      clientName: client.name,
      message: `Hola ${client.name}, aún no tienes tratamientos previos registrados en tu historial. Puedes explorar nuestros servicios faciales o corporales y agendar tu primera cita.`
    };
  }

  const lastTreatment = history[0];

  // 3. Buscar regla configurada para este tratamiento
  const [rules] = await db.query(
    `SELECT * FROM treatment_rules 
     WHERE treatment_name = ? AND active = 1
     LIMIT 1`,
    [lastTreatment.treatment_name]
  );

  let rule = rules && rules.length > 0 ? rules[0] : null;

  // Si no hay regla exacta por nombre, buscar por tipo (FACIAL / CORPORAL)
  if (!rule) {
    const [fallbackRules] = await db.query(
      `SELECT * FROM treatment_rules 
       WHERE treatment_type = ? AND active = 1
       LIMIT 1`,
      [lastTreatment.treatment_type]
    );
    if (fallbackRules && fallbackRules.length > 0) {
      rule = fallbackRules[0];
    }
  }

  // Intervalo por defecto si no hubiera regla configurada
  const interval = rule ? rule.recommended_interval : 21;
  const unit = rule ? rule.interval_unit : 'DIAS';

  // 4. Calcular próxima fecha matemáticamente
  const lastDate = new Date(lastTreatment.date);
  const calculatedNextDate = new Date(lastDate);

  if (unit === 'DIAS') {
    calculatedNextDate.setDate(calculatedNextDate.getDate() + interval);
  } else if (unit === 'SEMANAS') {
    calculatedNextDate.setDate(calculatedNextDate.getDate() + interval * 7);
  } else if (unit === 'MESES') {
    calculatedNextDate.setMonth(calculatedNextDate.getMonth() + interval);
  }

  const nextDateFormatted = calculatedNextDate.toISOString().split('T')[0];

  // 5. Verificar si el cliente ya tiene una reserva pendiente o confirmada
  const [upcomingAppointments] = await db.query(
    `SELECT a.*, s.name as service_name 
     FROM appointments a 
     JOIN services s ON a.service_id = s.id 
     WHERE a.client_id = ? AND a.status IN ('PENDIENTE', 'CONFIRMADA') AND a.date >= ?
     ORDER BY a.date ASC LIMIT 1`,
    [clientId, lastTreatment.date]
  );

  const hasAppointment = upcomingAppointments && upcomingAppointments.length > 0;
  const existingAppointment = hasAppointment ? upcomingAppointments[0] : null;

  // 6. Formatear fechas en español para la respuesta amigable
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  const lastDateStr = lastDate.toLocaleDateString('es-ES', options);
  const nextDateStr = calculatedNextDate.toLocaleDateString('es-ES', options);

  let recommendationText = '';
  if (hasAppointment) {
    recommendationText = `Tu última sesión de ${lastTreatment.treatment_name} fue el ${lastDateStr}. Según el intervalo configurado de ${interval} ${unit.toLowerCase()}, tu siguiente sesión corresponde el ${nextDateStr}. Ya cuentas con una cita agendada para el ${existingAppointment.date} a las ${existingAppointment.time} para "${existingAppointment.service_name}".`;
  } else {
    recommendationText = `Tu última sesión de ${lastTreatment.treatment_name} fue el ${lastDateStr}. Según la frecuencia recomendada de ${interval} ${unit.toLowerCase()} configurada en el sistema, tu siguiente sesión corresponde el ${nextDateStr}. Actualmente no tienes una reserva registrada para esa fecha. ¿Deseas agendarla ahora?`;
  }

  return {
    hasHistory: true,
    clientName: client.name,
    lastTreatment: {
      id: lastTreatment.id,
      name: lastTreatment.treatment_name,
      type: lastTreatment.treatment_type,
      date: lastTreatment.date,
      dateFormatted: lastDateStr,
      professional: lastTreatment.professional,
      observations: lastTreatment.observations
    },
    rule: rule ? {
      interval,
      unit,
      description: rule.description
    } : null,
    nextSession: {
      date: nextDateFormatted,
      dateFormatted: nextDateStr,
      hasAppointment,
      existingAppointment: existingAppointment ? {
        id: existingAppointment.id,
        date: existingAppointment.date,
        time: existingAppointment.time,
        status: existingAppointment.status,
        service: existingAppointment.service_name
      } : null
    },
    recommendationText
  };
}

module.exports = {
  calculateClientFollowUp
};
