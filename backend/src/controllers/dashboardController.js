const db = require('../config/database');

async function getAdminDashboardStats(req, res) {
  try {
    // 1. Total Clientes
    const [clientCount] = await db.query('SELECT COUNT(*) as count FROM clients');
    const totalClients = clientCount[0].count;

    // 2. Reservas por estado
    const [pendingApp] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'PENDIENTE'");
    const pendingAppointments = pendingApp[0].count;

    const [confirmedApp] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'CONFIRMADA'");
    const confirmedAppointments = confirmedApp[0].count;

    // 3. Tratamientos realizados
    const [treatmentsDone] = await db.query("SELECT COUNT(*) as count FROM treatment_history WHERE status = 'COMPLETADO'");
    const totalTreatmentsDone = treatmentsDone[0].count;

    // 4. Pagos y saldos pendientes
    const [pendingPay] = await db.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(pending_balance), 0) as total_debt FROM payments WHERE status IN ('PENDIENTE', 'PARCIAL')"
    );
    const pendingPaymentsCount = pendingPay[0].count;
    const pendingBalanceTotal = parseFloat(pendingPay[0].total_debt || 0).toFixed(2);

    const [totalRevenue] = await db.query(
      "SELECT COALESCE(SUM(paid_amount), 0) as total FROM payments"
    );
    const totalPaidRevenue = parseFloat(totalRevenue[0].total || 0).toFixed(2);

    // 5. Próximas citas / tratamientos agendados
    const [upcomingAppointments] = await db.query(
      `SELECT a.id, a.date, a.time, a.status, s.name as service_name, s.type as service_type,
              u.name as client_name, u.phone as client_phone
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN clients c ON a.client_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE a.status IN ('PENDIENTE', 'CONFIRMADA')
       ORDER BY a.date ASC, a.time ASC
       LIMIT 5`
    );

    // 6. Servicios más solicitados
    const [topServices] = await db.query(
      `SELECT s.id, s.name, s.type, s.price, COUNT(a.id) as booking_count
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id
       GROUP BY s.id
       ORDER BY booking_count DESC, s.name ASC
       LIMIT 5`
    );

    return res.json({
      success: true,
      stats: {
        totalClients,
        pendingAppointments,
        confirmedAppointments,
        totalTreatmentsDone,
        pendingPaymentsCount,
        pendingBalanceTotal,
        totalPaidRevenue
      },
      upcomingAppointments,
      topServices,
      databaseEngine: db.getEngine()
    });
  } catch (err) {
    console.error('Error en getAdminDashboardStats:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener estadísticas del dashboard.' });
  }
}

module.exports = {
  getAdminDashboardStats
};
