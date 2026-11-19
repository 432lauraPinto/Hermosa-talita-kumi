const EventEmitter = require('events');

class RealtimeService extends EventEmitter {}
const realtimeService = new RealtimeService();

// Aumentar límite de listeners para múltiples clientes conectados simultáneamente
realtimeService.setMaxListeners(100);

function notifyBookingChange(branchId, date) {
  realtimeService.emit('booking_changed', {
    branchId: parseInt(branchId, 10),
    date,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  realtimeService,
  notifyBookingChange
};
