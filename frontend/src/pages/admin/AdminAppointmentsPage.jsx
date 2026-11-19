import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Clock, Check, X, CheckCircle, AlertCircle, Sparkles, Filter, Search } from 'lucide-react';

export default function AdminAppointmentsPage({ onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Modal to register treatment directly when completing
  const [completingApp, setCompletingApp] = useState(null);
  const [professionalName, setProfessionalName] = useState('Dra. Valeria Montes');
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    api.getBranches().then(res => res.branches && setBranches(res.branches)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter, branchFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (branchFilter) params.branch_id = branchFilter;
      const res = await api.getAppointments(params);
      if (res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error('Error al cargar citas admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.updateAppointment(id, { status: newStatus });
      if (res.success) {
        setActionMsg({ type: 'success', text: `Cita #${id} actualizada a ${newStatus}.` });
        fetchAppointments();
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al actualizar estado.' });
    }
  };

  const handleOpenCompleteModal = (app) => {
    setCompletingApp(app);
    setClinicalNotes(`Procedimiento de ${app.service_name} completado con éxito. Buena respuesta dérmica.`);
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completingApp) return;

    try {
      // 1. Crear registro en treatment_history (calcula automáticamente próxima sesión)
      const resHist = await api.createTreatmentRecord({
        client_id: completingApp.client_id,
        appointment_id: completingApp.id,
        treatment_name: completingApp.service_name,
        treatment_type: completingApp.service_type || 'FACIAL',
        date: completingApp.date,
        observations: clinicalNotes,
        professional: professionalName,
        status: 'COMPLETADO'
      });

      // 2. Marcar la cita como REALIZADA
      await api.updateAppointment(completingApp.id, { status: 'REALIZADA' });

      setActionMsg({
        type: 'success',
        text: `¡Tratamiento completado! Próxima sesión sugerida por regla: ${resHist.suggestedNextSession} (${resHist.ruleApplied}).`
      });

      setCompletingApp(null);
      fetchAppointments();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al completar tratamiento.' });
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => onNavigate('admin-dashboard')} style={{ fontSize: '0.85rem', color: 'var(--color-mauve)', fontWeight: '600', marginBottom: '0.4rem' }}>
            ← Volver al Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'serif', fontWeight: '800', color: 'var(--color-text-dark)' }}>
            Gestión y Control de Reservas
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Confirma turnos, gestiona cancelaciones y registra sesiones como realizadas.
          </p>
        </div>

        <button onClick={() => onNavigate('booking')} className="btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}>
          <Calendar size={16} /> Agendar Cita Manual
        </button>
      </div>

      {actionMsg.text && (
        <div style={{
          backgroundColor: actionMsg.type === 'error' ? '#FFEBEE' : '#E8F5E9',
          color: actionMsg.type === 'error' ? '#C62828' : '#2E7D32',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          {actionMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={18} color="var(--color-text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Filtrar Estado:</span>

          {['', 'PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: '600',
                backgroundColor: statusFilter === st ? 'var(--color-mauve)' : 'var(--color-floral)',
                color: statusFilter === st ? '#FFFFFF' : 'var(--color-text-dark)',
                border: '1px solid var(--color-border)'
              }}
            >
              {st || 'TODAS'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Sucursal:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="">Todas las Sedes</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Fecha:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} style={{ fontSize: '0.8rem', color: 'var(--color-mauve)', textDecoration: 'underline' }}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.5rem' }} />
          Cargando citas...
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No se encontraron reservas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Sucursal</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cliente</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Servicio</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha & Horario</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{app.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
                      📍 {app.branch_name || 'Sede Central'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-dark)' }}>{app.client_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{app.client_phone || app.client_email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600' }}>{app.service_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>Bs {app.service_price} ({app.service_duration}m)</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600' }}>{app.date}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {app.time} {app.end_time ? `hasta ${app.end_time}` : ''} hrs
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge badge-status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {app.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CONFIRMADA')}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          title="Confirmar Cita"
                        >
                          <Check size={14} /> Confirmar
                        </button>
                      )}

                      {app.status === 'CONFIRMADA' && (
                        <button
                          onClick={() => handleOpenCompleteModal(app)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            backgroundColor: '#2E7D32',
                            color: '#FFFFFF',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Marcar como Realizada y Registrar Sesión"
                        >
                          <CheckCircle size={14} /> Registrar Atención
                        </button>
                      )}

                      {app.status !== 'CANCELADA' && app.status !== 'REALIZADA' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CANCELADA')}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.78rem',
                            color: '#C62828',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid #FFCDD2',
                            backgroundColor: '#FFEBEE'
                          }}
                          title="Cancelar Cita"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Completar Tratamiento y Calcular Regla de Próxima Sesión */}
      {completingApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)', marginBottom: '0.5rem' }}>
              Registrar Tratamiento Realizado
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Cliente: <strong>{completingApp.client_name}</strong> • Servicio: <strong>{completingApp.service_name}</strong>
            </p>

            <form onSubmit={handleConfirmCompletion}>
              <div className="form-group">
                <label className="form-label">Profesional Responsable</label>
                <input
                  type="text"
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones Clínicas / Resultados Dérmicos</label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows="3"
                  className="form-control"
                  required
                />
              </div>

              <div style={{
                backgroundColor: 'var(--color-floral)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--color-gold)',
                marginBottom: '1.5rem'
              }}>
                ℹ️ La fecha para la próxima sesión se calculará matemáticamente con base en la regla del tratamiento configurada en el sistema.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setCompletingApp(null)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.2rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.4rem' }}
                >
                  Guardar y Completar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
