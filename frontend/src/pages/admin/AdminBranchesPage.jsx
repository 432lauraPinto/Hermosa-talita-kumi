import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  MapPin, Phone, MessageCircle, Clock, Edit, Check, X, Plus, 
  ExternalLink, Calendar, AlertCircle, CheckCircle2, Shield 
} from 'lucide-react';

export default function AdminBranchesPage({ onNavigate }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Modal para editar datos de sucursal
  const [editingBranch, setEditingBranch] = useState(null);

  // Modal para configurar servicios habilitados en la sucursal
  const [servicesModalBranch, setServicesModalBranch] = useState(null);
  const [branchServices, setBranchServices] = useState([]);
  const [savingServices, setSavingServices] = useState(false);

  // Modal para gestionar excepciones de calendario (días cerrados / feriados)
  const [exceptionsModalBranch, setExceptionsModalBranch] = useState(null);
  const [branchExceptions, setBranchExceptions] = useState([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');
  const [newExceptionIsClosed, setNewExceptionIsClosed] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await api.getBranches();
      if (res.success) {
        setBranches(res.branches || []);
      }
    } catch (e) {
      console.error('Error cargando sucursales:', e);
      setFeedback({ type: 'error', text: 'Error al cargar las sucursales.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;

    try {
      const res = await api.updateBranch(editingBranch.id, editingBranch);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Sucursal actualizada exitosamente.' });
        setEditingBranch(null);
        loadBranches();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al actualizar sucursal.' });
    }
  };

  // Abrir modal de servicios
  const handleOpenServices = async (branch) => {
    setServicesModalBranch(branch);
    try {
      const res = await api.getBranchServices(branch.id);
      if (res.success) {
        setBranchServices(res.services || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleService = (serviceId) => {
    setBranchServices(prev => prev.map(s => 
      s.id === serviceId ? { ...s, isAvailableInBranch: !s.isAvailableInBranch } : s
    ));
  };

  const handleSaveBranchServices = async () => {
    if (!servicesModalBranch) return;
    try {
      setSavingServices(true);
      const enabledIds = branchServices.filter(s => s.isAvailableInBranch).map(s => s.id);
      const res = await api.updateBranchServices(servicesModalBranch.id, enabledIds);
      if (res.success) {
        setFeedback({ type: 'success', text: `Servicios de ${servicesModalBranch.name} guardados correctamente.` });
        setServicesModalBranch(null);
      }
    } catch (e) {
      setFeedback({ type: 'error', text: 'Error al guardar servicios de la sucursal.' });
    } finally {
      setSavingServices(false);
    }
  };

  // Abrir modal de excepciones
  const handleOpenExceptions = async (branch) => {
    setExceptionsModalBranch(branch);
    setNewExceptionDate('');
    setNewExceptionReason('');
    try {
      const res = await api.getBranchExceptions(branch.id);
      if (res.success) {
        setBranchExceptions(res.exceptions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    if (!newExceptionDate || !exceptionsModalBranch) return;

    try {
      const res = await api.addBranchException(exceptionsModalBranch.id, {
        date: newExceptionDate,
        is_closed: newExceptionIsClosed ? 1 : 0,
        reason: newExceptionReason || 'Feriado / Mantenimiento'
      });
      if (res.success) {
        const updated = await api.getBranchExceptions(exceptionsModalBranch.id);
        setBranchExceptions(updated.exceptions || []);
        setNewExceptionDate('');
        setNewExceptionReason('');
      }
    } catch (e) {
      alert('Error al agregar excepción: ' + e.message);
    }
  };

  const handleDeleteException = async (exceptionId) => {
    if (!exceptionsModalBranch) return;
    try {
      await api.deleteBranchException(exceptionsModalBranch.id, exceptionId);
      setBranchExceptions(prev => prev.filter(x => x.id !== exceptionId));
    } catch (e) {
      alert('Error al eliminar excepción.');
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--color-gold-deep)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Panel de Control Centralizado
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Gestión de las 3 Sucursales — Hermosa Talita Kumi
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Administra direcciones, horarios, Google Maps, catálogo de servicios por sede y excepciones de calendario.
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="btn-secondary"
          style={{ padding: '0.65rem 1.4rem' }}
        >
          ← Volver al Dashboard
        </button>
      </div>

      {feedback.text && (
        <div style={{
          backgroundColor: feedback.type === 'error' ? '#FFEBEE' : '#E8F5E9',
          color: feedback.type === 'error' ? '#C62828' : '#2E7D32',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '700'
        }}>
          {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Cargando configuración de sucursales...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {branches.map(b => (
            <div key={b.id} className="card-elegant card-gold-border" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge badge-gold">{b.code} • {b.city}</span>
                <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'}`}>
                  {b.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '0.75rem' }}>
                {b.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--color-text-dark)', marginBottom: '1.5rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={17} color="var(--color-mauve)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Dirección:</strong> {b.address}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={17} color="var(--color-gold-deep)" style={{ flexShrink: 0 }} />
                  <div><strong>Horarios:</strong> {b.opening_hours} ({b.open_time} a {b.close_time})</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={17} color="var(--color-mauve)" style={{ flexShrink: 0 }} />
                  <div><strong>Teléfono:</strong> {b.phone || 'No registrado'}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={17} color="#25D366" style={{ flexShrink: 0 }} />
                  <div><strong>WhatsApp:</strong> {b.whatsapp || 'No registrado'}</div>
                </div>
              </div>

              {/* Botones de configuración */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                <button
                  onClick={() => setEditingBranch({ ...b })}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}
                >
                  <Edit size={15} /> Editar Sede
                </button>

                <button
                  onClick={() => handleOpenServices(b)}
                  className="btn-gold"
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem' }}
                >
                  Tratamientos
                </button>

                <button
                  onClick={() => handleOpenExceptions(b)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
                  title="Gestionar días cerrados o feriados"
                >
                  <Calendar size={15} /> Excepciones
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL DE EDICIÓN DE SUCURSAL
          ======================================================== */}
      {editingBranch && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)' }}>
                Editar Sucursal: {editingBranch.code}
              </h3>
              <button onClick={() => setEditingBranch(null)} style={{ padding: '0.4rem' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Nombre Comercial de la Sede:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Ciudad:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingBranch.city}
                    onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Zona / Barrio:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingBranch.zone}
                    onChange={(e) => setEditingBranch({ ...editingBranch, zone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Dirección Completa:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Teléfono Fijo:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingBranch.phone || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>WhatsApp de Atención:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingBranch.whatsapp || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Hora Apertura:</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingBranch.open_time || '08:30'}
                    onChange={(e) => setEditingBranch({ ...editingBranch, open_time: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Hora Cierre:</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingBranch.close_time || '19:30'}
                    onChange={(e) => setEditingBranch({ ...editingBranch, close_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>URL Google Maps (GPS):</label>
                <input
                  type="url"
                  className="form-control"
                  value={editingBranch.google_maps_url || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, google_maps_url: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>URL Embed para Iframe:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingBranch.map_embed_url || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, map_embed_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE SERVICIOS POR SUCURSAL
          ======================================================== */}
      {servicesModalBranch && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-mauve-deep)' }}>
                  Tratamientos en {servicesModalBranch.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Habilita o desactiva qué tratamientos se ofrecen en esta sede específica.
                </p>
              </div>
              <button onClick={() => setServicesModalBranch(null)}>
                <X size={22} />
              </button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {branchServices.map(svc => (
                <div
                  key={svc.id}
                  onClick={() => handleToggleService(svc.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-border)',
                    backgroundColor: svc.isAvailableInBranch ? '#FFF5F8' : '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{svc.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {svc.type} • Bs {svc.price} • {svc.duration} min
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={svc.isAvailableInBranch}
                    onChange={() => {}}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-mauve-deep)' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setServicesModalBranch(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingServices}
                onClick={handleSaveBranchServices}
                className="btn-primary"
              >
                {savingServices ? 'Guardando...' : 'Guardar Servicios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE EXCEPCIONES DE CALENDARIO (FERIADOS / CIERRES)
          ======================================================== */}
      {exceptionsModalBranch && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-mauve-deep)' }}>
                  Excepciones de Calendario: {exceptionsModalBranch.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Configura días feriados o cierres no programados para bloquear reservas.
                </p>
              </div>
              <button onClick={() => setExceptionsModalBranch(null)}>
                <X size={22} />
              </button>
            </div>

            {/* Formulario para agregar excepción */}
            <form onSubmit={handleAddException} style={{
              backgroundColor: '#FFF8F0',
              border: '1.5px solid var(--color-border-gold)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-gold-deep)' }}>
                + Registrar Nueva Excepción de Cierre
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Fecha:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newExceptionDate}
                    onChange={(e) => setNewExceptionDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Motivo:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Feriado de Todos Santos"
                    value={newExceptionReason}
                    onChange={(e) => setNewExceptionReason(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn-gold" style={{ padding: '0.55rem', fontSize: '0.85rem', justifyContent: 'center' }}>
                <Plus size={16} /> Bloquear Fecha para Reservas
              </button>
            </form>

            {/* Listado de excepciones existentes */}
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {branchExceptions.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  No hay excepciones configuradas. Rige el calendario normal (Lunes a Sábado abierto, Domingos cerrado).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {branchExceptions.map(x => (
                    <div key={x.id} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #FFCDD2',
                      backgroundColor: '#FFEBEE',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#B71C1C' }}>{x.date}</div>
                        <div style={{ fontSize: '0.8rem', color: '#5C1D24' }}>{x.reason || 'Cerrado por excepción'}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteException(x.id)}
                        style={{ color: '#B71C1C', fontWeight: '700', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setExceptionsModalBranch(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
