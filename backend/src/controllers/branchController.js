const db = require('../config/database');

async function getAllBranches(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'ADMINISTRADOR';
    let sql = 'SELECT * FROM branches';
    if (!isAdmin) {
      sql += ' WHERE active = 1';
    }
    sql += ' ORDER BY city ASC, name ASC';

    const [branches] = await db.query(sql);
    const sanitizedBranches = (branches || []).map(b => ({
      ...b,
      whatsapp: b.whatsapp || '+591 62353452',
      phone: b.phone || '+591 62353452'
    }));
    return res.json({ success: true, branches: sanitizedBranches });
  } catch (err) {
    console.error('Error en getAllBranches:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar sucursales.' });
  }
}

async function getBranchById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM branches WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
    }
    const branch = rows[0];

    // Obtener servicios habilitados en esta sucursal
    const [services] = await db.query(
      `SELECT s.* 
       FROM services s 
       JOIN branch_services bs ON s.id = bs.service_id 
       WHERE bs.branch_id = ? AND bs.active = 1 AND s.status = 'ACTIVO'`,
      [id]
    );

    return res.json({ success: true, branch, services });
  } catch (err) {
    console.error('Error en getBranchById:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar sucursal.' });
  }
}

async function createBranch(req, res) {
  try {
    const { code, name, city, zone, address, phone, whatsapp, email, opening_hours, google_maps_url, map_embed_url, image } = req.body;

    if (!code || !name || !city || !address) {
      return res.status(400).json({ success: false, error: 'Código, nombre, ciudad y dirección son obligatorios.' });
    }

    const [result] = await db.query(
      `INSERT INTO branches (code, name, city, zone, address, phone, whatsapp, email, opening_hours, google_maps_url, map_embed_url, image, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        code.trim().toUpperCase(),
        name.trim(),
        city.trim(),
        zone || '',
        address.trim(),
        phone || '',
        whatsapp || '',
        email || '',
        opening_hours || 'Lunes a Sábado: 08:30 - 19:30',
        google_maps_url || '',
        map_embed_url || '',
        image || '/banner-rosa.jpg'
      ]
    );

    const newBranchId = result.insertId;

    // Por defecto habilitar todos los servicios activos para la nueva sede
    const [allServices] = await db.query("SELECT id FROM services WHERE status = 'ACTIVO'");
    for (const svc of allServices) {
      await db.query(
        'INSERT OR IGNORE INTO branch_services (branch_id, service_id, active) VALUES (?, ?, 1)',
        [newBranchId, svc.id]
      ).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Sucursal registrada exitosamente.',
      branchId: newBranchId
    });
  } catch (err) {
    console.error('Error en createBranch:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar sucursal.' });
  }
}

async function updateBranch(req, res) {
  try {
    const { id } = req.params;
    const { code, name, city, zone, address, phone, whatsapp, email, opening_hours, google_maps_url, map_embed_url, image, active } = req.body;

    await db.query(
      `UPDATE branches SET 
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        city = COALESCE(?, city),
        zone = COALESCE(?, zone),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        whatsapp = COALESCE(?, whatsapp),
        email = COALESCE(?, email),
        opening_hours = COALESCE(?, opening_hours),
        google_maps_url = COALESCE(?, google_maps_url),
        map_embed_url = COALESCE(?, map_embed_url),
        image = COALESCE(?, image),
        active = COALESCE(?, active)
       WHERE id = ?`,
      [
        code ? code.trim().toUpperCase() : null,
        name ? name.trim() : null,
        city ? city.trim() : null,
        zone,
        address,
        phone,
        whatsapp,
        email,
        opening_hours,
        google_maps_url,
        map_embed_url,
        image,
        active !== undefined ? (active ? 1 : 0) : null,
        id
      ]
    );

    return res.json({ success: true, message: 'Sucursal actualizada exitosamente.' });
  } catch (err) {
    console.error('Error en updateBranch:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar sucursal.' });
  }
}

async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    // Marcar como inactiva para no romper histórico
    await db.query('UPDATE branches SET active = 0 WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Sucursal desactivada correctamente.' });
  } catch (err) {
    console.error('Error en deleteBranch:', err);
    return res.status(500).json({ success: false, error: 'Error al desactivar sucursal.' });
  }
}

async function getBranchServices(req, res) {
  try {
    const { id } = req.params;
    const [allServices] = await db.query('SELECT * FROM services ORDER BY type ASC, name ASC');
    const [enabled] = await db.query(
      'SELECT service_id FROM branch_services WHERE branch_id = ? AND active = 1',
      [id]
    );
    const enabledIds = enabled.map(e => e.service_id);

    const result = allServices.map(s => ({
      ...s,
      isAvailableInBranch: enabledIds.includes(s.id)
    }));

    return res.json({ success: true, services: result });
  } catch (err) {
    console.error('Error en getBranchServices:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar servicios de la sucursal.' });
  }
}

async function updateBranchServices(req, res) {
  try {
    const { id } = req.params;
    const { serviceIds } = req.body; // array de IDs de servicios habilitados

    if (!Array.isArray(serviceIds)) {
      return res.status(400).json({ success: false, error: 'serviceIds debe ser un arreglo.' });
    }

    // Desactivar todos los servicios para esta sucursal
    await db.query('DELETE FROM branch_services WHERE branch_id = ?', [id]);

    // Insertar los seleccionados
    for (const svcId of serviceIds) {
      await db.query(
        'INSERT INTO branch_services (branch_id, service_id, active) VALUES (?, ?, 1)',
        [id, svcId]
      );
    }

    return res.json({ success: true, message: 'Servicios de la sucursal actualizados correctamente.' });
  } catch (err) {
    console.error('Error en updateBranchServices:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar servicios de la sucursal.' });
  }
}

async function getBranchExceptions(req, res) {
  try {
    const { id } = req.params;
    const [exceptions] = await db.query(
      'SELECT * FROM branch_exceptions WHERE branch_id = ? ORDER BY date ASC',
      [id]
    );
    return res.json({ success: true, exceptions });
  } catch (err) {
    console.error('Error en getBranchExceptions:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener excepciones de la sucursal.' });
  }
}

async function addBranchException(req, res) {
  try {
    const { id } = req.params;
    const { date, is_closed, open_time, close_time, reason } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'La fecha es obligatoria.' });
    }

    const [result] = await db.query(
      `INSERT INTO branch_exceptions (branch_id, date, is_closed, open_time, close_time, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        is_closed !== undefined ? (is_closed ? 1 : 0) : 1,
        open_time || null,
        close_time || null,
        reason || ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Excepción de calendario registrada.',
      exceptionId: result.insertId
    });
  } catch (err) {
    console.error('Error en addBranchException:', err);
    return res.status(500).json({ success: false, error: 'Error al guardar excepción de la sucursal.' });
  }
}

async function deleteBranchException(req, res) {
  try {
    const { exceptionId } = req.params;
    await db.query('DELETE FROM branch_exceptions WHERE id = ?', [exceptionId]);
    return res.json({ success: true, message: 'Excepción eliminada correctamente.' });
  } catch (err) {
    console.error('Error en deleteBranchException:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar excepción.' });
  }
}

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchServices,
  updateBranchServices,
  getBranchExceptions,
  addBranchException,
  deleteBranchException
};
