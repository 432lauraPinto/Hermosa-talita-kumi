/**
 * Utilidades monetarias en Bolivianos (Bs) con aritmética exacta en centavos enteros.
 * Evita errores de coma flotante en repartición de cuotas y amortización de saldos.
 */

const { sumarDias, esFechaValida } = require('./time');

function aCentavos(monto) {
  const num = Number(monto);
  if (!Number.isFinite(num)) {
    throw new Error(`Monto inválido: ${monto}`);
  }
  return Math.round(num * 100);
}

function deCentavos(centavos) {
  return Number((centavos / 100).toFixed(2));
}

function redondearBs(monto) {
  return deCentavos(aCentavos(monto));
}

function formatearBs(monto) {
  return `Bs ${redondearBs(monto).toFixed(2)}`;
}

/**
 * Reparte un monto total en N cuotas exactas al centavo.
 * Los centavos sobrantes (resto) se distribuyen +0.01 en las primeras cuotas.
 * La suma de los montos de todas las cuotas siempre es exactamente igual al total.
 */
function repartirCuotas(total, cantidadCuotas, fechaBase = null) {
  const totalCentavos = aCentavos(total);
  const n = Number(cantidadCuotas);

  if (totalCentavos <= 0) {
    throw new Error('El total del tratamiento debe ser mayor a Bs 0.00');
  }
  if (!Number.isInteger(n) || n < 1 || n > 24) {
    throw new Error('La cantidad de cuotas debe ser un entero entre 1 y 24');
  }

  const base = Math.floor(totalCentavos / n);
  const resto = totalCentavos % n;
  const cuotas = [];

  for (let i = 0; i < n; i++) {
    const centavosCuota = base + (i < resto ? 1 : 0);
    const monto = deCentavos(centavosCuota);
    const cuota = {
      numero: i + 1,
      monto,
      pagado: 0,
      saldo: monto,
      estado: 'pendiente',
    };
    if (fechaBase && esFechaValida(fechaBase)) {
      cuota.fechaVencimiento = sumarDias(fechaBase, i * 30);
    }
    cuotas.push(cuota);
  }

  return cuotas;
}

/**
 * Aplica un pago en orden sobre las cuotas pendientes/parciales.
 * Rechaza montos <= 0 o mayores al saldo pendiente total.
 */
function aplicarPagoACuotas(cuotas, montoPago) {
  if (!Array.isArray(cuotas) || cuotas.length === 0) {
    throw new Error('El tratamiento no tiene plan de cuotas');
  }

  const pagoCentavos = aCentavos(montoPago);
  if (pagoCentavos <= 0) {
    throw new Error('El monto del pago debe ser mayor a Bs 0.00');
  }

  const saldoTotalCentavos = cuotas.reduce((acc, c) => {
    const montoC = aCentavos(c.monto);
    const pagadoC = aCentavos(c.pagado || 0);
    return acc + Math.max(0, montoC - pagadoC);
  }, 0);

  if (saldoTotalCentavos === 0) {
    throw new Error('El tratamiento ya se encuentra completamente pagado');
  }
  if (pagoCentavos > saldoTotalCentavos) {
    throw new Error(
      `El pago (${formatearBs(montoPago)}) excede el saldo pendiente (${formatearBs(deCentavos(saldoTotalCentavos))})`
    );
  }

  let restante = pagoCentavos;
  const cuotasAfectadas = [];

  const cuotasActualizadas = cuotas.map((c) => {
    const montoC = aCentavos(c.monto);
    const pagadoActualC = aCentavos(c.pagado || 0);
    const faltanteC = Math.max(0, montoC - pagadoActualC);

    if (restante <= 0 || faltanteC === 0) {
      return {
        ...c,
        monto: deCentavos(montoC),
        pagado: deCentavos(pagadoActualC),
        saldo: deCentavos(faltanteC),
        estado: faltanteC === 0 ? 'pagada' : pagadoActualC > 0 ? 'parcial' : 'pendiente',
      };
    }

    const aplicadoC = Math.min(restante, faltanteC);
    restante -= aplicadoC;
    const nuevoPagadoC = pagadoActualC + aplicadoC;
    const nuevoSaldoC = montoC - nuevoPagadoC;
    cuotasAfectadas.push(c.numero);

    return {
      ...c,
      monto: deCentavos(montoC),
      pagado: deCentavos(nuevoPagadoC),
      saldo: deCentavos(nuevoSaldoC),
      estado: nuevoSaldoC === 0 ? 'pagada' : 'parcial',
    };
  });

  const saldoRestanteCentavos = saldoTotalCentavos - pagoCentavos;
  return {
    cuotasActualizadas,
    saldoRestante: deCentavos(saldoRestanteCentavos),
    cuotasAfectadas,
    numeroCuotaPrincipal: cuotasAfectadas[0] || null,
    cerrado: saldoRestanteCentavos === 0,
  };
}

module.exports = {
  aCentavos,
  deCentavos,
  redondearBs,
  formatearBs,
  repartirCuotas,
  aplicarPagoACuotas,
};
