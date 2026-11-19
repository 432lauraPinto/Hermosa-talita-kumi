const db = require('../config/database');
const { calculateClientFollowUp } = require('../services/followUpService');

async function getAllClients(req, res) {
  try {
    const [clients] = await db.query(
      `SELECT c.id as client_id, c.birth_date, c.gender, c.skin_type, c.emergency_contact, c.emergency_phone,
              c.medical_notes, c.allergies, c.created_at,
              u.id as user_id, u.name, u.email, u.phone, u.avatar,
              (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id) as total_appointments,
              (SELECT COUNT(*) FROM treatment_history th WHERE th.client_id = c.id) as total_treatments,
              (SELECT COALESCE(SUM(p.pending_balance), 0) FROM payments p WHERE p.client_id = c.id) as pending_balance
       FROM clients c
       JOIN users u ON c.user_id = u.id
       ORDER BY u.name ASC`
    );

    return res.json({ success: true, clients });
  } catch (err) {
    console.error('Error en getAllClients:', err);
    return res.status(500).json({ success: false, error: 'Error al listar clientes.' });
  }
}

async function getClientDetails(req, res) {
  try {
    const { id } = req.params;

    const [clients] = await db.query(
      `SELECT c.*, u.id as user_id, u.name, u.email, u.phone, u.avatar 
       FROM clients c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [id]
    );

    if (!clients || clients.length === 0) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const client = clients[0];

    const [appointments] = await db.query(
      `SELECT a.*, s.name as service_name, s.price, s.type as service_type 
       FROM appointments a 
       JOIN services s ON a.service_id = s.id 
       WHERE a.client_id = ? 
       ORDER BY a.date DESC`,
      [id]
    );

    const [history] = await db.query(
      `SELECT * FROM treatment_history WHERE client_id = ? ORDER BY date DESC`,
      [id]
    );

    const [products] = await db.query(
      `SELECT cp.*, p.name as product_name, p.brand, p.category 
       FROM client_products cp 
       JOIN beauty_products p ON cp.product_id = p.id 
       WHERE cp.client_id = ?`,
      [id]
    );

    const [payments] = await db.query(
      `SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC`,
      [id]
    );

    const followUp = await calculateClientFollowUp(id);

    return res.json({
      success: true,
      client,
      appointments,
      history,
      products,
      payments,
      followUp
    });
  } catch (err) {
    console.error('Error en getClientDetails:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener detalles del cliente.' });
  }
}

module.exports = {
  getAllClients,
  getClientDetails
};
