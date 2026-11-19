const { query } = require('../config/database');

async function getPromotions(req, res) {
  try {
    // Promociones globales (Módulo 12): aplican a todo el centro sin sucursal
    const sql = `SELECT * FROM promotions WHERE active = 1 ORDER BY id ASC`;
    const [promotions] = await query(sql);
    res.json({ success: true, count: promotions.length, data: promotions });
  } catch (error) {
    console.error('[PROMOTIONS-ERROR]', error);
    res.status(500).json({ success: false, error: 'Error al consultar promociones.' });
  }
}

async function getPromotionById(req, res) {
  try {
    const { id } = req.params;
    const [promos] = await query('SELECT * FROM promotions WHERE id = ?', [id]);
    if (!promos || promos.length === 0) {
      return res.status(404).json({ success: false, error: 'Promoción no encontrada.' });
    }
    res.json({ success: true, data: promos[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createPromotion(req, res) {
  try {
    const { title, description, service_id, regular_price, promo_price, discount_percent, start_date, end_date, badge, image } = req.body;
    if (!title || !regular_price || !promo_price) {
      return res.status(400).json({ success: false, error: 'Campos requeridos faltantes.' });
    }

    const calculatedDiscount = discount_percent || Math.round(((regular_price - promo_price) / regular_price) * 100);

    const [result] = await query(
      `INSERT INTO promotions (title, description, service_id, regular_price, promo_price, discount_percent, start_date, end_date, badge, image, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        title,
        description || '',
        service_id || null,
        regular_price,
        promo_price,
        calculatedDiscount,
        start_date || new Date().toISOString().split('T')[0],
        end_date || '2026-12-31',
        badge || 'OFERTA ESPECIAL',
        image || '/banner-rosa.jpg'
      ]
    );

    res.status(201).json({ success: true, message: 'Promoción creada exitosamente.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updatePromotion(req, res) {
  try {
    const { id } = req.params;
    const { title, description, regular_price, promo_price, badge, active } = req.body;

    await query(
      `UPDATE promotions SET title = COALESCE(?, title), description = COALESCE(?, description),
       regular_price = COALESCE(?, regular_price), promo_price = COALESCE(?, promo_price),
       badge = COALESCE(?, badge), active = COALESCE(?, active)
       WHERE id = ?`,
      [title, description, regular_price, promo_price, badge, active, id]
    );

    res.json({ success: true, message: 'Promoción actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion
};
