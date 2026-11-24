/**
 * Lógica pura de disponibilidad, solapamientos, validaciones de agenda y cuotas.
 * Sin dependencias de Firebase: 100% testeable con pruebas unitarias rápidas.
 */

const {
  esFechaValida,
  esHoraValida,
  horaAMinutos,
  minutosAHora,
  ahoraBolivia,
  diaSemanaDeFecha,
  diferenciaDias,
  diferenciaHorasHastaCita,
} = require('./time');
const { repartirCuotas, aplicarPagoACuotas } = require('./money');

const MAX_DIAS_ANTICIPACION = 60;
const MIN_HORAS_CANCELACION = 2;
const ESTADOS_ACTIVOS = ['pendiente', 'confirmada'];

function normalizarHorario(horario = {}) {
  return {
    apertura: horario.apertura || '08:30',
    cierre: horario.cierre || '19:30',
    dias: Array.isArray(horario.dias) ? horario.dias : [1, 2, 3, 4, 5, 6],
    slotMin: Number(horario.slotMin) > 0 ? Number(horario.slotMin) : 30,
    diasCerrados: Array.isArray(horario.diasCerrados) ? horario.diasCerrados : [],
  };
}

/**
 * Valida si una fecha AAAA-MM-DD puede recibir reservas.
 * Rechaza fechas pasadas, días cerrados y reservas a más de 60 días.
 */
function validarFechaReserva(fecha, horarioInput, now = new Date()) {
  if (!esFechaValida(fecha)) {
    return { valido: false, codigo: 'FECHA_INVALIDA', motivo: 'La fecha debe tener formato AAAA-MM-DD válido.' };
  }

  const horario = normalizarHorario(horarioInput);
  const hoy = ahoraBolivia(now).fecha;
  const diff = diferenciaDias(hoy, fecha);

  if (diff < 0) {
    return { valido: false, codigo: 'FECHA_PASADA', motivo: 'No se pueden reservar citas en fechas pasadas.' };
  }
  if (diff > MAX_DIAS_ANTICIPACION) {
    return {
      valido: false,
      codigo: 'EXCEDE_ANTICIPACION',
      motivo: `Las reservas solo pueden hacerse con hasta ${MAX_DIAS_ANTICIPACION} días de anticipación.`,
    };
  }

  const dia = diaSemanaDeFecha(fecha);
  if (!horario.dias.includes(dia)) {
    return { valido: false, codigo: 'DIA_CERRADO', motivo: 'La sucursal no atiende el día seleccionado.' };
  }

  if (horario.diasCerrados.includes(fecha)) {
    return { valido: false, codigo: 'FERIADO_CERRADO', motivo: 'La sucursal se encuentra cerrada en esa fecha.' };
  }

  return { valido: true };
}

/**
 * Calcula la ocupación simultánea máxima en el intervalo [inicioMin, finMin)
 * mediante barrido de eventos (sweep-line).
 *
 * Ejemplo clave con capacidad = 2:
 * Si ya existen dos citas secuenciales [10:00, 10:30) y [10:30, 11:00),
 * la ocupación simultánea máxima durante [10:00, 11:00) es 1 (NO 2),
 * porque un solo trabajador puede atender ambas y el segundo queda libre.
 */
function evaluarOcupacionIntervalo(inicioMin, finMin, citasActivas) {
  const eventos = [];

  for (const cita of citasActivas) {
    if (!esHoraValida(cita.hora)) continue;
    const cIni = horaAMinutos(cita.hora);
    const cDur = Number(cita.duracionMin) > 0 ? Number(cita.duracionMin) : 30;
    const cFin = cIni + cDur;

    // Intersección estricta con [inicioMin, finMin)
    const interIni = Math.max(inicioMin, cIni);
    const interFin = Math.min(finMin, cFin);
    if (interIni < interFin) {
      eventos.push({ t: interIni, delta: 1 });
      eventos.push({ t: interFin, delta: -1 });
    }
  }

  if (eventos.length === 0) return 0;

  // En el mismo minuto, los cierres (-1) se procesan antes que las aperturas (+1)
  eventos.sort((a, b) => a.t - b.t || a.delta - b.delta);

  let actual = 0;
  let maximo = 0;
  for (const ev of eventos) {
    actual += ev.delta;
    if (actual > maximo) maximo = actual;
  }
  return maximo;
}

function filtrarCitasActivas(citasExistentes = [], excluirCitaId = null) {
  return citasExistentes.filter(
    (c) =>
      c &&
      ESTADOS_ACTIVOS.includes(c.estado) &&
      (!excluirCitaId || c.id !== excluirCitaId)
  );
}

/**
 * Genera todos los horarios posibles entre apertura y cierre cada slotMin,
 * indicando cuántos trabajadores están ocupados y si hay cupo libre.
 */
function generarSlotsDisponibles({
  fecha,
  horario: horarioInput,
  capacidad = 2,
  duracionMin = 60,
  citasExistentes = [],
  excluirCitaId = null,
  now = new Date(),
}) {
  const validFecha = validarFechaReserva(fecha, horarioInput, now);
  if (!validFecha.valido) {
    return {
      valido: false,
      codigo: validFecha.codigo,
      motivo: validFecha.motivo,
      fecha,
      slots: [],
      slotsDisponibles: [],
    };
  }

  const dur = Number(duracionMin);
  if (!Number.isFinite(dur) || dur <= 0) {
    return {
      valido: false,
      codigo: 'DURACION_INVALIDA',
      motivo: 'La duración del servicio debe ser mayor a 0 minutos.',
      fecha,
      slots: [],
      slotsDisponibles: [],
    };
  }

  const cap = Number(capacidad) > 0 ? Number(capacidad) : 2;
  const horario = normalizarHorario(horarioInput);
  const aperturaMin = horaAMinutos(horario.apertura);
  const cierreMin = horaAMinutos(horario.cierre);
  const slotMin = horario.slotMin;

  const ahoraBO = ahoraBolivia(now);
  const esHoy = fecha === ahoraBO.fecha;
  const citasActivas = filtrarCitasActivas(citasExistentes, excluirCitaId);

  const slots = [];
  for (let t = aperturaMin; t + dur <= cierreMin; t += slotMin) {
    const pasado = esHoy && t <= ahoraBO.minutosDelDia;
    const ocupados = evaluarOcupacionIntervalo(t, t + dur, citasActivas);
    const disponibles = pasado ? 0 : Math.max(0, cap - ocupados);

    slots.push({
      hora: minutosAHora(t),
      horaFin: minutosAHora(t + dur),
      ocupados,
      capacidad: cap,
      disponibles,
      disponible: !pasado && disponibles > 0,
      pasado,
    });
  }

  return {
    valido: true,
    fecha,
    capacidad: cap,
    duracionMin: dur,
    slots,
    slotsDisponibles: slots.filter((s) => s.disponible),
  };
}

/**
 * Valida una reserva puntual (fecha + hora + duración) contra horario, pasado y capacidad.
 */
function validarHorarioCita({
  fecha,
  hora,
  duracionMin,
  horario: horarioInput,
  capacidad = 2,
  citasExistentes = [],
  excluirCitaId = null,
  now = new Date(),
  validarAlineacionSlot = true,
}) {
  const validFecha = validarFechaReserva(fecha, horarioInput, now);
  if (!validFecha.valido) return validFecha;

  if (!esHoraValida(hora)) {
    return { valido: false, codigo: 'HORA_INVALIDA', motivo: 'La hora debe tener formato 24 h (HH:mm).' };
  }

  const dur = Number(duracionMin);
  if (!Number.isFinite(dur) || dur <= 0) {
    return { valido: false, codigo: 'DURACION_INVALIDA', motivo: 'Duración de servicio inválida.' };
  }

  const horario = normalizarHorario(horarioInput);
  const aperturaMin = horaAMinutos(horario.apertura);
  const cierreMin = horaAMinutos(horario.cierre);
  const inicioMin = horaAMinutos(hora);
  const finMin = inicioMin + dur;

  if (inicioMin < aperturaMin || finMin > cierreMin) {
    return {
      valido: false,
      codigo: 'FUERA_DE_HORARIO',
      motivo: `El horario de atención es de ${horario.apertura} a ${horario.cierre}.`,
    };
  }

  if (validarAlineacionSlot && (inicioMin - aperturaMin) % horario.slotMin !== 0) {
    return {
      valido: false,
      codigo: 'HORA_NO_ALINEADA',
      motivo: `Las citas deben iniciar en intervalos de ${horario.slotMin} minutos desde las ${horario.apertura}.`,
    };
  }

  const horasRestantes = diferenciaHorasHastaCita(fecha, hora, now);
  if (horasRestantes <= 0) {
    return { valido: false, codigo: 'HORA_PASADA', motivo: 'No se puede agendar en un horario que ya pasó.' };
  }

  const cap = Number(capacidad) > 0 ? Number(capacidad) : 2;
  const citasActivas = filtrarCitasActivas(citasExistentes, excluirCitaId);
  const ocupados = evaluarOcupacionIntervalo(inicioMin, finMin, citasActivas);

  if (ocupados >= cap) {
    return {
      valido: false,
      codigo: 'SIN_CUPO',
      motivo: 'No hay cupos disponibles en ese horario para la sucursal seleccionada.',
    };
  }

  return {
    valido: true,
    horaFin: minutosAHora(finMin),
    ocupados,
    capacidad: cap,
  };
}

/**
 * Verifica si un cliente ya tiene otra cita activa cruzada en la misma fecha
 * (en cualquier sucursal).
 */
function tieneCitaCruzadaCliente({ fecha, hora, duracionMin, citasCliente = [], excluirCitaId = null }) {
  if (!esHoraValida(hora)) return false;
  const inicioMin = horaAMinutos(hora);
  const finMin = inicioMin + Number(duracionMin || 30);

  return citasCliente.some((c) => {
    if (!c || c.fecha !== fecha) return false;
    if (!ESTADOS_ACTIVOS.includes(c.estado)) return false;
    if (excluirCitaId && c.id === excluirCitaId) return false;
    if (!esHoraValida(c.hora)) return false;
    const cIni = horaAMinutos(c.hora);
    const cFin = cIni + Number(c.duracionMin || 30);
    return Math.max(inicioMin, cIni) < Math.min(finMin, cFin);
  });
}

/**
 * Un cliente solo puede cancelar con 2 horas o más de anticipación.
 */
function puedeCancelarCliente(fecha, hora, now = new Date(), minHoras = MIN_HORAS_CANCELACION) {
  const horas = diferenciaHorasHastaCita(fecha, hora, now);
  return {
    permitido: horas >= minHoras,
    horasRestantes: Number(horas.toFixed(2)),
    minHoras,
  };
}

module.exports = {
  MAX_DIAS_ANTICIPACION,
  MIN_HORAS_CANCELACION,
  ESTADOS_ACTIVOS,
  normalizarHorario,
  validarFechaReserva,
  evaluarOcupacionIntervalo,
  generarSlotsDisponibles,
  validarHorarioCita,
  tieneCitaCruzadaCliente,
  puedeCancelarCliente,
  repartirCuotas,
  aplicarPagoACuotas,
};
