const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

router.get('/verses', contentController.getVerses);
router.get('/hero', contentController.getHeroSlides);
router.put('/verses/:id', contentController.updateVerse);

module.exports = router;
