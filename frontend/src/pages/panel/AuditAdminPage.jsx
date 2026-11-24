import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, callFn } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import { extraerMensajeError, formatFechaHora } from '../../utils/format';
import { ShieldCheck } from 'lucide-react';

export default function AuditAdminPage() {
  const { sucursales } = useBranch();
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'productos'), (s) => setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'inventario'), (s) => setInventario(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, 'auditoria'), (s) => {
      const list = s.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0));
      setAuditoria(list);
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const invMap = new Map(inventario.map((i) => [`${i.sucursalId}_${i.productoId}`, i.stock]));

  async function correrAuditoria() {
    setLoading(true);
    setError('');
    try {
      const res = await callFn('auditarInventario');
      setAuditResult(res);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}

      {/* Inventario consolidado de las 4 sedes */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#C46A86' }}>Inventario consolidado (4 sucursales)</h2>
          <button type="button" onClick={correrAuditoria} disabled={loading} className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.86rem' }}>
            <ShieldCheck size={16} /> {loading ? 'Auditando...' : 'Ejecutar auditarInventario'}
          </button>
        </div>

        {auditResult && (
          <div className={auditResult.ok ? 'badge badge-success' : 'badge badge-danger'} style={{ display: 'block', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
            {auditResult.ok
              ? `Consistencia verificada: ${auditResult.totalEvaluados} registros evaluados sin diferencias.`
              : `Diferencias detectadas: ${auditResult.totalDiferencias}.`}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.7rem' }}>Producto</th>
              {sucursales.map((s) => (
                <th key={s.id} style={{ padding: '0.7rem', textAlign: 'center' }}>{s.nombre}</th>
              ))}
              <th style={{ padding: '0.7rem', textAlign: 'center' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              let total = 0;
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                  <td style={{ padding: '0.7rem', fontWeight: 700 }}>{p.nombre}</td>
                  {sucursales.map((s) => {
                    const st = invMap.get(`${s.id}_${p.id}`) ?? 0;
                    total += st;
                    const bajo = st <= (p.stockMinimo ?? 2);
                    return (
                      <td key={s.id} style={{ padding: '0.7rem', textAlign: 'center' }}>
                        <span className={bajo ? 'badge badge-danger' : 'badge badge-success'}>{st}</span>
                      </td>
                    );
                  })}
                  <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 800 }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bitácora de auditoría */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#C46A86', marginBottom: '0.9rem' }}>
          Bitácora de auditoría ({auditoria.length} eventos)
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.65rem' }}>Fecha</th>
              <th style={{ padding: '0.65rem' }}>Módulo</th>
              <th style={{ padding: '0.65rem' }}>Acción</th>
              <th style={{ padding: '0.65rem' }}>Usuario / Rol</th>
              <th style={{ padding: '0.65rem' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {auditoria.slice(0, 50).map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.65rem', whiteSpace: 'nowrap' }}>{formatFechaHora(a.fecha)}</td>
                <td style={{ padding: '0.65rem' }}><span className="badge badge-mauve">{a.modulo}</span></td>
                <td style={{ padding: '0.65rem', fontWeight: 700 }}>{a.accion}</td>
                <td style={{ padding: '0.65rem' }}>{a.usuarioEmail || a.usuarioId} ({a.usuarioRol})</td>
                <td style={{ padding: '0.65rem', color: '#6C525F', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {JSON.stringify(a.detalle || {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
