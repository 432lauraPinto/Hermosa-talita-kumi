import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, callFn } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import {
  etiquetaEstadoCita,
  extraerMensajeError,
  formatBs,
  formatFecha,
  hoyBoliviaStr,
} from '../../utils/format';
import { Plus, Calendar, Clock, Phone } from 'lucide-react';

export default function AgendaPage() {
  const { sucursalActivaId, sucursalActiva } = useBranch();
  const [fechaFiltro, setFechaFiltro] = useState(hoyBoliviaStr());
  const [verTodasFechas, setVerTodasFechas] = useState(false);
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Modal nueva cita telefónica/WhatsApp/presencial
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteTelefono: '+591 ',
    servicioId: '',
    fecha: hoyBoliviaStr(),
    hora: '10:00',
    canal: 'whatsapp',
    notas: '',
  });
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!sucursalActivaId) return;
    const constraints = [where('sucursalId', '==', sucursalActivaId)];
    if (!verTodasFechas && fechaFiltro) {
      constraints.push(where('fecha', '==', fechaFiltro));
    }
    const q = query(collection(db, 'citas'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
      setCitas(items);
    });
    return () => unsub();
  }, [sucursalActivaId, fechaFiltro, verTodasFechas]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'servicios'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.activo !== false);
      setServicios(list);
      if (list.length > 0) {
        setForm((f) => (f.servicioId ? f : { ...f, servicioId: list[0].id }));
      }
    });
    const u2 = onSnapshot(collection(db, 'users'), (snap) => {
      setClientes(
        snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u) => u.role === 'cliente')
      );
    });
    return () => {
      u1();
      u2();
    };
  }, []);

  async function cambiarEstado(citaId, nuevoEstado) {
    setError('');
    setMsg('');
    try {
      await callFn('cambiarEstadoCita', { citaId, nuevoEstado });
      setMsg(`Estado actualizado a "${nuevoEstado}".`);
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function crearCitaManual(e) {
    e.preventDefault();
    setCreando(true);
    setError('');
    setMsg('');
    try {
      await callFn('crearCita', {
        sucursalId: sucursalActivaId,
        servicioId: form.servicioId,
        clienteId: form.clienteId || null,
        clienteNombre: form.clienteId ? null : form.clienteNombre,
        clienteTelefono: form.clienteId ? null : form.clienteTelefono,
        fecha: form.fecha,
        hora: form.hora,
        canal: form.canal,
        notas: form.notas,
      });
      setMsg('Cita registrada correctamente en la agenda.');
      setModalOpen(false);
      setFechaFiltro(form.fecha);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCreando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="card-elegant"
        style={{ padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', color: '#6C525F' }}>Filtrar fecha</label>
            <input
              type="date"
              className="form-control"
              disabled={verTodasFechas}
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              style={{ padding: '0.45rem 0.75rem' }}
            />
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.86rem', fontWeight: 700, marginTop: '1rem' }}>
            <input
              type="checkbox"
              checked={verTodasFechas}
              onChange={(e) => setVerTodasFechas(e.target.checked)}
            />
            Ver todas las fechas de {sucursalActiva?.nombre}
          </label>
        </div>

        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary" style={{ padding: '0.65rem 1.2rem' }}>
          <Plus size={16} /> Alta cita (WhatsApp / Presencial)
        </button>
      </div>

      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{msg}</div>}

      <div className="card-elegant" style={{ overflowX: 'auto' }}>
        {citas.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6C525F' }}>
            No hay citas para mostrar en {sucursalActiva?.nombre} {!verTodasFechas && `el ${formatFecha(fechaFiltro)}`}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
                <th style={{ padding: '0.8rem' }}>Fecha y Hora</th>
                <th style={{ padding: '0.8rem' }}>Cliente</th>
                <th style={{ padding: '0.8rem' }}>Servicio</th>
                <th style={{ padding: '0.8rem' }}>Canal</th>
                <th style={{ padding: '0.8rem' }}>Estado</th>
                <th style={{ padding: '0.8rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => {
                const badge = etiquetaEstadoCita(c.estado);
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                    <td style={{ padding: '0.8rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} color="#C46A86" /> {formatFecha(c.fecha)}
                      </div>
                      <div style={{ color: '#6C525F', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {c.hora} – {c.horaFin} ({c.duracionMin}m)
                      </div>
                    </td>
                    <td style={{ padding: '0.8rem' }}>
                      <div style={{ fontWeight: 700 }}>{c.clienteNombre}</div>
                      {c.clienteTelefono && (
                        <div style={{ fontSize: '0.78rem', color: '#6C525F', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {c.clienteTelefono}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem' }}>
                      <div style={{ fontWeight: 600 }}>{c.servicioNombre}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9F3E5E', fontWeight: 700 }}>{formatBs(c.precio)}</div>
                    </td>
                    <td style={{ padding: '0.8rem', textTransform: 'capitalize' }}>{c.canal}</td>
                    <td style={{ padding: '0.8rem' }}>
                      <span className={badge.clase}>{badge.texto}</span>
                    </td>
                    <td style={{ padding: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {c.estado === 'pendiente' && (
                          <button
                            type="button"
                            onClick={() => cambiarEstado(c.id, 'confirmada')}
                            className="badge badge-success"
                            style={{ cursor: 'pointer' }}
                          >
                            Confirmar
                          </button>
                        )}
                        {['pendiente', 'confirmada'].includes(c.estado) && (
                          <>
                            <button
                              type="button"
                              onClick={() => cambiarEstado(c.id, 'completada')}
                              className="badge badge-gold"
                              style={{ cursor: 'pointer' }}
                            >
                              Completada
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstado(c.id, 'no_asistio')}
                              className="badge badge-warning"
                              style={{ cursor: 'pointer' }}
                            >
                              No asistió
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstado(c.id, 'cancelada')}
                              className="badge badge-danger"
                              style={{ cursor: 'pointer' }}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Alta Cita */}
      {modalOpen && (
        <div className="modal-backdrop">
          <form onSubmit={crearCitaManual} className="modal-content" style={{ padding: '1.75rem', display: 'grid', gap: '0.9rem' }}>
            <h2 style={{ color: '#C46A86' }}>Registrar cita — {sucursalActiva?.nombre}</h2>

            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Cliente registrado (opcional)
              </label>
              <select
                className="form-control"
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              >
                <option value="">-- Cliente presencial / WhatsApp sin cuenta --</option>
                {clientes.map((cl) => (
                  <option key={cl.uid} value={cl.uid}>
                    {cl.nombre} ({cl.telefono || cl.email})
                  </option>
                ))}
              </select>
            </div>

            {!form.clienteId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Nombre del cliente</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={form.clienteNombre}
                    onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.clienteTelefono}
                    onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Servicio</label>
              <select
                className="form-control"
                value={form.servicioId}
                onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
              >
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({formatBs(s.precio)}, {s.duracionMin}m)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Fecha</label>
                <input
                  type="date"
                  required
                  min={hoyBoliviaStr()}
                  className="form-control"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Hora (24 h)</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Canal</label>
                <select
                  className="form-control"
                  value={form.canal}
                  onChange={(e) => setForm({ ...form, canal: e.target.value })}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="presencial">Presencial</option>
                  <option value="web">Web</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '0.3rem' }}>Notas</label>
              <input
                type="text"
                className="form-control"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={creando} className="btn-primary">
                {creando ? 'Registrando...' : 'Guardar cita'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
