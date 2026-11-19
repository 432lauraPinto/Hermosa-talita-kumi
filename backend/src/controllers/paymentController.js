const db = require('../config/database');

async function getPayments(req, res) {
  try {
    const user = req.user;
    const { client_id, status } = req.query;

    let sql = `
      SELECT p.*, 
             c.id as client_id, u.name as client_name, u.email as client_email,
             a.date as appointment_date, a.time as appointment_time, s.name as service_name
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'CLIENTE') {
      sql += ' AND p.client_id = ?';
      params.push(user.client_id);
    } else if (client_id) {
      sql += ' AND p.client_id = ?';
      params.push(client_id);
    }

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status.toUpperCase());
    }

    sql += ' ORDER BY p.payment_date DESC, p.id DESC';

    const [payments] = await db.query(sql, params);

    // Totales calculados
    let totalCobrado = 0;
    let totalAbonado = 0;
    let totalPendiente = 0;

    payments.forEach(p => {
      totalCobrado += Number(p.total_amount) || 0;
      totalAbonado += Number(p.paid_amount) || 0;
      totalPendiente += Number(p.pending_balance) || 0;
    });

    return res.json({
      success: true,
      summary: {
        totalCobrado: totalCobrado.toFixed(2),
        totalAbonado: totalAbonado.toFixed(2),
        totalPendiente: totalPendiente.toFixed(2)
      },
      payments
    });
  } catch (err) {
    console.error('Error en getPayments:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener pagos.' });
  }
}

async function createPayment(req, res) {
  try {
    const { client_id, appointment_id, treatment_history_id, total_amount, paid_amount, payment_date, payment_method, notes } = req.body;

    if (!client_id || total_amount === undefined || !payment_date) {
      return res.status(400).json({
        success: false,
        error: 'Cliente, monto total y fecha de pago son obligatorios.'
      });
    }

    const total = parseFloat(total_amount);
    const pagado = parseFloat(paid_amount || 0);
    const saldo = Math.max(0, total - pagado);

    let status = 'PENDIENTE';
    if (pagado >= total) {
      status = 'PAGADO';
    } else if (pagado > 0) {
      status = 'PARCIAL';
    }

    const [result] = await db.query(
      `INSERT INTO payments 
       (client_id, appointment_id, treatment_history_id, total_amount, paid_amount, pending_balance, payment_date, payment_method, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        appointment_id || null,
        treatment_history_id || null,
        total,
        pagado,
        saldo,
        payment_date,
        payment_method || 'EFECTIVO',
        status,
        notes || ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente.',
      paymentId: result.insertId,
      pendingBalance: saldo.toFixed(2),
      status
    });
  } catch (err) {
    console.error('Error en createPayment:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar pago.' });
  }
}

async function updatePayment(req, res) {
  try {
    const { id } = req.params;
    const { total_amount, paid_amount, payment_date, payment_method, notes } = req.body;

    const [existing] = await db.query('SELECT * FROM payments WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Registro de pago no encontrado.' });
    }

    const current = existing[0];
    const total = total_amount !== undefined ? parseFloat(total_amount) : Number(current.total_amount);
    const pagado = paid_amount !== undefined ? parseFloat(paid_amount) : Number(current.paid_amount);
    const saldo = Math.max(0, total - pagado);

    let status = 'PENDIENTE';
    if (pagado >= total) {
      status = 'PAGADO';
    } else if (pagado > 0) {
      status = 'PARCIAL';
    }

    await db.query(
      `UPDATE payments SET 
        total_amount = ?,
        paid_amount = ?,
        pending_balance = ?,
        payment_date = COALESCE(?, payment_date),
        payment_method = COALESCE(?, payment_method),
        status = ?,
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [total, pagado, saldo, payment_date, payment_method, status, notes, id]
    );

    return res.json({
      success: true,
      message: 'Pago actualizado exitosamente.',
      pendingBalance: saldo.toFixed(2),
      status
    });
  } catch (err) {
    console.error('Error en updatePayment:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar pago.' });
  }
}

module.exports = {
  getPayments,
  createPayment,
  updatePayment
};
