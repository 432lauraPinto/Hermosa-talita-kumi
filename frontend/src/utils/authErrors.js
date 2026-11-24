/**
 * Mapeo seguro de errores de Firebase Auth y Cloud Functions al español (Bolivia).
 * Evita revelar si un correo está o no registrado (prevención de enumeración de cuentas).
 */

const MAPA_AUTH = {
  'auth/invalid-credential': 'Correo electrónico o contraseña incorrectos.',
  'auth/wrong-password': 'Correo electrónico o contraseña incorrectos.',
  'auth/user-not-found': 'Correo electrónico o contraseña incorrectos.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo electrónico.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres, una mayúscula y un número.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.',
  'auth/user-disabled': 'Tu cuenta se encuentra desactivada. Contacta al administrador.',
  'auth/network-request-failed': 'No se pudo conectar con el servidor de autenticación. Verifica tu conexión o el emulador.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado actualmente.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión para completar esta acción.',
};

export function traducirErrorAuth(err) {
  if (!err) return 'Ocurrió un error inesperado.';

  const code = err.code || '';
  if (MAPA_AUTH[code]) {
    return MAPA_AUTH[code];
  }

  const msg = String(err.message || '');
  for (const [clave, texto] of Object.entries(MAPA_AUTH)) {
    if (msg.includes(clave)) return texto;
  }

  return msg
    .replace(/^Firebase:\s*/i, '')
    .replace(/^FirebaseError:\s*/i, '')
    .replace(/\s*\(auth\/[^)]+\)\.?$/i, '')
    .trim() || 'Ocurrió un error al procesar tu solicitud.';
}
