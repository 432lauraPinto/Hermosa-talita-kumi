const db = require('../config/database');

/**
 * Cliente autenticado crea una solicitud de producto
 * NO es compra en línea ni checkout. El personal coordina entrega y pago presencial.
 */
async function createRequest(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, branch_id, quantity = 1, notes = '' } = req.body;

    if (!product_id || !branch_id) {
      return res.status(400).json({ success: false, error: 'Producto y sucursal requeridos.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Cantidad inválida.' });
    }

    // Verificar producto
    const [products] = await db.query('SELECT * FROM beauty_products WHERE id = ?', [product_id]);
    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }
    const product = products[0];

    // Verificar sucursal
    const [branches] = await db.query('SELECT * FROM branches WHERE id = ?', [branch_id]);
    if (!branches || branches.length === 0) {
      return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
    }
    const branch = branches[0];

    // Obtener datos del cliente
    let clientId = null;
    let clientName = req.user.name || 'Cliente';
    let clientPhone = req.user.phone || '';
    let clientEmail = req.user.email || '';

    const [clients] = await db.query('SELECT * FROM clients WHERE user_id = ?', [userId]);
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    }

    const [insertRes] = await db.query(
      `INSERT INTO product_requests 
       (client_id, user_id, product_id, branch_id, quantity, client_name, client_phone, client_email, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RECIBIDA', ?)`,
      [clientId, userId, product_id, branch_id, qty, clientName, clientPhone, clientEmail, notes.trim()]
    );

    const requestId = insertRes.insertId;

    // Crear notificación para administración
    await db.query(
      `INSERT INTO notifications (branch_id, title, message, type) 
       VALUES (?, ?, ?, 'PRODUCTO')`,
      [
        branch_id,
        'Nueva Solicitud de Producto',
        `Cliente ${clientName} solicitó ${qty} unidad(es) de ${product.name} en sucursal ${branch.name}.`
      ]
    );

    return res.status(201).json({
      success: true,
      requestId,
      message: 'Solicitud enviada correctamente. El personal de Hermosa Talita Kumi se comunicará contigo para coordinar la entrega y el pago presencial. Recuerda que no se realizan cobros en la web.',
      data: {
        id: requestId,
        product_name: product.name,
        branch_name: branch.name,
        quantity: qty,
        status: 'RECIBIDA'
      }
    });
  } catch (err) {
    console.error('Error en createRequest:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar solicitud de producto.' });
  }
}

/**
 * Cliente consulta sus propias solicitudes
 */
async function getMyRequests(req, res) {
  try {
    const userId = req.user.id;
    const [requests] = await db.query(
      `SELECT pr.*, 
              bp.name AS product_name, bp.brand AS product_brand, bp.price AS product_price, bp.image AS product_image, bp.type AS product_type,
              b.name AS branch_name, b.address AS branch_address, b.whatsapp AS branch_whatsapp
       FROM product_requests pr
       JOIN beauty_products bp ON pr.product_id = bp.id
       JOIN branches b ON pr.branch_id = b.id
       WHERE pr.user_id = ?
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      requests: requests || []
    });
  } catch (err) {
    console.error('Error en getMyRequests:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener tus solicitudes.' });
  }
}

/**
 * Administrador / Encargado consulta todas las solicitudes
 */
async function getAllRequests(req, res) {
  try {
    const { branch_id, status } = req.query;
    let query = `
      SELECT pr.*, 
             bp.name AS product_name, bp.brand AS product_brand, bp.price AS product_price, bp.image AS product_image,
             b.name AS branch_name, b.whatsapp AS branch_whatsapp
      FROM product_requests pr
      JOIN beauty_products bp ON pr.product_id = bp.id
      JOIN branches b ON pr.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    // Si es ENCARGADO, restringir a su sede
    if (req.user.role === 'ENCARGADO') {
      const assignedBranch = req.user.assigned_branch_id || 1;
      query += ' AND pr.branch_id = ?';
      params.push(assignedBranch);
    } else if (branch_id) {
      query += ' AND pr.branch_id = ?';
      params.push(branch_id);
    }

    if (status) {
      query += ' AND pr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY pr.created_at DESC';

    const [requests] = await db.query(query, params);
    return res.json({
      success: true,
      requests: requests || []
    });
  } catch (err) {
    console.error('Error en getAllRequests:', err);
    return res.status(500).json({ success: false, error: 'Error al listar solicitudes.' });
  }
}

/**
 * Administrador / Encargado actualiza estado de solicitud
 */
async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_notes, deduct_stock } = req.body;

    const validStatuses = ['RECIBIDA', 'EN_REVISION', 'CONFIRMADA', 'LISTA_RECOJO', 'ENTREGADA', 'CANCELADA'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado de solicitud no válido.' });
    }

    const [existing] = await db.query('SELECT * FROM product_requests WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    }
    const current = existing[0];

    // Verificar permisos de encargado
    if (req.user.role === 'ENCARGADO' && req.user.assigned_branch_id && current.branch_id !== req.user.assigned_branch_id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso sobre solicitudes de otra sede.' });
    }

    await db.query(
      `UPDATE product_requests 
       SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, admin_notes || null, id]
    );

    // Si se marcó como ENTREGADA y se confirmó deducción de inventario presencial
    if (status === 'ENTREGADA' && deduct_stock) {
      const [inv] = await db.query(
        'SELECT * FROM branch_inventory WHERE branch_id = ? AND product_id = ?',
        [current.branch_id, current.product_id]
      );
      if (inv && inv.length > 0) {
        const currentStock = inv[0].stock;
        const newStock = Math.max(0, currentStock - current.quantity);
        await db.query(
          'UPDATE branch_inventory SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStock, inv[0].id]
        );
        await db.query(
          `INSERT INTO inventory_movements (branch_id, product_id, user_id, movement_type, quantity, stock_after, notes)
           VALUES (?, ?, ?, 'SALIDA_ENTREGA', ?, ?, ?)`,
          [current.branch_id, current.product_id, req.user.id, current.quantity, newStock, `Entrega presencial confirmada Solicitud #${id}`]
        );
      }
    }

    // Notificar al cliente
    await db.query(
      `INSERT INTO notifications (branch_id, title, message, type) 
       VALUES (?, ?, ?, 'PRODUCTO')`,
      [
        current.branch_id,
        'Estado de Solicitud de Producto',
        `La solicitud #${id} ha sido actualizada a estado: ${status}.`
      ]
    );

    return res.json({
      success: true,
      message: `Solicitud #${id} actualizada a ${status}.`
    });
  } catch (err) {
    console.error('Error en updateRequestStatus:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar estado de solicitud.' });
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus
};
