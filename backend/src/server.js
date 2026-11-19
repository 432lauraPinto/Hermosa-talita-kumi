require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getEngine } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const branchRoutes = require('./routes/branchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const contentRoutes = require('./routes/contentRoutes');
const productRequestRoutes = require('./routes/productRequestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Estado de salud del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'HERMOSA TALITA KUMI — API Centralizada (V12 Oficial)',
    branchesCount: 4,
    agendaMode: 'Franjas horarias por sucursal',
    timezone: 'America/La_Paz',
    currency: 'Bs (Bolivianos)',
    databaseEngine: getEngine(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Montar Rutas Oficiales
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/follow-up', followUpRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/product-requests', productRequestRoutes);

// Manejador 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.url}` });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('[SERVER-ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Ocurrió un error en el servidor. Por favor verifique su solicitud.'
  });
});

// Inicialización del Servidor
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` HERMOSA TALITA KUMI API activa en puerto ${PORT}`);
      console.log(` Zona horaria: America/La_Paz | 4 Sucursales Oficiales`);
      console.log(` Base de datos conectada con motor: [${getEngine()}]`);
      console.log(` Endpoint de salud: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fallo al inicializar servidor:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
