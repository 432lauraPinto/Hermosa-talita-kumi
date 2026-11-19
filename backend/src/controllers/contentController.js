const { query } = require('../config/database');

async function getVerses(req, res) {
  try {
    const [verses] = await query('SELECT * FROM verses WHERE active = 1 ORDER BY sort_order ASC');
    res.json({ success: true, data: verses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getHeroSlides(req, res) {
  try {
    const slides = [
      {
        id: 1,
        title: 'Cuidado y Belleza Integral',
        subtitle: 'Tratamientos Faciales y Corporales Personalizados',
        image: '/hero_chica_tratamiento_facial.png',
        active: 1
      },
      {
        id: 2,
        title: 'Baño de Luna Exclusivo',
        subtitle: 'Exfoliación, Luminosidad y Tersura para tu Piel',
        image: '/hero_chica_mascarilla_spa.png',
        active: 1
      },
      {
        id: 3,
        title: 'Masajes y Relajación Dermo-Corporal',
        subtitle: 'Maderoterapia, Piedras Calientes y Aromaterapia Pura',
        image: '/hero_chica_producto_serum.png',
        active: 1
      }
    ];
    res.json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateVerse(req, res) {
  try {
    const { id } = req.params;
    const { reference, version, text, reflection, active } = req.body;
    await query(
      `UPDATE verses SET reference = COALESCE(?, reference), version = COALESCE(?, version),
       text = COALESCE(?, text), reflection = COALESCE(?, reflection), active = COALESCE(?, active)
       WHERE id = ?`,
      [reference, version, text, reflection, active, id]
    );
    res.json({ success: true, message: 'Versículo actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getVerses,
  getHeroSlides,
  updateVerse
};
