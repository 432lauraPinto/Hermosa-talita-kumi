const db = require('../config/database');

async function getRules(req, res) {
  try {
    const [rules] = await db.query('SELECT * FROM treatment_rules ORDER BY treatment_type ASC, treatment_name ASC');
    return res.json({ success: true, rules });
  } catch (err) {
    console.error('Error en getRules:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar reglas de seguimiento.' });
  }
}

async function createRule(req, res) {
  try {
    const { treatment_name, treatment_type, recommended_interval, interval_unit, description, active } = req.body;

    if (!treatment_name || !treatment_type || !recommended_interval) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del tratamiento, tipo e intervalo recomendado son requeridos.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO treatment_rules (treatment_name, treatment_type, recommended_interval, interval_unit, description, active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        treatment_name.trim(),
        treatment_type.toUpperCase(),
        parseInt(recommended_interval, 10),
        interval_unit ? interval_unit.toUpperCase() : 'DIAS',
        description || '',
        active !== undefined ? (active ? 1 : 0) : 1
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Regla de seguimiento creada exitosamente.',
      ruleId: result.insertId
    });
  } catch (err) {
    console.error('Error en createRule:', err);
    return res.status(500).json({ success: false, error: 'Error al crear regla de seguimiento.' });
  }
}

async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { treatment_name, treatment_type, recommended_interval, interval_unit, description, active } = req.body;

    await db.query(
      `UPDATE treatment_rules SET 
        treatment_name = COALESCE(?, treatment_name),
        treatment_type = COALESCE(?, treatment_type),
        recommended_interval = COALESCE(?, recommended_interval),
        interval_unit = COALESCE(?, interval_unit),
        description = COALESCE(?, description),
        active = COALESCE(?, active)
       WHERE id = ?`,
      [
        treatment_name ? treatment_name.trim() : null,
        treatment_type ? treatment_type.toUpperCase() : null,
        recommended_interval ? parseInt(recommended_interval, 10) : null,
        interval_unit ? interval_unit.toUpperCase() : null,
        description,
        active !== undefined ? (active ? 1 : 0) : null,
        id
      ]
    );

    return res.json({ success: true, message: 'Regla actualizada correctamente.' });
  } catch (err) {
    console.error('Error en updateRule:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar regla.' });
  }
}

async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM treatment_rules WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Regla eliminada exitosamente.' });
  } catch (err) {
    console.error('Error en deleteRule:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar regla.' });
  }
}

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule
};
