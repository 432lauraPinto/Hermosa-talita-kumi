/**
 * Validadores puros para registro, perfil y credenciales (Bolivia).
 * Sin dependencias externas: reutilizable en Cloud Functions y tests unitarios.
 */

const REGEX_NOMBRE_CARACTERES = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Limpia espacios repetidos en nombre completo.
 */
function normalizarNombreCompleto(nombre) {
  return String(nombre || '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Valida que el nombre tenga al menos nombre y apellido (2 palabras) y solo caracteres válidos.
 */
function validarNombreCompleto(nombre) {
  const limpio = normalizarNombreCompleto(nombre);
  if (limpio.length < 4 || limpio.length > 120) {
    return { valido: false, valor: limpio, motivo: 'Ingresa tu nombre y apellido (entre 4 y 120 caracteres).' };
  }
  if (!REGEX_NOMBRE_CARACTERES.test(limpio)) {
    return { valido: false, valor: limpio, motivo: 'El nombre solo puede contener letras y espacios.' };
  }
  const palabras = limpio.split(' ').filter((p) => p.length >= 2);
  if (palabras.length < 2) {
    return { valido: false, valor: limpio, motivo: 'Ingresa al menos un nombre y un apellido.' };
  }
  return { valido: true, valor: limpio };
}

/**
 * Normaliza y valida un número celular de Bolivia para WhatsApp:
 * 8 dígitos iniciando con 6 o 7 -> formato estándar "+591 7XXXXXXX" / "+591 6XXXXXXX".
 */
function validarTelefonoBolivia(telefono) {
  const raw = String(telefono || '').trim();
  const soloDigitos = raw.replace(/\D/g, '');

  let local = soloDigitos;
  if (soloDigitos.startsWith('591') && soloDigitos.length === 11) {
    local = soloDigitos.slice(3);
  } else if (soloDigitos.startsWith('0') && soloDigitos.length === 9) {
    local = soloDigitos.slice(1);
  }

  if (!/^[67]\d{7}$/.test(local)) {
    return {
      valido: false,
      valor: raw,
      motivo: 'Ingresa un celular válido de Bolivia de 8 dígitos que empiece con 6 o 7 (ej: 77197857).',
    };
  }

  return {
    valido: true,
    digitosLocal: local,
    valor: `+591 ${local}`,
  };
}

/**
 * Valida fecha de nacimiento opcional (AAAA-MM-DD, no futura, entre 12 y 110 años).
 */
function validarFechaNacimiento(fecha, now = new Date()) {
  if (fecha === null || fecha === undefined || String(fecha).trim() === '') {
    return { valido: true, valor: null };
  }
  const str = String(fecha).trim();
  if (!REGEX_FECHA.test(str)) {
    return { valido: false, valor: str, motivo: 'La fecha de nacimiento debe tener formato AAAA-MM-DD.' };
  }
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { valido: false, valor: str, motivo: 'Fecha de nacimiento inválida.' };
  }
  const hoyUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (dt.getTime() > hoyUtc) {
    return { valido: false, valor: str, motivo: 'La fecha de nacimiento no puede estar en el futuro.' };
  }
  const edadAprox = (hoyUtc - dt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (edadAprox < 12 || edadAprox > 110) {
    return { valido: false, valor: str, motivo: 'Verifica tu fecha de nacimiento (edad entre 12 y 110 años).' };
  }
  return { valido: true, valor: str };
}

/**
 * Evalúa fortaleza de contraseña según política de seguridad:
 * Mínimo 8 caracteres, al menos 1 mayúscula y 1 número.
 */
function evaluarFortalezaPassword(password) {
  const pwd = String(password || '');
  const tieneLongitud = pwd.length >= 8;
  const tieneMayuscula = /[A-ZÁÉÍÓÚÑ]/.test(pwd);
  const tieneMinuscula = /[a-záéíóúñ]/.test(pwd);
  const tieneNumero = /\d/.test(pwd);
  const tieneSimbolo = /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(pwd);

  let puntaje = 0;
  if (tieneLongitud) puntaje++;
  if (tieneMayuscula) puntaje++;
  if (tieneMinuscula) puntaje++;
  if (tieneNumero) puntaje++;
  if (tieneSimbolo || pwd.length >= 12) puntaje++;

  const cumplePolitica = tieneLongitud && tieneMayuscula && tieneNumero;
  const nivel = !pwd
    ? 'vacia'
    : puntaje <= 2
    ? 'debil'
    : puntaje <= 3
    ? 'media'
    : 'fuerte';

  return {
    cumplePolitica,
    nivel,
    puntaje,
    requisitos: { tieneLongitud, tieneMayuscula, tieneNumero },
  };
}

module.exports = {
  normalizarNombreCompleto,
  validarNombreCompleto,
  validarTelefonoBolivia,
  validarFechaNacimiento,
  evaluarFortalezaPassword,
};
