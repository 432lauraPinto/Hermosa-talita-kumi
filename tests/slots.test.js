const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  generarSlotsDisponibles,
  validarHorarioCita,
  validarFechaReserva,
  evaluarOcupacionIntervalo,
  tieneCitaCruzadaCliente,
  puedeCancelarCliente,
  repartirCuotas,
  aplicarPagoACuotas,
} = require('../functions/src/lib/slots');

const HORARIO_BASE = {
  apertura: '09:00',
  cierre: '12:00',
  dias: [1, 2, 3, 4, 5, 6], // Lunes a Sábado (Domingo = 0 cerrado)
  slotMin: 30,
};

// Jueves 2026-05-07 08:00 America/La_Paz => 12:00 UTC
const NOW_REF = new Date('2026-05-07T12:00:00.000Z');

describe('Lógica pura de disponibilidad y agenda (slots.js)', () => {
  it('genera slots libres respetando apertura, cierre y duración del servicio', () => {
    const res = generarSlotsDisponibles({
      fecha: '2026-05-08', // Viernes
      horario: HORARIO_BASE,
      capacidad: 2,
      duracionMin: 60,
      citasExistentes: [],
      now: NOW_REF,
    });

    assert.equal(res.valido, true);
    // 09:00, 09:30, 10:00, 10:30, 11:00 (11:30 terminaría a las 12:30 > 12:00)
    assert.deepEqual(
      res.slotsDisponibles.map((s) => s.hora),
      ['09:00', '09:30', '10:00', '10:30', '11:00']
    );
  });

  it('maneja correctamente capacidad=2 con citas secuenciales sin falso bloqueo (sweep-line)', () => {
    // Cita A: 10:00-10:30, Cita B: 10:30-11:00 -> ocupan solo 1 trabajador en cada instante
    const citas = [
      { id: 'c1', hora: '10:00', duracionMin: 30, estado: 'confirmada' },
      { id: 'c2', hora: '10:30', duracionMin: 30, estado: 'pendiente' },
    ];

    const ocupacion = evaluarOcupacionIntervalo(10 * 60, 11 * 60, citas);
    assert.equal(ocupacion, 1);

    const check = validarHorarioCita({
      fecha: '2026-05-08',
      hora: '10:00',
      duracionMin: 60,
      horario: HORARIO_BASE,
      capacidad: 2,
      citasExistentes: citas,
      now: NOW_REF,
    });
    assert.equal(check.valido, true);
  });

  it('rechaza horario cuando dos citas coinciden simultáneamente con capacidad=2', () => {
    const citas = [
      { id: 'c1', hora: '10:00', duracionMin: 60, estado: 'confirmada' },
      { id: 'c2', hora: '10:30', duracionMin: 60, estado: 'pendiente' },
    ];

    const check = validarHorarioCita({
      fecha: '2026-05-08',
      hora: '10:00',
      duracionMin: 60,
      horario: HORARIO_BASE,
      capacidad: 2,
      citasExistentes: citas,
      now: NOW_REF,
    });
    assert.equal(check.valido, false);
    assert.equal(check.codigo, 'SIN_CUPO');
  });

  it('ignora citas canceladas o no_asistio y excluye propia cita al reprogramar', () => {
    const citas = [
      { id: 'c1', hora: '09:00', duracionMin: 60, estado: 'cancelada' },
      { id: 'c2', hora: '09:00', duracionMin: 60, estado: 'no_asistio' },
      { id: 'c3', hora: '09:00', duracionMin: 60, estado: 'confirmada' },
      { id: 'mi-cita', hora: '09:00', duracionMin: 60, estado: 'pendiente' },
    ];

    // Sin excluir mi-cita hay 2 activas -> sin cupo
    const bloqueada = validarHorarioCita({
      fecha: '2026-05-08',
      hora: '09:00',
      duracionMin: 60,
      horario: HORARIO_BASE,
      capacidad: 2,
      citasExistentes: citas,
      now: NOW_REF,
    });
    assert.equal(bloqueada.valido, false);

    // Excluyendo mi-cita (reprogramación) -> pasa
    const permitida = validarHorarioCita({
      fecha: '2026-05-08',
      hora: '09:30',
      duracionMin: 60,
      horario: HORARIO_BASE,
      capacidad: 2,
      citasExistentes: citas,
      excluirCitaId: 'mi-cita',
      now: NOW_REF,
    });
    assert.equal(permitida.valido, true);
  });

  it('rechaza fechas pasadas, domingos cerrados, fuera de horario y > 60 días', () => {
    const pasada = validarFechaReserva('2026-05-06', HORARIO_BASE, NOW_REF);
    assert.equal(pasada.valido, false);
    assert.equal(pasada.codigo, 'FECHA_PASADA');

    const domingo = validarFechaReserva('2026-05-10', HORARIO_BASE, NOW_REF); // Domingo
    assert.equal(domingo.valido, false);
    assert.equal(domingo.codigo, 'DIA_CERRADO');

    const muyLejana = validarFechaReserva('2026-07-10', HORARIO_BASE, NOW_REF); // > 60 días
    assert.equal(muyLejana.valido, false);
    assert.equal(muyLejana.codigo, 'EXCEDE_ANTICIPACION');

    const fueraHorario = validarHorarioCita({
      fecha: '2026-05-08',
      hora: '11:30',
      duracionMin: 60,
      horario: HORARIO_BASE,
      capacidad: 2,
      now: NOW_REF,
    });
    assert.equal(fueraHorario.valido, false);
    assert.equal(fueraHorario.codigo, 'FUERA_DE_HORARIO');
  });

  it('detecta citas cruzadas del mismo cliente incluso entre sucursales distintas', () => {
    const citasCliente = [
      { id: 'c1', sucursalId: 'villa-fatima', fecha: '2026-05-08', hora: '10:00', duracionMin: 60, estado: 'confirmada' },
    ];

    assert.equal(
      tieneCitaCruzadaCliente({ fecha: '2026-05-08', hora: '10:30', duracionMin: 45, citasCliente }),
      true
    );
    assert.equal(
      tieneCitaCruzadaCliente({ fecha: '2026-05-08', hora: '11:00', duracionMin: 45, citasCliente }),
      false
    );
    assert.equal(
      tieneCitaCruzadaCliente({ fecha: '2026-05-08', hora: '10:30', duracionMin: 45, citasCliente, excluirCitaId: 'c1' }),
      false
    );
  });

  it('valida la regla de cancelación del cliente con 2 horas o más de anticipación', () => {
    // NOW_REF es 2026-05-07 08:00 Bolivia
    assert.equal(puedeCancelarCliente('2026-05-07', '10:00', NOW_REF).permitido, true);
    assert.equal(puedeCancelarCliente('2026-05-07', '09:59', NOW_REF).permitido, false);
  });
});

describe('Lógica pura de cuotas y pagos exactos en centavos', () => {
  it('reparte cuotas en céntimos exactos cuya suma coincide exactamente con el total', () => {
    const cuotas = repartirCuotas(100, 3, '2026-05-07');
    assert.equal(cuotas.length, 3);
    assert.deepEqual(
      cuotas.map((c) => c.monto),
      [33.34, 33.33, 33.33]
    );
    const suma = cuotas.reduce((acc, c) => acc + Math.round(c.monto * 100), 0);
    assert.equal(suma, 10000);
  });

  it('aplica pagos parciales y totales en orden, rechaza pagos mayores al saldo y cierra en 0', () => {
    const cuotas = repartirCuotas(100, 3);

    // Pago parcial en cuota 1
    const r1 = aplicarPagoACuotas(cuotas, 20);
    assert.equal(r1.saldoRestante, 80);
    assert.equal(r1.cuotasActualizadas[0].estado, 'parcial');
    assert.equal(r1.cuotasActualizadas[0].saldo, 13.34);
    assert.equal(r1.cerrado, false);

    // Pago que cubre resto de cuota 1 + completa cuota 2
    const r2 = aplicarPagoACuotas(r1.cuotasActualizadas, 46.67);
    assert.equal(r2.saldoRestante, 33.33);
    assert.equal(r2.cuotasActualizadas[0].estado, 'pagada');
    assert.equal(r2.cuotasActualizadas[1].estado, 'pagada');
    assert.equal(r2.cuotasActualizadas[2].estado, 'pendiente');

    // Pago mayor al saldo rechazado
    assert.throws(() => aplicarPagoACuotas(r2.cuotasActualizadas, 33.34), /excede el saldo/i);

    // Pago final cierra el tratamiento en 0.00
    const r3 = aplicarPagoACuotas(r2.cuotasActualizadas, 33.33);
    assert.equal(r3.saldoRestante, 0);
    assert.equal(r3.cerrado, true);
    assert.equal(r3.cuotasActualizadas[2].estado, 'pagada');
  });
});
