const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

// Disponibilidad pública y eventos SSE en tiempo real
router.get('/available-slots', appointmentController.getAvailableSlots);
router.post('/hold', appointmentController.holdSlot);
router.get('/events', appointmentController.getAppointmentEvents);

// Operaciones de gestión de reservas
router.get('/', authenticateToken, appointmentController.getAppointments);
router.post('/', authenticateToken, appointmentController.createAppointment);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);
router.delete('/:id', authenticateToken, appointmentController.cancelAppointment);

module.exports = router;
