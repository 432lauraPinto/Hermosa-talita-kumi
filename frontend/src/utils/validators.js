/**
 * Validadores puros en frontend (alineados 1:1 con functions/src/lib/validators.js).
 */

const REGEX_NOMBRE_CARACTERES = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function normalizarNombreCompleto(nombre) {
  return String(nombre || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function validarNombreCompleto(nombre) {
  const limpio = normalizarNombreCompleto(nombre);
  if (limpio.length < 4 || limpio.length > 120) {
    return { valido: false, valor: limpio, motivo: 'Ingresa tu nombre y apellido (mínimo 4 caracteres).' };
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

export function validarEmail(email) {
  const limpio = String(email || '').trim().toLowerCase();
  if (!REGEX_EMAIL.test(limpio)) {
    return { valido: false, valor: limpio, motivo: 'Ingresa un correo electrónico válido.' };
  }
  return { valido: true, valor: limpio };
}

/**
 * Celular de Bolivia: 8 dígitos iniciando con 6 o 7.
 * Acepta "77197857", "+591 77197857" o "59177197857" y normaliza a "+591 77197857".
 */
export function validarTelefonoBolivia(telefono) {
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
      motivo: 'Ingresa un número celular válido de Bolivia (8 dígitos que empiecen con 6 o 7).',
    };
  }

  return { valido: true, digitosLocal: local, valor: `+591 ${local}` };
}

export function extraerDigitosLocalesBolivia(telefono) {
  const soloDigitos = String(telefono || '').replace(/\D/g, '');
  if (soloDigitos.startsWith('591') && soloDigitos.length === 11) {
    return soloDigitos.slice(3);
  }
  return soloDigitos.slice(0, 8);
}

export function validarFechaNacimiento(fecha) {
  if (!fecha || String(fecha).trim() === '') return { valido: true, valor: null };
  const str = String(fecha).trim();
  if (!REGEX_FECHA.test(str)) {
    return { valido: false, valor: str, motivo: 'Formato de fecha inválido.' };
  }
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { valido: false, valor: str, motivo: 'Fecha de nacimiento inválida.' };
  }
  const hoy = new Date();
  const hoyUtc = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  if (dt.getTime() > hoyUtc) {
    return { valido: false, valor: str, motivo: 'La fecha de nacimiento no puede estar en el futuro.' };
  }
  const edad = (hoyUtc - dt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (edad < 12 || edad > 110) {
    return { valido: false, valor: str, motivo: 'Verifica tu fecha de nacimiento (edad entre 12 y 110 años).' };
  }
  return { valido: true, valor: str };
}

export function evaluarFortalezaPassword(password) {
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
  const nivel = !pwd ? 'vacia' : puntaje <= 2 ? 'debil' : puntaje <= 3 ? 'media' : 'fuerte';
  const etiqueta =
    nivel === 'debil' ? 'Débil' : nivel === 'media' ? 'Media' : nivel === 'fuerte' ? 'Fuerte' : '';
  const color =
    nivel === 'debil' ? '#B52825' : nivel === 'media' ? '#B8860B' : nivel === 'fuerte' ? '#156E42' : '#E5B9C7';

  return {
    cumplePolitica,
    nivel,
    etiqueta,
    color,
    porcentaje: Math.min(100, Math.round((puntaje / 5) * 100)),
    requisitos: { tieneLongitud, tieneMayuscula, tieneNumero },
  };
}
