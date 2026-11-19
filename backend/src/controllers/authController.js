const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { generateBase32Secret, generateTOTP, verifyTOTP, generateBackupCodes, getOTPAuthUrl } = require('../utils/totp');

async function register(req, res) {
  try {
    const { name, email, password, phone, skin_type, birth_date, emergency_contact, emergency_phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son obligatorios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya se encuentra registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [userRes] = await db.query(
      `INSERT INTO users (name, email, password, role, phone, mfa_enabled) VALUES (?, ?, ?, 'CLIENTE', ?, 0)`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword, phone || null]
    );

    const userId = userRes.insertId;

    // Crear registro en tabla clients
    const [clientRes] = await db.query(
      `INSERT INTO clients (user_id, birth_date, skin_type, emergency_contact, emergency_phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        birth_date || null,
        skin_type || 'Normal/Mixta',
        emergency_contact || null,
        emergency_phone || null
      ]
    );

    const clientId = clientRes.insertId;

    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), role: 'CLIENTE', clientId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registro exitoso en Hermosa Talita Kumi.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'CLIENTE',
        phone: phone || null,
        client_id: clientId,
        mfa_enabled: false
      }
    });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ success: false, error: 'Error interno al registrar usuario.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos.' });
    }

    const [users] = await db.query(
      'SELECT id, name, email, password, role, phone, avatar, assigned_branch_id, mfa_enabled, mfa_secret FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    // Si tiene MFA activo, requerir verificación TOTP en segundo paso
    if (user.mfa_enabled === 1) {
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, tempMfa: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        mfaRequired: true,
        tempToken,
        message: 'Autenticación en dos pasos requerida. Ingrese el código de 6 dígitos de su aplicación autenticadora.'
      });
    }

    let clientId = null;
    if (user.role === 'CLIENTE') {
      const [clients] = await db.query('SELECT id FROM clients WHERE user_id = ?', [user.id]);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        clientId, 
        assigned_branch_id: user.assigned_branch_id 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        client_id: clientId,
        assigned_branch_id: user.assigned_branch_id,
        mfa_enabled: false
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, error: 'Error al iniciar sesión.' });
  }
}

/**
 * Segundo paso de login con TOTP o código de respaldo
 */
async function verifyMFALogin(req, res) {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, error: 'Token temporal y código de verificación requeridos.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Sesión de verificación expirada. Por favor inicie sesión nuevamente.' });
    }

    if (!decoded.tempMfa) {
      return res.status(400).json({ success: false, error: 'Token no válido para 2FA.' });
    }

    const [users] = await db.query(
      'SELECT id, name, email, role, phone, avatar, assigned_branch_id, mfa_enabled, mfa_secret, backup_codes FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    const user = users[0];
    const cleanCode = code.toString().trim().toUpperCase();

    // 1. Probar verificación TOTP (6 dígitos)
    let isValid = verifyTOTP(cleanCode, user.mfa_secret);

    // 2. Si no es TOTP válido, verificar si es un código de respaldo
    if (!isValid && user.backup_codes) {
      try {
        const backupList = JSON.parse(user.backup_codes);
        const idx = backupList.indexOf(cleanCode);
        if (idx !== -1) {
          isValid = true;
          // Consumir el código de respaldo
          backupList.splice(idx, 1);
          await db.query('UPDATE users SET backup_codes = ? WHERE id = ?', [JSON.stringify(backupList), user.id]);
        }
      } catch (e) {
        console.error('Error parsing backup codes:', e);
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Código de autenticación inválido o expirado.' });
    }

    let clientId = null;
    if (user.role === 'CLIENTE') {
      const [clients] = await db.query('SELECT id FROM clients WHERE user_id = ?', [user.id]);
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        clientId, 
        assigned_branch_id: user.assigned_branch_id 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Autenticación en dos pasos exitosa.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        client_id: clientId,
        assigned_branch_id: user.assigned_branch_id,
        mfa_enabled: true
      }
    });
  } catch (err) {
    console.error('Error en verifyMFALogin:', err);
    return res.status(500).json({ success: false, error: 'Error al verificar autenticación en dos pasos.' });
  }
}

/**
 * Iniciar configuración de MFA (genera secreto Base32)
 */
async function setupMFA(req, res) {
  try {
    const userId = req.user.id;
    const [users] = await db.query('SELECT id, email, name, role FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    const user = users[0];
    const secret = generateBase32Secret(20);
    const otpauthUrl = getOTPAuthUrl(user.email, secret, 'Hermosa Talita Kumi');

    return res.json({
      success: true,
      secret,
      otpauthUrl,
      account: user.email,
      issuer: 'Hermosa Talita Kumi'
    });
  } catch (err) {
    console.error('Error en setupMFA:', err);
    return res.status(500).json({ success: false, error: 'Error al inicializar 2FA.' });
  }
}

/**
 * Confirmar y activar MFA con código de verificación
 */
async function enableMFA(req, res) {
  try {
    const userId = req.user.id;
    const { secret, code } = req.body;

    if (!secret || !code) {
      return res.status(400).json({ success: false, error: 'Secreto y código de 6 dígitos requeridos.' });
    }

    const isValid = verifyTOTP(code, secret);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Código de verificación incorrecto. Asegúrese de que la hora de su dispositivo esté sincronizada.' });
    }

    const backupCodes = generateBackupCodes(8);

    await db.query(
      'UPDATE users SET mfa_enabled = 1, mfa_secret = ?, backup_codes = ? WHERE id = ?',
      [secret, JSON.stringify(backupCodes), userId]
    );

    return res.json({
      success: true,
      message: '¡Autenticación en dos pasos activada exitosamente!',
      backupCodes
    });
  } catch (err) {
    console.error('Error en enableMFA:', err);
    return res.status(500).json({ success: false, error: 'Error al activar 2FA.' });
  }
}

/**
 * Desactivar MFA (requiere contraseña)
 */
async function disableMFA(req, res) {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Contraseña incorrecta para desactivar 2FA.' });
    }

    await db.query(
      'UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, backup_codes = NULL WHERE id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Autenticación en dos pasos desactivada.'
    });
  } catch (err) {
    console.error('Error en disableMFA:', err);
    return res.status(500).json({ success: false, error: 'Error al desactivar 2FA.' });
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, avatar, assigned_branch_id, mfa_enabled, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    const user = users[0];
    let clientProfile = null;

    if (user.role === 'CLIENTE') {
      const [clients] = await db.query('SELECT * FROM clients WHERE user_id = ?', [userId]);
      if (clients && clients.length > 0) {
        clientProfile = clients[0];
      }
    }

    return res.json({
      success: true,
      user,
      clientProfile
    });
  } catch (err) {
    console.error('Error en getProfile:', err);
    return res.status(500).json({ success: false, error: 'Error al obtener perfil.' });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone, birth_date, skin_type, emergency_contact, emergency_phone, medical_notes, allergies } = req.body;

    if (name) {
      await db.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name.trim(), phone || null, userId]);
    }

    if (req.user.role === 'CLIENTE') {
      await db.query(
        `UPDATE clients SET 
          birth_date = COALESCE(?, birth_date),
          skin_type = COALESCE(?, skin_type),
          emergency_contact = COALESCE(?, emergency_contact),
          emergency_phone = COALESCE(?, emergency_phone),
          medical_notes = COALESCE(?, medical_notes),
          allergies = COALESCE(?, allergies)
         WHERE user_id = ?`,
        [birth_date, skin_type, emergency_contact, emergency_phone, medical_notes, allergies, userId]
      );
    }

    return res.json({ success: true, message: 'Perfil actualizado exitosamente.' });
  } catch (err) {
    console.error('Error en updateProfile:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar perfil.' });
  }
}

module.exports = {
  register,
  login,
  verifyMFALogin,
  setupMFA,
  enableMFA,
  disableMFA,
  getProfile,
  updateProfile
};
