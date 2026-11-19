const db = require('../config/database');

async function getTreatmentHistory(req, res) {
  try {
    const user = req.user;
    const { client_id } = req.query;

    let sql = `
      SELECT th.*, 
             c.id as client_id, u.name as client_name, u.email as client_email,
             a.time as appointment_time
      FROM treatment_history th
      JOIN clients c ON th.client_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN appointments a ON th.appointment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // Si es cliente, solo ve su propio historial
    if (user.role === 'CLIENTE') {
      sql += ' AND th.client_id = ?';
      params.push(user.client_id);
    } else if (client_id) {
      sql += ' AND th.client_id = ?';
      params.push(client_id);
    }

    sql += ' ORDER BY th.date DESC, th.id DESC';

    const [history] = await db.query(sql, params);
    return res.json({ success: true, history });
  } catch (err) {
    console.error('Error en getTreatmentHistory:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener historial de tratamientos.' });
  }
}

async function createTreatmentRecord(req, res) {
  try {
    const {
      client_id,
      appointment_id,
      treatment_name,
      treatment_type,
      date,
      observations,
      professional,
      status
    } = req.body;

    if (!client_id || !treatment_name || !treatment_type || !date || !professional) {
      return res.status(400).json({
        success: false,
        error: 'Cliente, nombre del tratamiento, tipo, fecha y profesional son obligatorios.'
      });
    }

    // CALCULAR PRÓXIMA SESIÓN SEGÚN REGLAS DE NEGOCIO (NO ALUCINADA)
    const [rules] = await db.query(
      'SELECT recommended_interval, interval_unit FROM treatment_rules WHERE treatment_name = ? AND active = 1 LIMIT 1',
      [treatment_name]
    );

    let interval = 21;
    let unit = 'DIAS';

    if (rules && rules.length > 0) {
      interval = rules[0].recommended_interval;
      unit = rules[0].interval_unit;
    } else {
      // Buscar regla por tipo
      const [typeRules] = await db.query(
        'SELECT recommended_interval, interval_unit FROM treatment_rules WHERE treatment_type = ? AND active = 1 LIMIT 1',
        [treatment_type.toUpperCase()]
      );
      if (typeRules && typeRules.length > 0) {
        interval = typeRules[0].recommended_interval;
        unit = typeRules[0].interval_unit;
      }
    }

    const sessionDate = new Date(date);
    const nextSession = new Date(sessionDate);
    if (unit === 'DIAS') {
      nextSession.setDate(nextSession.getDate() + interval);
    } else if (unit === 'SEMANAS') {
      nextSession.setDate(nextSession.getDate() + interval * 7);
    } else if (unit === 'MESES') {
      nextSession.setMonth(nextSession.getMonth() + interval);
    }

    const suggestedNextSessionStr = nextSession.toISOString().split('T')[0];

    const [insertRes] = await db.query(
      `INSERT INTO treatment_history 
       (client_id, appointment_id, treatment_name, treatment_type, date, observations, professional, suggested_next_session, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        appointment_id || null,
        treatment_name.trim(),
        treatment_type.toUpperCase(),
        date,
        observations || '',
        professional.trim(),
        suggestedNextSessionStr,
        status || 'COMPLETADO'
      ]
    );

    // Si viene de una cita, actualizar la cita a REALIZADA
    if (appointment_id) {
      await db.query("UPDATE appointments SET status = 'REALIZADA' WHERE id = ?", [appointment_id]);
    }

    return res.status(201).json({
      success: true,
      message: 'Tratamiento registrado en el historial con éxito.',
      treatmentHistoryId: insertRes.insertId,
      suggestedNextSession: suggestedNextSessionStr,
      ruleApplied: `${interval} ${unit.toLowerCase()}`
    });
  } catch (err) {
    console.error('Error en createTreatmentRecord:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar tratamiento en historial.' });
  }
}

async function updateTreatmentRecord(req, res) {
  try {
    const { id } = req.params;
    const { observations, professional, suggested_next_session, status } = req.body;

    await db.query(
      `UPDATE treatment_history SET 
        observations = COALESCE(?, observations),
        professional = COALESCE(?, professional),
        suggested_next_session = COALESCE(?, suggested_next_session),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [observations, professional, suggested_next_session, status, id]
    );

    return res.json({ success: true, message: 'Registro de tratamiento actualizado correctamente.' });
  } catch (err) {
    console.error('Error en updateTreatmentRecord:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar tratamiento.' });
  }
}

module.exports = {
  getTreatmentHistory,
  createTreatmentRecord,
  updateTreatmentRecord
};
