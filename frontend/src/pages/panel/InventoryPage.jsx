import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, callFn } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { extraerMensajeError, formatBs, formatFechaHora } from '../../utils/format';
import { ArrowRightLeft, PlusCircle, ShieldCheck } from 'lucide-react';

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const { sucursalActivaId, sucursalActiva, sucursalesActivas } = useBranch();
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [movForm, setMovForm] = useState({ productoId: '', tipo: 'entrada', cantidad: 1, motivo: '' });
  const [transForm, setTransForm] = useState({ productoId: '', sucursalDestinoId: '', cantidad: 1, motivo: '' });
  const [auditoriaRes, setAuditoriaRes] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProductos(list);
      if (list.length > 0) {
        setMovForm((f) => (f.productoId ? f : { ...f, productoId: list[0].id }));
        setTransForm((f) => (f.productoId ? f : { ...f, productoId: list[0].id }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const otras = sucursalesActivas.filter((s) => s.id !== sucursalActivaId);
    if (otras.length > 0) {
      setTransForm((f) =>
        otras.some((s) => s.id === f.sucursalDestinoId) ? f : { ...f, sucursalDestinoId: otras[0].id }
      );
    }
  }, [sucursalesActivas, sucursalActivaId]);

  useEffect(() => {
    if (!sucursalActivaId) return;
    const u1 = onSnapshot(
      query(collection(db, 'inventario'), where('sucursalId', '==', sucursalActivaId)),
      (snap) => {
        setInventario(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    const u2 = onSnapshot(
      query(collection(db, 'movimientos'), where('sucursalId', '==', sucursalActivaId)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0));
        setMovimientos(list);
      }
    );
    return () => {
      u1();
      u2();
    };
  }, [sucursalActivaId]);

  const invByProd = new Map(inventario.map((i) => [i.productoId, i]));

  async function handleMovimiento(e) {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setMsg('');
    try {
      const res = await callFn('registrarMovimiento', {
        sucursalId: sucursalActivaId,
        productoId: movForm.productoId,
        tipo: movForm.tipo,
        cantidad: Number(movForm.cantidad),
        motivo: movForm.motivo,
      });
      setMsg(`Movimiento (${res.tipo}) aplicado: stock ${res.stockAntes} → ${res.stockDespues}.`);
      setMovForm((f) => ({ ...f, cantidad: 1, motivo: '' }));
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleTransferencia(e) {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setMsg('');
    try {
      const res = await callFn('transferirProducto', {
        sucursalOrigenId: sucursalActivaId,
        sucursalDestinoId: transForm.sucursalDestinoId,
        productoId: transForm.productoId,
        cantidad: Number(transForm.cantidad),
        motivo: transForm.motivo,
      });
      setMsg(
        `Transferencia exitosa: origen ${res.origen.stockAntes}→${res.origen.stockDespues}, destino ${res.destino.stockAntes}→${res.destino.stockDespues}.`
      );
      setTransForm((f) => ({ ...f, cantidad: 1, motivo: '' }));
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoadingAction(false);
    }
  }

  async function ejecutarAuditoria() {
    setLoadingAction(true);
    setError('');
    try {
      const res = await callFn('auditarInventario');
      setAuditoriaRes(res);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{msg}</div>}

      {/* Formularios de operación */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <form onSubmit={handleMovimiento} className="card-elegant" style={{ padding: '1.35rem', display: 'grid', gap: '0.85rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#C46A86', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <PlusCircle size={18} /> Registrar movimiento ({sucursalActiva?.nombre})
          </h2>
          <select className="form-control" value={movForm.productoId} onChange={(e) => setMovForm({ ...movForm, productoId: e.target.value })}>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} ({formatBs(p.precio)})</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <select className="form-control" value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}>
              <option value="entrada">Entrada (reposición)</option>
              <option value="venta">Venta a cliente</option>
              <option value="salida">Salida / consumo</option>
            </select>
            <input
              type="number"
              min={1}
              required
              className="form-control"
              value={movForm.cantidad}
              onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })}
            />
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Motivo u observación"
            value={movForm.motivo}
            onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
          />
          <button type="submit" disabled={loadingAction} className="btn-primary">
            Aplicar movimiento
          </button>
        </form>

        <form onSubmit={handleTransferencia} className="card-elegant" style={{ padding: '1.35rem', display: 'grid', gap: '0.85rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#B8860B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ArrowRightLeft size={18} /> Transferir desde {sucursalActiva?.nombre}
          </h2>
          <select className="form-control" value={transForm.productoId} onChange={(e) => setTransForm({ ...transForm, productoId: e.target.value })}>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <select
              className="form-control"
              value={transForm.sucursalDestinoId}
              onChange={(e) => setTransForm({ ...transForm, sucursalDestinoId: e.target.value })}
            >
              {sucursalesActivas
                .filter((s) => s.id !== sucursalActivaId)
                .map((s) => (
                  <option key={s.id} value={s.id}>Hacia: {s.nombre}</option>
                ))}
            </select>
            <input
              type="number"
              min={1}
              required
              className="form-control"
              value={transForm.cantidad}
              onChange={(e) => setTransForm({ ...transForm, cantidad: e.target.value })}
            />
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Motivo de transferencia"
            value={transForm.motivo}
            onChange={(e) => setTransForm({ ...transForm, motivo: e.target.value })}
          />
          <button type="submit" disabled={loadingAction} className="btn-gold">
            Transferir producto
          </button>
        </form>
      </div>

      {/* Stock actual de la sucursal */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#C46A86' }}>Stock actual — {sucursalActiva?.nombre}</h2>
          {isAdmin && (
            <button type="button" onClick={ejecutarAuditoria} disabled={loadingAction} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={15} /> Auditar inventario (recalcular movimientos)
            </button>
          )}
        </div>

        {auditoriaRes && (
          <div
            className={auditoriaRes.ok ? 'badge badge-success' : 'badge badge-danger'}
            style={{ display: 'block', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}
          >
            {auditoriaRes.ok
              ? `Auditoría exacta: ${auditoriaRes.totalEvaluados} registros evaluados con 0 diferencias.`
              : `Se detectaron ${auditoriaRes.totalDiferencias} diferencias en ${auditoriaRes.totalEvaluados} registros.`}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Producto</th>
              <th style={{ padding: '0.75rem' }}>Precio</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock actual</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock mínimo</th>
              <th style={{ padding: '0.75rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const item = invByProd.get(p.id);
              const stock = item?.stock ?? 0;
              const min = p.stockMinimo ?? 2;
              const bajo = stock <= min;
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{p.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{formatBs(p.precio)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>{stock}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{min}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={bajo ? 'badge badge-danger' : 'badge badge-success'}>
                      {bajo ? 'Stock bajo' : 'Óptimo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Movimientos recientes */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', marginBottom: '0.9rem' }}>
          Movimientos recientes ({movimientos.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.7rem' }}>Fecha</th>
              <th style={{ padding: '0.7rem' }}>Tipo</th>
              <th style={{ padding: '0.7rem' }}>Producto</th>
              <th style={{ padding: '0.7rem', textAlign: 'center' }}>Cantidad</th>
              <th style={{ padding: '0.7rem', textAlign: 'center' }}>Stock Antes → Después</th>
              <th style={{ padding: '0.7rem' }}>Usuario</th>
              <th style={{ padding: '0.7rem' }}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.slice(0, 30).map((m) => (
              <tr key={m.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.7rem', whiteSpace: 'nowrap' }}>{formatFechaHora(m.fecha)}</td>
                <td style={{ padding: '0.7rem', textTransform: 'capitalize', fontWeight: 700 }}>
                  {m.tipo} {m.direccion ? `(${m.direccion})` : ''}
                </td>
                <td style={{ padding: '0.7rem' }}>{m.productoNombre || m.productoId}</td>
                <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 800, color: (m.delta || 0) >= 0 ? '#156E42' : '#B52825' }}>
                  {(m.delta || 0) >= 0 ? `+${m.cantidad}` : `-${m.cantidad}`}
                </td>
                <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                  {m.stockAntes} → <strong>{m.stockDespues}</strong>
                </td>
                <td style={{ padding: '0.7rem' }}>{m.usuario}</td>
                <td style={{ padding: '0.7rem', color: '#6C525F' }}>{m.motivo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
