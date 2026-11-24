import React, { useEffect, useState } from 'react';
import { callFn } from '../../firebase';
import { extraerMensajeError, formatBs, formatFecha } from '../../utils/format';
import { RefreshCw, AlertTriangle, Calendar, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function cargarResumen() {
    setLoading(true);
    setError('');
    try {
      const data = await callFn('resumenGeneral');
      setResumen(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarResumen();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', color: '#6C525F' }}>Consolidando indicadores...</div>;
  }

  if (error) {
    return (
      <div className="badge badge-danger" style={{ display: 'block', padding: '1rem', borderRadius: '12px' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#6C525F' }}>
          Fecha de referencia (America/La_Paz): <strong>{formatFecha(resumen?.fechaReferencia)}</strong> • Alcance:{' '}
          <strong>{resumen?.alcance === 'todas_las_sedes' ? 'Las 4 sucursales' : 'Sucursales asignadas'}</strong>
        </div>
        <button type="button" onClick={cargarResumen} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6C525F', fontSize: '0.84rem', fontWeight: 700 }}>
            <span>Citas hoy</span>
            <Calendar size={18} color="#C46A86" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#C46A86', marginTop: '0.35rem' }}>
            {resumen?.citas?.hoy ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6C525F' }}>
            Pendientes: {resumen?.citas?.porEstado?.pendiente ?? 0} • Confirmadas: {resumen?.citas?.porEstado?.confirmada ?? 0}
          </div>
        </div>

        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6C525F', fontSize: '0.84rem', fontWeight: 700 }}>
            <span>Ingresos del mes</span>
            <TrendingUp size={18} color="#156E42" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#156E42', marginTop: '0.35rem' }}>
            {formatBs(resumen?.ingresos?.mesActual)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6C525F' }}>
            Acumulado total: {formatBs(resumen?.ingresos?.total)}
          </div>
        </div>

        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6C525F', fontSize: '0.84rem', fontWeight: 700 }}>
            <span>Saldo por cobrar</span>
            <DollarSign size={18} color="#B8860B" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B8860B', marginTop: '0.35rem' }}>
            {formatBs(resumen?.ingresos?.saldoPorCobrar)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6C525F' }}>
            {resumen?.ingresos?.tratamientosActivos ?? 0} tratamientos con cuotas activas
          </div>
        </div>

        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6C525F', fontSize: '0.84rem', fontWeight: 700 }}>
            <span>Alertas de stock bajo</span>
            <Package size={18} color="#B52825" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: (resumen?.stockBajo?.length || 0) > 0 ? '#B52825' : '#156E42', marginTop: '0.35rem' }}>
            {resumen?.stockBajo?.length ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6C525F' }}>Productos igual o bajo el mínimo</div>
        </div>
      </div>

      {/* Desglose por sucursal */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#C46A86', marginBottom: '0.9rem' }}>Resumen por sucursal</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Sucursal</th>
              <th style={{ padding: '0.75rem' }}>Ciudad</th>
              <th style={{ padding: '0.75rem' }}>Citas hoy</th>
              <th style={{ padding: '0.75rem' }}>Citas activas</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ingresos</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock bajo</th>
            </tr>
          </thead>
          <tbody>
            {(resumen?.porSucursal || []).map((s) => (
              <tr key={s.sucursalId} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>{s.nombre}</td>
                <td style={{ padding: '0.75rem' }}>{s.ciudad}</td>
                <td style={{ padding: '0.75rem' }}>{s.citasHoy}</td>
                <td style={{ padding: '0.75rem' }}>{s.citasActivas}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#156E42' }}>
                  {formatBs(s.ingresos)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span className={s.stockBajoCount > 0 ? 'badge badge-danger' : 'badge badge-success'}>
                    {s.stockBajoCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock bajo */}
      {(resumen?.stockBajo?.length || 0) > 0 && (
        <div className="card-elegant" style={{ padding: '1.35rem', borderColor: '#FCA8A6' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#B52825', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AlertTriangle size={18} /> Productos con stock bajo
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {resumen.stockBajo.map((a) => (
              <div key={a.id} style={{ padding: '0.85rem', borderRadius: '12px', backgroundColor: '#FEECEB', border: '1px solid #FCA8A6' }}>
                <div style={{ fontWeight: 800, color: '#2C1622', fontSize: '0.9rem' }}>{a.productoNombre}</div>
                <div style={{ fontSize: '0.82rem', color: '#6C525F' }}>Sucursal: {a.sucursalNombre}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B52825', marginTop: '0.25rem' }}>
                  Stock actual: {a.stock} u. (mínimo: {a.stockMinimo})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
