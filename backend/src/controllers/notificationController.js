const db = require('../config/database');

async function getNotifications(req, res) {
  try {
    const user = req.user;
    if (!user || !user.client_id) {
      // Si es admin sin client_id, devolver vacío o notifications de sistema
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const clientId = user.client_id;
    const [notifications] = await db.query(
      `SELECT n.*, 
              a.date as appointment_date, 
              a.time as appointment_time,
              s.name as service_name,
              b.name as branch_name,
              b.address as branch_address
       FROM notifications n
       LEFT JOIN appointments a ON n.appointment_id = a.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN branches b ON a.branch_id = b.id
       WHERE n.client_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [clientId]
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error en getNotifications:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar notificaciones.' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user || !user.client_id) {
      return res.status(403).json({ success: false, error: 'No autorizado.' });
    }

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND client_id = ?',
      [id, user.client_id]
    );

    return res.json({ success: true, message: 'Notificación marcada como leída.' });
  } catch (err) {
    console.error('Error en markAsRead:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar notificación.' });
  }
}

async function markAllAsRead(req, res) {
  try {
    const user = req.user;
    if (!user || !user.client_id) {
      return res.status(403).json({ success: false, error: 'No autorizado.' });
    }

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE client_id = ?',
      [user.client_id]
    );

    return res.json({ success: true, message: 'Todas las notificaciones fueron marcadas como leídas.' });
  } catch (err) {
    console.error('Error en markAllAsRead:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar notificaciones.' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
