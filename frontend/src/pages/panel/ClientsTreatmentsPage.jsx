import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, callFn } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import { extraerMensajeError, formatBs, formatFecha, formatFechaHora, hoyBoliviaStr } from '../../utils/format';
import { Plus, CreditCard } from 'lucide-react';

export default function ClientsTreatmentsPage() {
  const { sucursalActivaId, sucursalActiva } = useBranch();
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [tratForm, setTratForm] = useState({
    clienteId: '',
    servicioId: '',
    fecha: hoyBoliviaStr(),
    total: 300,
    cantidadCuotas: 3,
    notas: '',
  });
  const [pagoModal, setPagoModal] = useState(null);
  const [pagoForm, setPagoForm] = useState({ monto: '', metodo: 'qr', notas: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), (snap) => {
      const cl = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .filter((u) => u.role === 'cliente');
      setClientes(cl);
      if (cl.length > 0) setTratForm((f) => (f.clienteId ? f : { ...f, clienteId: cl[0].uid }));
    });
    const u2 = onSnapshot(collection(db, 'servicios'), (snap) => {
      const sv = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.activo !== false);
      setServicios(sv);
      if (sv.length > 0) {
        setTratForm((f) => (f.servicioId ? f : { ...f, servicioId: sv[0].id, total: sv[0].precio }));
      }
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!sucursalActivaId) return;
    const u1 = onSnapshot(
      query(collection(db, 'tratamientos'), where('sucursalId', '==', sucursalActivaId)),
      (snap) => {
        setTratamientos(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
        );
      }
    );
    const u2 = onSnapshot(
      query(collection(db, 'pagos'), where('sucursalId', '==', sucursalActivaId)),
      (snap) => {
        setPagos(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0))
        );
      }
    );
    return () => {
      u1();
      u2();
    };
  }, [sucursalActivaId]);

  async function crearTratamiento(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await callFn('registrarTratamiento', {
        clienteId: tratForm.clienteId,
        sucursalId: sucursalActivaId,
        servicioId: tratForm.servicioId,
        fecha: tratForm.fecha,
        total: Number(tratForm.total),
        cantidadCuotas: Number(tratForm.cantidadCuotas),
        notas: tratForm.notas,
      });
      setMsg('Tratamiento con plan de cuotas registrado correctamente.');
      setTratForm((f) => ({ ...f, notas: '' }));
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmarPago(e) {
    e.preventDefault();
    if (!pagoModal) return;
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await callFn('registrarPago', {
        tratamientoId: pagoModal.id,
        monto: Number(pagoForm.monto),
        metodo: pagoForm.metodo,
        notas: pagoForm.notas,
      });
      setMsg(
        `Pago de ${formatBs(res.monto)} aplicado. Nuevo saldo: ${formatBs(res.saldoRestante)}${
          res.tratamientoCerrado ? ' (Tratamiento cerrado)' : ''
        }.`
      );
      setPagoModal(null);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{msg}</div>}

      {/* Registrar nuevo tratamiento */}
      <form onSubmit={crearTratamiento} className="card-elegant" style={{ padding: '1.4rem', display: 'grid', gap: '0.9rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Plus size={18} /> Registrar tratamiento con plan de cuotas ({sucursalActiva?.nombre})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Cliente</label>
            <select className="form-control" value={tratForm.clienteId} onChange={(e) => setTratForm({ ...tratForm, clienteId: e.target.value })}>
              {clientes.map((c) => (
                <option key={c.uid} value={c.uid}>{c.nombre} ({c.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Servicio</label>
            <select
              className="form-control"
              value={tratForm.servicioId}
              onChange={(e) => {
                const sv = servicios.find((s) => s.id === e.target.value);
                setTratForm({ ...tratForm, servicioId: e.target.value, total: sv?.precio ?? tratForm.total });
              }}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre} ({formatBs(s.precio)})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Total (Bs)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              className="form-control"
              value={tratForm.total}
              onChange={(e) => setTratForm({ ...tratForm, total: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Cuotas (1–24)</label>
            <input
              type="number"
              min="1"
              max="24"
              required
              className="form-control"
              value={tratForm.cantidadCuotas}
              onChange={(e) => setTratForm({ ...tratForm, cantidadCuotas: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Fecha</label>
            <input
              type="date"
              required
              className="form-control"
              value={tratForm.fecha}
              onChange={(e) => setTratForm({ ...tratForm, fecha: e.target.value })}
            />
          </div>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Notas clínicas / observaciones del tratamiento"
          value={tratForm.notas}
          onChange={(e) => setTratForm({ ...tratForm, notas: e.target.value })}
        />

        <div>
          <button type="submit" disabled={loading} className="btn-primary">
            Registrar tratamiento
          </button>
        </div>
      </form>

      {/* Lista de tratamientos */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', marginBottom: '0.9rem' }}>
          Tratamientos en {sucursalActiva?.nombre} ({tratamientos.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Fecha</th>
              <th style={{ padding: '0.75rem' }}>Cliente</th>
              <th style={{ padding: '0.75rem' }}>Servicio</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Saldo</th>
              <th style={{ padding: '0.75rem' }}>Cuotas</th>
              <th style={{ padding: '0.75rem' }}>Cobro</th>
            </tr>
          </thead>
          <tbody>
            {tratamientos.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.75rem' }}>{formatFecha(t.fecha)}</td>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>{t.clienteNombre}</td>
                <td style={{ padding: '0.75rem' }}>{t.servicioNombre}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatBs(t.total)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: t.saldo > 0 ? '#9E610A' : '#156E42' }}>
                  {formatBs(t.saldo)}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {(t.cuotas || []).filter((c) => c.estado === 'pagada').length}/{(t.cuotas || []).length} pagadas
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {t.saldo > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const sig = (t.cuotas || []).find((c) => c.estado !== 'pagada');
                        setPagoModal(t);
                        setPagoForm({ monto: sig ? sig.saldo : t.saldo, metodo: 'qr', notas: '' });
                      }}
                      className="btn-gold"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <CreditCard size={14} /> Registrar pago
                    </button>
                  ) : (
                    <span className="badge badge-success">Cerrado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Últimos pagos */}
      <div className="card-elegant" style={{ padding: '1.35rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', marginBottom: '0.8rem' }}>Últimos pagos recibidos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.7rem' }}>Fecha</th>
              <th style={{ padding: '0.7rem' }}>Cliente</th>
              <th style={{ padding: '0.7rem' }}>Método</th>
              <th style={{ padding: '0.7rem' }}>Cuota #</th>
              <th style={{ padding: '0.7rem', textAlign: 'right' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {pagos.slice(0, 20).map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.7rem' }}>{formatFechaHora(p.fecha)}</td>
                <td style={{ padding: '0.7rem', fontWeight: 600 }}>{p.clienteNombre}</td>
                <td style={{ padding: '0.7rem', textTransform: 'capitalize' }}>{p.metodo}</td>
                <td style={{ padding: '0.7rem' }}>#{p.numeroCuota}</td>
                <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: 800, color: '#156E42' }}>{formatBs(p.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal pago */}
      {pagoModal && (
        <div className="modal-backdrop">
          <form onSubmit={confirmarPago} className="modal-content" style={{ padding: '1.75rem', display: 'grid', gap: '0.9rem' }}>
            <h2 style={{ color: '#C46A86' }}>Registrar pago</h2>
            <div style={{ fontSize: '0.9rem', color: '#6C525F' }}>
              <strong>{pagoModal.clienteNombre}</strong> — {pagoModal.servicioNombre} <br />
              Saldo pendiente actual: <strong style={{ color: '#9E610A' }}>{formatBs(pagoModal.saldo)}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Monto (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={pagoModal.saldo}
                  required
                  className="form-control"
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Método</label>
                <select className="form-control" value={pagoForm.metodo} onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}>
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR Simple</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Nota o referencia de comprobante"
              value={pagoForm.notas}
              onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" onClick={() => setPagoModal(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">Confirmar pago</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
