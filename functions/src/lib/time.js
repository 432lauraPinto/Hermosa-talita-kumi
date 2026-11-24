/**
 * Utilidades de fecha y hora deterministas para zona horaria America/La_Paz (UTC-4 fijo).
 * Bolivia no tiene horario de verano (DST), por lo que el desplazamiento es siempre -4 horas.
 */

const OFFSET_BOLIVIA_MIN = -4 * 60;
const OFFSET_BOLIVIA_MS = OFFSET_BOLIVIA_MIN * 60 * 1000;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !REGEX_FECHA.test(fecha)) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function esHoraValida(hora) {
  return typeof hora === 'string' && REGEX_HORA.test(hora);
}

function horaAMinutos(hora) {
  if (!esHoraValida(hora)) {
    throw new Error(`Hora inválida: ${hora}`);
  }
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm;
}

function minutosAHora(totalMinutos) {
  const hh = Math.floor(totalMinutos / 60);
  const mm = totalMinutos % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

/**
 * Devuelve la fecha/hora actual en America/La_Paz a partir de un Date cualquiera.
 */
function ahoraBolivia(now = new Date()) {
  const shifted = new Date(now.getTime() + OFFSET_BOLIVIA_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const hh = shifted.getUTCHours();
  const mm = shifted.getUTCMinutes();
  return {
    fecha: `${y}-${pad2(m)}-${pad2(d)}`,
    hora: `${pad2(hh)}:${pad2(mm)}`,
    minutosDelDia: hh * 60 + mm,
    diaSemana: shifted.getUTCDay(), // 0=Domingo, 1=Lunes, ..., 6=Sábado
    epochMs: now.getTime(),
  };
}

/**
 * Obtiene el día de la semana (0=Domingo .. 6=Sábado) para una fecha YYYY-MM-DD.
 */
function diaSemanaDeFecha(fecha) {
  if (!esFechaValida(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Convierte fecha YYYY-MM-DD + hora HH:mm (interpretados en America/La_Paz UTC-4)
 * a milisegundos UTC estándar.
 */
function parseFechaHoraBoliviaMs(fecha, hora) {
  if (!esFechaValida(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  if (!esHoraValida(hora)) throw new Error(`Hora inválida: ${hora}`);
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  // UTC = hora Bolivia + 4 horas
  return Date.UTC(y, m - 1, d, hh + 4, mm, 0, 0);
}

/**
 * Diferencia entera en días calendario (fechaB - fechaA).
 */
function diferenciaDias(fechaA, fechaB) {
  if (!esFechaValida(fechaA) || !esFechaValida(fechaB)) {
    throw new Error('Fechas inválidas para calcular diferencia de días');
  }
  const [yA, mA, dA] = fechaA.split('-').map(Number);
  const [yB, mB, dB] = fechaB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / MS_POR_DIA);
}

/**
 * Suma N días calendario a una fecha YYYY-MM-DD.
 */
function sumarDias(fecha, dias) {
  if (!esFechaValida(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/**
 * Horas restantes hasta una cita (puede ser negativo si ya pasó).
 */
function diferenciaHorasHastaCita(fecha, hora, now = new Date()) {
  const citaMs = parseFechaHoraBoliviaMs(fecha, hora);
  return (citaMs - now.getTime()) / (60 * 60 * 1000);
}

/**
 * Formatea YYYY-MM-DD como DD/MM/AAAA (convención oficial).
 */
function formatearFechaBO(fecha) {
  if (!esFechaValida(fecha)) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

module.exports = {
  OFFSET_BOLIVIA_MIN,
  esFechaValida,
  esHoraValida,
  horaAMinutos,
  minutosAHora,
  ahoraBolivia,
  diaSemanaDeFecha,
  parseFechaHoraBoliviaMs,
  diferenciaDias,
  sumarDias,
  diferenciaHorasHastaCita,
  formatearFechaBO,
};
