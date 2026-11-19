const db = require('../config/database');

// --- CATÁLOGO GENERAL DE PRODUCTOS ---
async function getAllProducts(req, res) {
  try {
    const { category, type, search, status, branch_id } = req.query;
    let sql = `
      SELECT p.*,
             COALESCE(bi.stock, 10) as current_stock,
             CASE WHEN COALESCE(bi.stock, 10) <= 0 THEN 'AGOTADO'
                  WHEN COALESCE(bi.stock, 10) <= 3 THEN 'STOCK_BAJO'
                  ELSE 'DISPONIBLE' END as stock_status
      FROM beauty_products p
      LEFT JOIN branch_inventory bi ON p.id = bi.product_id AND bi.branch_id = ?
      WHERE 1=1
    `;
    const branchId = parseInt(branch_id, 10) || 1;
    const params = [branchId];

    const isAdmin = req.user && (req.user.role === 'ADMINISTRADOR' || req.user.role === 'ADMIN_GENERAL');
    if (!isAdmin && !status) {
      sql += " AND p.status = 'ACTIVO'";
    } else if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (type) {
      sql += ' AND (p.type = ? OR p.type = "AMBOS")';
      params.push(type.toUpperCase());
    }

    if (category) {
      sql += ' AND p.category LIKE ?';
      params.push(`%${category}%`);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.category ASC, p.name ASC';

    const [products] = await db.query(sql, params);
    return res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error en getAllProducts:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener productos.' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, brand, category, description, related_treatment, usage_instructions, frequency, status, price, image } = req.body;

    if (!name || !brand || !category) {
      return res.status(400).json({ success: false, error: 'Nombre, marca y categoría son obligatorios.' });
    }

    const [result] = await db.query(
      `INSERT INTO beauty_products 
       (name, brand, category, description, related_treatment, usage_instructions, frequency, status, price, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        brand.trim(),
        category.trim(),
        description || '',
        related_treatment || '',
        usage_instructions || '',
        frequency || '',
        status || 'ACTIVO',
        price ? parseFloat(price) : 0.00,
        image || '/prod_serum_facial.png'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      productId: result.insertId
    });
  } catch (err) {
    console.error('Error en createProduct:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar producto.' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, brand, category, description, related_treatment, usage_instructions, frequency, status, price, image } = req.body;

    await db.query(
      `UPDATE beauty_products SET 
        name = COALESCE(?, name),
        brand = COALESCE(?, brand),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        related_treatment = COALESCE(?, related_treatment),
        usage_instructions = COALESCE(?, usage_instructions),
        frequency = COALESCE(?, frequency),
        status = COALESCE(?, status),
        price = COALESCE(?, price),
        image = COALESCE(?, image)
       WHERE id = ?`,
      [name, brand, category, description, related_treatment, usage_instructions, frequency, status, price, image, id]
    );

    return res.json({ success: true, message: 'Producto actualizado exitosamente.' });
  } catch (err) {
    console.error('Error en updateProduct:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar producto.' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM beauty_products WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Producto eliminado exitosamente.' });
  } catch (err) {
    console.error('Error en deleteProduct:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar producto.' });
  }
}

// --- PRODUCTOS ASIGNADOS A CLIENTES ---
async function getClientProducts(req, res) {
  try {
    const user = req.user;
    const { client_id } = req.query;

    let targetClientId = user.role === 'CLIENTE' ? user.client_id : client_id;

    if (!targetClientId && user.role === 'ADMINISTRADOR') {
      // Listar todos los productos asignados a todos los clientes para la tabla de administración
      const [all] = await db.query(
        `SELECT cp.*, p.name as product_name, p.brand as product_brand, p.category as product_category,
                p.image as product_image, p.price as product_price,
                u.name as client_name, u.email as client_email
         FROM client_products cp
         JOIN beauty_products p ON cp.product_id = p.id
         JOIN clients c ON cp.client_id = c.id
         JOIN users u ON c.user_id = u.id
         ORDER BY cp.created_at DESC`
      );
      return res.json({ success: true, clientProducts: all });
    }

    const [rows] = await db.query(
      `SELECT cp.*, p.name as product_name, p.brand as product_brand, p.category as product_category,
              p.image as product_image, p.price as product_price, p.usage_instructions as default_instructions
       FROM client_products cp
       JOIN beauty_products p ON cp.product_id = p.id
       WHERE cp.client_id = ?
       ORDER BY cp.created_at DESC`,
      [targetClientId]
    );

    return res.json({ success: true, clientProducts: rows });
  } catch (err) {
    console.error('Error en getClientProducts:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener productos del cliente.' });
  }
}

async function assignProductToClient(req, res) {
  try {
    const { client_id, product_id, start_date, usage_frequency, observations } = req.body;

    if (!client_id || !product_id || !start_date || !usage_frequency) {
      return res.status(400).json({
        success: false,
        error: 'Cliente, producto, fecha de inicio y frecuencia de uso son requeridos.'
      });
    }

    const [insertRes] = await db.query(
      `INSERT INTO client_products (client_id, product_id, start_date, usage_frequency, observations) 
       VALUES (?, ?, ?, ?, ?)`,
      [client_id, product_id, start_date, usage_frequency.trim(), observations || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Producto asignado al cliente con éxito.',
      id: insertRes.insertId
    });
  } catch (err) {
    console.error('Error en assignProductToClient:', err);
    return res.status(500).json({ success: false, error: 'Error al asignar producto al cliente.' });
  }
}

async function removeClientProduct(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM client_products WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Producto desvinculado del cliente exitosamente.' });
  } catch (err) {
    console.error('Error en removeClientProduct:', err);
    return res.status(500).json({ success: false, error: 'Error al desvincular producto.' });
  }
}

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getClientProducts,
  assignProductToClient,
  removeClientProduct
};
