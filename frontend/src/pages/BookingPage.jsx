import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, callFn } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { extraerMensajeError, formatBs, formatFecha, hoyBoliviaStr } from '../utils/format';
import { Calendar, Clock, CheckCircle2, MapPin, Sparkles, AlertCircle } from 'lucide-react';

export default function BookingPage() {
  const { user } = useAuth();
  const { sucursalesActivas } = useBranch();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [sucursalId, setSucursalId] = useState(
    params.get('sucursalId') || user?.sucursalPreferida || 'villa-fatima'
  );
  const [servicioId, setServicioId] = useState(params.get('servicioId') || '');

  useEffect(() => {
    if (!params.get('sucursalId') && user?.sucursalPreferida) {
      setSucursalId(user.sucursalPreferida);
    }
  }, [params, user?.sucursalPreferida]);
  const [fecha, setFecha] = useState(hoyBoliviaStr());
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [notas, setNotas] = useState('');

  const [dispData, setDispData] = useState(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'servicios'), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.activo !== false)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setServicios(items);
    });
    return () => unsub();
  }, []);

  const serviciosDisponibles = useMemo(() => {
    return servicios.filter((s) => !Array.isArray(s.sucursales) || s.sucursales.includes(sucursalId));
  }, [servicios, sucursalId]);

  useEffect(() => {
    if (serviciosDisponibles.length > 0 && !serviciosDisponibles.some((s) => s.id === servicioId)) {
      setServicioId(serviciosDisponibles[0].id);
    }
  }, [serviciosDisponibles, servicioId]);

  const servicioActual = servicios.find((s) => s.id === servicioId);
  const sucursalActual = sucursalesActivas.find((s) => s.id === sucursalId);

  async function cargarDisponibilidad() {
    if (!sucursalId || !servicioId || !fecha) return;
    setCargandoSlots(true);
    setError('');
    setHoraSeleccionada('');
    try {
      const data = await callFn('disponibilidad', { sucursalId, servicioId, fecha });
      setDispData(data);
    } catch (err) {
      setDispData(null);
      setError(extraerMensajeError(err));
    } finally {
      setCargandoSlots(false);
    }
  }

  useEffect(() => {
    cargarDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalId, servicioId, fecha]);

  async function confirmarReserva(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/reservar' } });
      return;
    }
    if (!horaSeleccionada) {
      setError('Selecciona un horario disponible.');
      return;
    }

    setConfirmando(true);
    setError('');
    try {
      const cita = await callFn('crearCita', {
        sucursalId,
        servicioId,
        fecha,
        hora: horaSeleccionada,
        canal: 'web',
        notas,
      });
      setExito(cita);
    } catch (err) {
      setError(extraerMensajeError(err));
      // Refrescar horarios en caso de conflicto simultáneo de cupo
      await cargarDisponibilidad();
    } finally {
      setConfirmando(false);
    }
  }

  if (exito) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '620px' }}>
        <div className="card-elegant card-gold-border" style={{ padding: '2.4rem', textAlign: 'center' }}>
          <CheckCircle2 size={54} color="#156E42" style={{ marginBottom: '0.8rem' }} />
          <h1 style={{ color: '#C46A86', marginBottom: '0.5rem' }}>¡Cita reservada con éxito!</h1>
          <p style={{ color: '#6C525F', marginBottom: '1.5rem' }}>
            Tu cupo fue asegurado de forma transaccional en nuestra agenda.
          </p>

          <div
            style={{
              backgroundColor: '#FFF9F6',
              borderRadius: '14px',
              padding: '1.2rem',
              border: '1px solid #F6C6D3',
              textAlign: 'left',
              marginBottom: '1.5rem',
              display: 'grid',
              gap: '0.45rem',
              fontSize: '0.93rem',
            }}
          >
            <div><strong>Sucursal:</strong> {exito.sucursalNombre}</div>
            <div><strong>Servicio:</strong> {exito.servicioNombre}</div>
            <div><strong>Fecha:</strong> {formatFecha(exito.fecha)}</div>
            <div><strong>Horario:</strong> {exito.hora} – {exito.horaFin} ({exito.duracionMin} min)</div>
            <div><strong>Precio referencial:</strong> {formatBs(exito.precio)}</div>
            <div><strong>Estado:</strong> <span className="badge badge-warning">Pendiente</span></div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/mis-citas" className="btn-primary">Ver mis citas</Link>
            <button type="button" onClick={() => { setExito(null); cargarDisponibilidad(); }} className="btn-secondary">
              Agendar otra cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '920px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-mauve"><Sparkles size={13} /> Reserva en tiempo real</span>
        <h1 style={{ fontSize: '2.2rem', color: '#C46A86', marginTop: '0.4rem' }}>Agendar Cita</h1>
        <p style={{ color: '#6C525F' }}>
          1. Elige sucursal → 2. Selecciona servicio → 3. Escoge fecha → 4. Elige horario libre y confirma.
        </p>
      </div>

      {!user && (
        <div
          className="card-elegant"
          style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderColor: '#B8860B' }}
        >
          <span style={{ fontSize: '0.92rem' }}>
            Puedes consultar horarios libremente, pero necesitas <strong>iniciar sesión</strong> para confirmar tu reserva.
          </span>
          <Link to="/login" state={{ from: '/reservar' }} className="btn-gold" style={{ padding: '0.5rem 1.1rem', fontSize: '0.86rem' }}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={confirmarReserva} className="card-elegant" style={{ padding: '1.8rem', display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <MapPin size={14} style={{ verticalAlign: 'middle' }} /> 1. Sucursal
            </label>
            <select className="form-control" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              {sucursalesActivas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudad})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              2. Servicio
            </label>
            <select className="form-control" value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
              {serviciosDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {formatBs(s.precio)} ({s.duracionMin} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <Calendar size={14} style={{ verticalAlign: 'middle' }} /> 3. Fecha (máx. 60 días)
            </label>
            <input
              type="date"
              className="form-control"
              min={hoyBoliviaStr()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        {/* Horarios disponibles */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.92rem', fontWeight: 800 }}>
              <Clock size={15} style={{ verticalAlign: 'middle' }} /> 4. Horarios disponibles para el {formatFecha(fecha)}
            </label>
            {sucursalActual && (
              <span style={{ fontSize: '0.8rem', color: '#6C525F' }}>
                Capacidad: {sucursalActual.capacidad || 2} especialistas simultáneos
              </span>
            )}
          </div>

          {cargandoSlots ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6C525F' }}>Calculando disponibilidad...</div>
          ) : dispData && !dispData.valido ? (
            <div className="badge badge-warning" style={{ display: 'block', padding: '0.9rem 1rem', borderRadius: '12px' }}>
              {dispData.motivo}
            </div>
          ) : dispData?.slots?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: '0.6rem' }}>
              {dispData.slots.map((slot) => {
                const selected = horaSeleccionada === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={!slot.disponible}
                    onClick={() => setHoraSeleccionada(slot.hora)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '12px',
                      border: selected
                        ? '2px solid #9F3E5E'
                        : slot.disponible
                        ? '1.5px solid #E5B9C7'
                        : '1px solid #E5E7EB',
                      backgroundColor: selected
                        ? '#C46A86'
                        : slot.disponible
                        ? '#FFFFFF'
                        : '#F3F4F6',
                      color: selected ? '#FFFFFF' : slot.disponible ? '#2C1622' : '#9CA3AF',
                      cursor: slot.disponible ? 'pointer' : 'not-allowed',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    <div>{slot.hora}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>
                      {slot.disponible ? `${slot.disponibles}/${slot.capacidad} libre` : slot.pasado ? 'Pasado' : 'Lleno'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '1rem', color: '#6C525F' }}>No hay horarios disponibles para esta combinación.</div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Notas opcionales (alergias, preferencias)
          </label>
          <textarea
            rows={2}
            className="form-control"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Opcional..."
          />
        </div>

        {/* Resumen */}
        <div
          style={{
            backgroundColor: '#FFF9F6',
            border: '1.5px solid #F6C6D3',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: '#6C525F' }}>Resumen de reserva</div>
            <div style={{ fontWeight: 800, color: '#2C1622' }}>
              {servicioActual?.nombre || '—'} • {sucursalActual?.nombre || '—'}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#9F3E5E', fontWeight: 700 }}>
              {formatFecha(fecha)} {horaSeleccionada ? `a las ${horaSeleccionada}` : '(elige un horario)'} — {formatBs(servicioActual?.precio || 0)}
            </div>
          </div>

          <button type="submit" disabled={confirmando || !horaSeleccionada} className="btn-primary">
            {confirmando ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
        </div>
      </form>
    </div>
  );
}
