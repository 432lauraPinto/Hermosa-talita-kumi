import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, callFn } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import {
  etiquetaEstadoCita,
  extraerMensajeError,
  formatBs,
  formatFecha,
  hoyBoliviaStr,
} from '../utils/format';
import { extraerDigitosLocalesBolivia } from '../utils/validators';
import { Calendar, Clock, RefreshCw, XCircle, Plus, User, Mail } from 'lucide-react';

export default function MyAppointmentsPage() {
  const { user, actualizarPerfilPropio, resendVerificationEmail } = useAuth();
  const { sucursalesActivas } = useBranch();
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Modal reprogramar
  const [editCita, setEditCita] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [slots, setSlots] = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Perfil propio (sin tipo de piel ni alergias)
  const [perfilForm, setPerfilForm] = useState({
    nombre: user?.nombre || '',
    telefonoLocal: extraerDigitosLocalesBolivia(user?.telefono || ''),
    sucursalPreferida: user?.sucursalPreferida || '',
    fechaNacimiento: user?.fechaNacimiento || '',
    aceptaWhatsapp: user?.aceptaWhatsapp !== false,
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [reenviandoVerif, setReenviandoVerif] = useState(false);

  useEffect(() => {
    setPerfilForm({
      nombre: user?.nombre || '',
      telefonoLocal: extraerDigitosLocalesBolivia(user?.telefono || ''),
      sucursalPreferida: user?.sucursalPreferida || '',
      fechaNacimiento: user?.fechaNacimiento || '',
      aceptaWhatsapp: user?.aceptaWhatsapp !== false,
    });
  }, [user?.nombre, user?.telefono, user?.sucursalPreferida, user?.fechaNacimiento, user?.aceptaWhatsapp]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'citas'), where('clienteId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
      setCitas(items);
    });
    return () => unsub();
  }, [user?.uid]);

  async function abrirReprogramar(cita) {
    setEditCita(cita);
    setNuevaFecha(cita.fecha);
    setNuevaHora('');
    setSlots([]);
    setError('');
    await consultarSlotsReprog(cita, cita.fecha);
  }

  async function consultarSlotsReprog(cita, fechaObj) {
    setCargandoSlots(true);
    try {
      const data = await callFn('disponibilidad', {
        sucursalId: cita.sucursalId,
        servicioId: cita.servicioId,
        fecha: fechaObj,
        excluirCitaId: cita.id,
      });
      setSlots(data.slotsDisponibles || []);
    } catch (err) {
      setSlots([]);
      setError(extraerMensajeError(err));
    } finally {
      setCargandoSlots(false);
    }
  }

  async function confirmarReprogramacion() {
    if (!editCita || !nuevaFecha || !nuevaHora) return;
    setProcesando(true);
    setError('');
    try {
      await callFn('modificarCita', {
        citaId: editCita.id,
        fecha: nuevaFecha,
        hora: nuevaHora,
      });
      setMsg('Tu cita fue reprogramada correctamente.');
      setEditCita(null);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  }

  async function handleCancelar(cita) {
    if (
      !window.confirm(
        `¿Deseas cancelar tu cita de ${cita.servicioNombre} del ${formatFecha(cita.fecha)} a las ${cita.hora}?`
      )
    ) {
      return;
    }
    setError('');
    setMsg('');
    try {
      await callFn('cancelarCita', { citaId: cita.id, motivo: 'Cancelada por el cliente desde la web' });
      setMsg('Cita cancelada correctamente.');
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function handleGuardarPerfil(e) {
    e.preventDefault();
    setGuardandoPerfil(true);
    setError('');
    setMsg('');
    try {
      await actualizarPerfilPropio({
        nombre: perfilForm.nombre,
        telefono: perfilForm.telefonoLocal,
        sucursalPreferida: perfilForm.sucursalPreferida || null,
        fechaNacimiento: perfilForm.fechaNacimiento || null,
        aceptaWhatsapp: perfilForm.aceptaWhatsapp,
      });
      setMsg('Tus datos de perfil fueron actualizados correctamente.');
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function handleReenviarVerificacion() {
    setReenviandoVerif(true);
    setError('');
    setMsg('');
    try {
      await resendVerificationEmail();
      setMsg('Enviamos un nuevo enlace de verificación a tu correo electrónico.');
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setReenviandoVerif(false);
    }
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', color: '#C46A86' }}>Mis Citas</h1>
          <p style={{ color: '#6C525F' }}>
            Reprograma o cancela tus reservas (recuerda hacerlo con 2 horas o más de anticipación).
          </p>
        </div>
        <Link to="/reservar" className="btn-primary">
          <Plus size={17} /> Nueva cita
        </Link>
      </div>

      {/* Aviso no bloqueante de verificación de correo */}
      {user && !user.emailVerified && (
        <div
          className="card-elegant"
          style={{
            padding: '0.9rem 1.2rem',
            marginBottom: '1.25rem',
            borderColor: '#E5C37A',
            backgroundColor: '#FFFDF6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.88rem', color: '#6C525F', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Mail size={16} color="#B8860B" /> Tu correo <strong>{user.email}</strong> aún no está verificado.
          </span>
          <button
            type="button"
            disabled={reenviandoVerif}
            onClick={handleReenviarVerificacion}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            {reenviandoVerif ? 'Enviando...' : 'Reenviar verificación'}
          </button>
        </div>
      )}

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {msg && (
        <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(290px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Lista de citas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {citas.length === 0 ? (
            <div className="card-elegant" style={{ padding: '2.5rem', textAlign: 'center', color: '#6C525F' }}>
              Aún no tienes citas registradas.{' '}
              <Link to="/reservar" style={{ color: '#C46A86', fontWeight: 800 }}>
                Reserva tu primera sesión
              </Link>
              .
            </div>
          ) : (
            citas.map((c) => {
              const badge = etiquetaEstadoCita(c.estado);
              const editable = ['pendiente', 'confirmada'].includes(c.estado);
              return (
                <div key={c.id} className="card-elegant" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <span className={badge.clase}>{badge.texto}</span>
                      <h3 style={{ fontSize: '1.2rem', marginTop: '0.4rem' }}>{c.servicioNombre}</h3>
                      <div style={{ color: '#6C525F', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                        Sucursal: <strong>{c.sucursalNombre}</strong> • {formatBs(c.precio)}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#9F3E5E' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={15} /> {formatFecha(c.fecha)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={15} /> {c.hora} – {c.horaFin || ''} ({c.duracionMin} min)
                        </span>
                      </div>
                    </div>

                    {editable && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => abrirReprogramar(c)}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 0.9rem', fontSize: '0.84rem' }}
                        >
                          <RefreshCw size={14} /> Reprogramar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelar(c)}
                          style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: '999px',
                            backgroundColor: '#FEECEB',
                            color: '#B52825',
                            border: '1.5px solid #FCA8A6',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <XCircle size={14} /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mi Perfil (datos personales permitidos) */}
        <form onSubmit={handleGuardarPerfil} className="card-elegant" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#C46A86', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <User size={18} /> Mi perfil
          </h3>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Nombre y apellido</label>
            <input
              type="text"
              required
              className="form-control"
              value={perfilForm.nombre}
              onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Celular WhatsApp (Bolivia)</label>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.7rem',
                  borderRadius: '12px',
                  border: '2px solid #E5B9C7',
                  backgroundColor: '#FDF1F4',
                  fontWeight: 800,
                  color: '#9F3E5E',
                  fontSize: '0.85rem',
                }}
              >
                +591
              </span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={8}
                className="form-control"
                value={perfilForm.telefonoLocal}
                onChange={(e) =>
                  setPerfilForm({ ...perfilForm, telefonoLocal: e.target.value.replace(/\D/g, '').slice(0, 8) })
                }
                placeholder="77197857"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Sucursal preferida</label>
            <select
              className="form-control"
              value={perfilForm.sucursalPreferida}
              onChange={(e) => setPerfilForm({ ...perfilForm, sucursalPreferida: e.target.value })}
            >
              <option value="">Sin preferencia</option>
              {sucursalesActivas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudad})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>Fecha de nacimiento (opcional)</label>
            <input
              type="date"
              className="form-control"
              value={perfilForm.fechaNacimiento}
              onChange={(e) => setPerfilForm({ ...perfilForm, fechaNacimiento: e.target.value })}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#4A3B43', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={perfilForm.aceptaWhatsapp}
              onChange={(e) => setPerfilForm({ ...perfilForm, aceptaWhatsapp: e.target.checked })}
            />
            <span>Recibir recordatorios de citas por WhatsApp</span>
          </label>
          <button type="submit" disabled={guardandoPerfil} className="btn-secondary" style={{ width: '100%' }}>
            {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Modal Reprogramar */}
      {editCita && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '1.8rem' }}>
            <h2 style={{ color: '#C46A86', marginBottom: '0.5rem' }}>Reprogramar cita</h2>
            <p style={{ color: '#6C525F', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {editCita.servicioNombre} — {editCita.sucursalNombre}
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Nueva fecha</label>
              <input
                type="date"
                className="form-control"
                min={hoyBoliviaStr()}
                value={nuevaFecha}
                onChange={(e) => {
                  setNuevaFecha(e.target.value);
                  setNuevaHora('');
                  consultarSlotsReprog(editCita, e.target.value);
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Horarios libres</label>
              {cargandoSlots ? (
                <div style={{ color: '#6C525F' }}>Buscando horarios...</div>
              ) : slots.length === 0 ? (
                <div className="badge badge-warning">No hay horarios libres en esta fecha.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {slots.map((s) => (
                    <button
                      key={s.hora}
                      type="button"
                      onClick={() => setNuevaHora(s.hora)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '10px',
                        border: nuevaHora === s.hora ? '2px solid #9F3E5E' : '1px solid #E5B9C7',
                        backgroundColor: nuevaHora === s.hora ? '#C46A86' : '#FFF',
                        color: nuevaHora === s.hora ? '#FFF' : '#2C1622',
                        fontWeight: 700,
                      }}
                    >
                      {s.hora}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" onClick={() => setEditCita(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesando || !nuevaHora}
                onClick={confirmarReprogramacion}
                className="btn-primary"
              >
                {procesando ? 'Guardando...' : 'Confirmar nuevo horario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
