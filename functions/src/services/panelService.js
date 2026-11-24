const { db } = require('../lib/firebase');
const { ahoraBolivia } = require('../lib/time');
const { aCentavos, deCentavos } = require('../lib/money');

/**
 * Consolida citas, ingresos, saldos pendientes y alertas de stock bajo.
 * Admin ve las 4 sedes; encargado solo sus sucursales asignadas.
 */
async function resumenGeneralCore({ actor }) {
  const esAdmin = actor.role === 'admin';
  const hoy = ahoraBolivia().fecha;
  const mesActual = hoy.slice(0, 7); // AAAA-MM

  const [sucSnap, prodSnap] = await Promise.all([
    db.collection('sucursales').get(),
    db.collection('productos').get(),
  ]);

  const todasSucursales = sucSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const sucursalesPermitidas = esAdmin
    ? todasSucursales
    : todasSucursales.filter((s) => Array.isArray(actor.sucursales) && actor.sucursales.includes(s.id));

  const idsPermitidos = new Set(sucursalesPermitidas.map((s) => s.id));
  const prodMap = new Map(prodSnap.docs.map((d) => [d.id, d.data()]));
  const sucMap = new Map(sucursalesPermitidas.map((s) => [s.id, s]));

  // Cargar colecciones filtrando por alcance
  const [citasSnap, pagosSnap, tratSnap, invSnap] = await Promise.all([
    db.collection('citas').get(),
    db.collection('pagos').get(),
    db.collection('tratamientos').get(),
    db.collection('inventario').get(),
  ]);

  const citas = citasSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => idsPermitidos.has(c.sucursalId));

  const pagos = pagosSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => idsPermitidos.has(p.sucursalId));

  const tratamientos = tratSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => idsPermitidos.has(t.sucursalId));

  const inventario = invSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((i) => idsPermitidos.has(i.sucursalId));

  // Contadores de citas
  const citasPorEstado = {
    pendiente: 0,
    confirmada: 0,
    completada: 0,
    no_asistio: 0,
    cancelada: 0,
  };
  let citasHoy = 0;

  const porSucursalMap = new Map();
  for (const s of sucursalesPermitidas) {
    porSucursalMap.set(s.id, {
      sucursalId: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad || '',
      citasHoy: 0,
      citasActivas: 0,
      ingresosCentavos: 0,
      stockBajoCount: 0,
    });
  }

  for (const c of citas) {
    if (citasPorEstado[c.estado] !== undefined) {
      citasPorEstado[c.estado]++;
    }
    const bucket = porSucursalMap.get(c.sucursalId);
    if (c.fecha === hoy && ['pendiente', 'confirmada', 'completada'].includes(c.estado)) {
      citasHoy++;
      if (bucket) bucket.citasHoy++;
    }
    if (['pendiente', 'confirmada'].includes(c.estado) && c.fecha >= hoy) {
      if (bucket) bucket.citasActivas++;
    }
  }

  // Ingresos (exactos en centavos)
  let ingresosTotalCentavos = 0;
  let ingresosMesCentavos = 0;
  for (const p of pagos) {
    const montoC = aCentavos(p.monto || 0);
    ingresosTotalCentavos += montoC;
    const fechaPago = p.fechaStr || '';
    if (fechaPago.startsWith(mesActual)) {
      ingresosMesCentavos += montoC;
    }
    const bucket = porSucursalMap.get(p.sucursalId);
    if (bucket) bucket.ingresosCentavos += montoC;
  }

  // Saldos pendientes en tratamientos
  let saldoPendienteCentavos = 0;
  let tratamientosActivos = 0;
  for (const t of tratamientos) {
    const sC = aCentavos(t.saldo || 0);
    if (sC > 0) {
      saldoPendienteCentavos += sC;
      tratamientosActivos++;
    }
  }

  // Alertas de stock bajo
  const stockBajo = [];
  for (const item of inventario) {
    const prod = prodMap.get(item.productoId);
    const minimo = Number(item.stockMinimo ?? prod?.stockMinimo ?? 2);
    const stock = Number(item.stock || 0);
    if (stock <= minimo) {
      stockBajo.push({
        id: item.id,
        sucursalId: item.sucursalId,
        sucursalNombre: sucMap.get(item.sucursalId)?.nombre || item.sucursalNombre || item.sucursalId,
        productoId: item.productoId,
        productoNombre: prod?.nombre || item.productoNombre || item.productoId,
        stock,
        stockMinimo: minimo,
      });
      const bucket = porSucursalMap.get(item.sucursalId);
      if (bucket) bucket.stockBajoCount++;
    }
  }

  const porSucursal = Array.from(porSucursalMap.values()).map((b) => ({
    sucursalId: b.sucursalId,
    nombre: b.nombre,
    ciudad: b.ciudad,
    citasHoy: b.citasHoy,
    citasActivas: b.citasActivas,
    ingresos: deCentavos(b.ingresosCentavos),
    stockBajoCount: b.stockBajoCount,
  }));

  return {
    fechaReferencia: hoy,
    alcance: esAdmin ? 'todas_las_sedes' : 'sucursales_asignadas',
    citas: {
      total: citas.length,
      hoy: citasHoy,
      porEstado: citasPorEstado,
    },
    ingresos: {
      total: deCentavos(ingresosTotalCentavos),
      mesActual: deCentavos(ingresosMesCentavos),
      saldoPorCobrar: deCentavos(saldoPendienteCentavos),
      tratamientosActivos,
    },
    stockBajo,
    porSucursal,
  };
}

module.exports = { resumenGeneralCore };
