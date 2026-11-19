const db = require('../config/database');

async function getCategories(req, res) {
  try {
    const [categories] = await db.query(
      'SELECT * FROM service_categories WHERE active = 1 ORDER BY sort_order ASC'
    );
    return res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    console.error('Error en getCategories:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener categorías.' });
  }
}

async function getAllServices(req, res) {
  try {
    const { type, category, category_code, search, status, branch_id } = req.query;
    let sql = `
      SELECT s.* 
      FROM services s
    `;
    const params = [];
    const conditions = [];

    if (branch_id) {
      sql += ' JOIN branch_services bs ON s.id = bs.service_id AND bs.branch_id = ? AND bs.active = 1';
      params.push(parseInt(branch_id, 10));
    }

    const isAdmin = req.user && (req.user.role === 'ADMINISTRADOR' || req.user.role === 'ADMIN_GENERAL');
    if (!isAdmin && !status) {
      conditions.push("s.status = 'ACTIVO'");
    } else if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    if (category_code) {
      conditions.push('s.category_code = ?');
      params.push(category_code.toUpperCase());
    }

    if (type) {
      conditions.push('(s.type = ? OR s.category_code = ?)');
      params.push(type.toUpperCase(), type.toUpperCase());
    }

    if (category) {
      conditions.push('(s.category LIKE ? OR s.category_code LIKE ?)');
      params.push(`%${category}%`, `%${category}%`);
    }

    if (search) {
      conditions.push('(s.name LIKE ? OR s.description LIKE ? OR s.cosmetic_benefits LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY s.category_id ASC, s.id ASC';

    const [services] = await db.query(sql, params);
    return res.json({ success: true, count: services.length, services });
  } catch (err) {
    console.error('Error en getAllServices:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener servicios.' });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Servicio no encontrado.' });
    }
    return res.json({ success: true, service: rows[0] });
  } catch (err) {
    console.error('Error en getServiceById:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener detalle del servicio.' });
  }
}

async function createService(req, res) {
  try {
    const { name, description, cosmetic_benefits, category_code, category, price, duration, type, status, image } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({ success: false, error: 'Nombre, precio y duración son obligatorios.' });
    }

    const catCode = category_code || type || 'FACIAL';

    const [result] = await db.query(
      `INSERT INTO services (name, description, cosmetic_benefits, category_code, category, price, duration, type, status, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description || '',
        cosmetic_benefits || '',
        catCode,
        category || name,
        parseFloat(price),
        parseInt(duration, 10),
        type || catCode,
        status || 'ACTIVO',
        image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'
      ]
    );

    const newServiceId = result.insertId;

    // Vincular automáticamente a las 4 sucursales
    await db.query(
      `INSERT OR IGNORE INTO branch_services (branch_id, service_id, active)
       SELECT id, ?, 1 FROM branches`,
      [newServiceId]
    );

    return res.status(201).json({
      success: true,
      message: 'Servicio creado y asignado a sucursales exitosamente.',
      serviceId: newServiceId
    });
  } catch (err) {
    console.error('Error en createService:', err);
    return res.status(500).json({ success: false, error: 'Error al crear el servicio.' });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, description, cosmetic_benefits, category, price, duration, type, status, image } = req.body;

    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Servicio no encontrado.' });
    }

    await db.query(
      `UPDATE services 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           cosmetic_benefits = COALESCE(?, cosmetic_benefits),
           category = COALESCE(?, category),
           price = COALESCE(?, price),
           duration = COALESCE(?, duration),
           type = COALESCE(?, type),
           status = COALESCE(?, status),
           image = COALESCE(?, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        description !== undefined ? description : null,
        cosmetic_benefits !== undefined ? cosmetic_benefits : null,
        category ? category.trim() : null,
        price ? parseFloat(price) : null,
        duration ? parseInt(duration, 10) : null,
        type || null,
        status || null,
        image || null,
        id
      ]
    );

    return res.json({ success: true, message: 'Servicio actualizado correctamente.' });
  } catch (err) {
    console.error('Error en updateService:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el servicio.' });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;

    const [appointments] = await db.query(
      "SELECT id FROM appointments WHERE service_id = ? AND status IN ('PENDIENTE', 'CONFIRMADA')",
      [id]
    );

    if (appointments && appointments.length > 0) {
      await db.query("UPDATE services SET status = 'INACTIVO' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: 'El servicio tiene citas programadas. Se ha marcado como INACTIVO en lugar de eliminarlo.'
      });
    }

    await db.query('DELETE FROM branch_services WHERE service_id = ?', [id]);
    await db.query('DELETE FROM services WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Servicio eliminado correctamente.' });
  } catch (err) {
    console.error('Error en deleteService:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar el servicio.' });
  }
}

module.exports = {
  getCategories,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
