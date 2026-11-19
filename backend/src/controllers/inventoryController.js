const { query } = require('../config/database');

async function getInventory(req, res) {
  try {
    const { branch_id } = req.query;
    let sql = `
      SELECT bi.id, bi.branch_id, bi.product_id, bi.stock, bi.min_stock, bi.updated_at,
             b.name as branch_name,
             p.name as product_name, p.brand, p.category, p.type, p.price, p.image,
             CASE WHEN bi.stock <= 0 THEN 'AGOTADO'
                  WHEN bi.stock <= bi.min_stock THEN 'STOCK_BAJO'
                  ELSE 'DISPONIBLE' END as stock_status
      FROM branch_inventory bi
      JOIN branches b ON bi.branch_id = b.id
      JOIN beauty_products p ON bi.product_id = p.id
    `;
    const params = [];
    if (branch_id) {
      sql += ` WHERE bi.branch_id = ?`;
      params.push(parseInt(branch_id, 10));
    }
    sql += ` ORDER BY b.name ASC, p.name ASC`;

    const [rows] = await query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function registerMovement(req, res) {
  try {
    const { branch_id, product_id, movement_type, quantity, notes } = req.body;
    if (!branch_id || !product_id || !movement_type || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'Parámetros incompletos.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser un entero positivo.' });
    }

    // Consultar stock actual
    const [invRows] = await query(
      'SELECT stock FROM branch_inventory WHERE branch_id = ? AND product_id = ?',
      [branch_id, product_id]
    );

    let currentStock = 0;
    if (invRows && invRows.length > 0) {
      currentStock = invRows[0].stock;
    } else {
      // Crear registro inicial si no existía
      await query(
        'INSERT INTO branch_inventory (branch_id, product_id, stock, min_stock) VALUES (?, ?, 0, 3)',
        [branch_id, product_id]
      );
    }

    let newStock = currentStock;
    if (movement_type === 'ENTRADA') {
      newStock += qty;
    } else if (movement_type === 'SALIDA' || movement_type === 'VENTA' || movement_type === 'CONSUMO_TRATAMIENTO') {
      if (currentStock < qty) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente. Stock actual: ${currentStock}, cantidad solicitada: ${qty}. El inventario no puede ser negativo.`
        });
      }
      newStock -= qty;
    } else if (movement_type === 'AJUSTE') {
      newStock = qty; // Ajuste directo al nuevo inventario
    } else {
      return res.status(400).json({ success: false, error: 'Tipo de movimiento inválido.' });
    }

    // Actualizar inventario
    await query(
      'UPDATE branch_inventory SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE branch_id = ? AND product_id = ?',
      [newStock, branch_id, product_id]
    );

    // Registrar en historial de movimientos
    await query(
      `INSERT INTO inventory_movements (branch_id, product_id, user_id, movement_type, quantity, stock_after, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [branch_id, product_id, req.user?.id || 1, movement_type, qty, newStock, notes || '']
    );

    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente.',
      data: {
        branch_id,
        product_id,
        movement_type,
        previous_stock: currentStock,
        new_stock: newStock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getMovements(req, res) {
  try {
    const { branch_id, product_id } = req.query;
    let sql = `
      SELECT im.*, b.name as branch_name, p.name as product_name
      FROM inventory_movements im
      JOIN branches b ON im.branch_id = b.id
      JOIN beauty_products p ON im.product_id = p.id
    `;
    const params = [];
    const conditions = [];

    if (branch_id) {
      conditions.push('im.branch_id = ?');
      params.push(parseInt(branch_id, 10));
    }
    if (product_id) {
      conditions.push('im.product_id = ?');
      params.push(parseInt(product_id, 10));
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY im.created_at DESC LIMIT 100';

    const [rows] = await query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getInventory,
  registerMovement,
  getMovements
};
