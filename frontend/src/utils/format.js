/**
 * Helpers de formato oficiales de HERMOSA TALITA KUMI:
 * - Moneda: Bs 0.00
 * - Fechas: DD/MM/AAAA
 * - Horas: HH:mm (24 h)
 * - Zona horaria: America/La_Paz (UTC-4 fijo)
 */

const OFFSET_BO_MS = -4 * 60 * 60 * 1000;

export function formatBs(monto) {
  const num = Number(monto || 0);
  if (!Number.isFinite(num)) return 'Bs 0.00';
  return `Bs ${(Math.round(num * 100) / 100).toFixed(2)}`;
}

export function formatFecha(valor) {
  if (!valor) return '—';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    const [y, m, d] = valor.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const date = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
  if (Number.isNaN(date.getTime())) return '—';
  const bo = new Date(date.getTime() + OFFSET_BO_MS);
  const d = String(bo.getUTCDate()).padStart(2, '0');
  const m = String(bo.getUTCMonth() + 1).padStart(2, '0');
  const y = bo.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

export function formatHora(valor) {
  if (!valor) return '—';
  if (typeof valor === 'string' && /^\d{2}:\d{2}/.test(valor)) {
    return valor.slice(0, 5);
  }
  const date = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
  if (Number.isNaN(date.getTime())) return '—';
  const bo = new Date(date.getTime() + OFFSET_BO_MS);
  const hh = String(bo.getUTCHours()).padStart(2, '0');
  const mm = String(bo.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatFechaHora(valor) {
  if (!valor) return '—';
  return `${formatFecha(valor)} ${formatHora(valor)}`;
}

export function hoyBoliviaStr(now = new Date()) {
  const bo = new Date(now.getTime() + OFFSET_BO_MS);
  const y = bo.getUTCFullYear();
  const m = String(bo.getUTCMonth() + 1).padStart(2, '0');
  const d = String(bo.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function whatsappUrl(telefono, mensaje = 'Hola, quisiera consultar los servicios de HERMOSA TALITA KUMI.') {
  const digits = String(telefono || '77197857').replace(/[^0-9]/g, '');
  const full = digits.startsWith('591') ? digits : `591${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(mensaje)}`;
}

export function extraerMensajeError(err) {
  if (!err) return 'Ocurrió un error inesperado.';
  const raw = err.message || String(err);
  return raw
    .replace(/^Firebase:\s*/i, '')
    .replace(/^FirebaseError:\s*/i, '')
    .replace(/\s*\(auth\/[^)]+\)\.?$/i, '')
    .trim();
}

export function etiquetaEstadoCita(estado) {
  const mapa = {
    pendiente: { texto: 'Pendiente', clase: 'badge badge-warning' },
    confirmada: { texto: 'Confirmada', clase: 'badge badge-success' },
    completada: { texto: 'Completada', clase: 'badge badge-gold' },
    no_asistio: { texto: 'No asistió', clase: 'badge badge-danger' },
    cancelada: { texto: 'Cancelada', clase: 'badge badge-danger' },
  };
  return mapa[estado] || { texto: estado || '—', clase: 'badge badge-mauve' };
}
