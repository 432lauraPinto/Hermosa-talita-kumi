import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, Plus, Sparkles, CheckCircle, AlertCircle, X, User } from 'lucide-react';

export default function AdminTreatmentsPage({ onNavigate }) {
  const [history, setHistory] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    client_id: '',
    treatment_name: '',
    treatment_type: 'FACIAL',
    date: new Date().toISOString().split('T')[0],
    professional: 'Dra. Valeria Montes',
    observations: '',
    status: 'COMPLETADO'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [histRes, clientsRes, servRes] = await Promise.all([
        api.getTreatmentHistory(),
        api.getClients(),
        api.getServices({ status: 'ACTIVO' })
      ]);
      setHistory(histRes.history || []);
      setClients(clientsRes.clients || []);
      setServices(servRes.services || []);
      if (clientsRes.clients && clientsRes.clients.length > 0 && !formData.client_id) {
        setFormData(prev => ({
          ...prev,
          client_id: clientsRes.clients[0].client_id,
          treatment_name: servRes.services?.[0]?.name || 'Limpieza Facial Profunda con Espátula Ultrasónica'
        }));
      }
    } catch (err) {
      console.error('Error al cargar tratamientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      client_id: clients[0]?.client_id || '',
      treatment_name: services[0]?.name || '',
      treatment_type: services[0]?.type || 'FACIAL',
      date: new Date().toISOString().split('T')[0],
      professional: 'Dra. Valeria Montes',
      observations: '',
      status: 'COMPLETADO'
    });
    setModalOpen(true);
  };

  const handleServiceSelect = (e) => {
    const selectedSvcName = e.target.value;
    const found = services.find(s => s.name === selectedSvcName);
    setFormData({
      ...formData,
      treatment_name: selectedSvcName,
      treatment_type: found ? found.type : 'FACIAL'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createTreatmentRecord(formData);
      setActionMsg({
        type: 'success',
        text: `Sesión registrada. Próxima sesión calculada por regla: ${res.suggestedNextSession} (${res.ruleApplied}).`
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al registrar sesión.' });
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => onNavigate('admin-dashboard')} style={{ fontSize: '0.85rem', color: 'var(--color-mauve)', fontWeight: '600', marginBottom: '0.4rem' }}>
            ← Volver al Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'serif', fontWeight: '800', color: 'var(--color-text-dark)' }}>
            Registro Clínico de Tratamientos Realizados
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Historial de procedimientos y cálculo automático de seguimiento por regla.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={18} /> Registrar Sesión en Cabina
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.5rem' }} />
          Cargando historial clínico...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cliente</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tratamiento</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha Sesión</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Profesional</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Próxima Sesión Sugerida</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{item.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{item.client_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{item.client_email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600' }}>{item.treatment_name}</div>
                    <span className={`badge badge-${item.treatment_type.toLowerCase()}`} style={{ marginTop: '0.3rem' }}>
                      {item.treatment_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>
                    {item.date}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {item.professional}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-mauve)' }}>
                      {item.suggested_next_session || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>Regla calculada</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="badge badge-status-confirmada">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Sesión */}
      {modalOpen && (
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
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                Registrar Sesión en Cabina
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Paciente / Cliente *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="form-control"
                  required
                >
                  {clients.map(c => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tratamiento Realizado *</label>
                <select
                  value={formData.treatment_name}
                  onChange={handleServiceSelect}
                  className="form-control"
                  required
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>
                      [{s.type}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Realización *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Profesional a Cargo *</label>
                  <input
                    type="text"
                    value={formData.professional}
                    onChange={(e) => setFormData({ ...formData, professional: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones Dérmicas y Procedimiento</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows="3"
                  className="form-control"
                  placeholder="Detallar productos aplicados, reacción de la piel..."
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
                ℹ️ La fecha de la siguiente sesión se calculará determinísticamente sumando el intervalo de la regla configurada.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Tratamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
