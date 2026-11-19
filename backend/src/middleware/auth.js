const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'talita_kumi_jwt_access_secret_key_2026_secure';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de autenticación no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await db.query(
      'SELECT id, name, email, role, assigned_branch_id, phone, avatar FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado o sesión inválida.' });
    }

    const user = users[0];

    // Si es cliente, obtener su client_id
    if (user.role === 'CLIENTE') {
      const [clients] = await db.query('SELECT id FROM clients WHERE user_id = ?', [user.id]);
      if (clients && clients.length > 0) {
        user.client_id = clients[0].id;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Token inválido o expirado.' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await db.query(
      'SELECT id, name, email, role, assigned_branch_id, phone, avatar FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users && users.length > 0) {
      const user = users[0];
      if (user.role === 'CLIENTE') {
        const [clients] = await db.query('SELECT id FROM clients WHERE user_id = ?', [user.id]);
        if (clients && clients.length > 0) {
          user.client_id = clients[0].id;
        }
      }
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (e) {
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMINISTRADOR' && req.user.role !== 'ADMIN_GENERAL')) {
    return res.status(403).json({ success: false, error: 'Acceso restringido: requiere rol de Administrador General.' });
  }
  next();
}

function requireStaffOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMINISTRADOR' && req.user.role !== 'ADMIN_GENERAL' && req.user.role !== 'ENCARGADO')) {
    return res.status(403).json({ success: false, error: 'Acceso restringido: requiere rol de Encargado o Administrador.' });
  }
  next();
}

function requireClient(req, res, next) {
  if (!req.user || req.user.role !== 'CLIENTE') {
    return res.status(403).json({ success: false, error: 'Acceso restringido: requiere rol de Cliente.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAuth: authenticateToken,
  optionalAuth,
  requireAdmin,
  requireStaffOrAdmin,
  requireClient,
  JWT_SECRET
};
