import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sliders, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Sparkles } from 'lucide-react';

export default function AdminRulesPage({ onNavigate }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    treatment_name: '',
    treatment_type: 'FACIAL',
    recommended_interval: 15,
    interval_unit: 'DIAS',
    description: '',
    active: 1
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRules();
      if (res.rules) {
        setRules(res.rules);
      }
    } catch (err) {
      console.error('Error al cargar reglas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      treatment_name: '',
      treatment_type: 'FACIAL',
      recommended_interval: 15,
      interval_unit: 'DIAS',
      description: '',
      active: 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      treatment_name: rule.treatment_name,
      treatment_type: rule.treatment_type,
      recommended_interval: rule.recommended_interval,
      interval_unit: rule.interval_unit,
      description: rule.description || '',
      active: rule.active ? 1 : 0
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.updateRule(editingRule.id, formData);
        setActionMsg({ type: 'success', text: 'Regla de seguimiento actualizada.' });
      } else {
        await api.createRule(formData);
        setActionMsg({ type: 'success', text: 'Nueva regla de seguimiento configurada.' });
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al guardar regla.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Confirmas que deseas eliminar esta regla de frecuencia?')) return;
    try {
      await api.deleteRule(id);
      setActionMsg({ type: 'success', text: 'Regla eliminada exitosamente.' });
      fetchRules();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al eliminar regla.' });
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
            Configuración de Reglas de Seguimiento Dérmico
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Intervalos y frecuencias determinísticas utilizadas por el motor de negocio y el Agente de IA.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={18} /> Nueva Regla de Intervalo
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
          Cargando reglas de negocio...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tratamiento Asociado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tipo</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Intervalo Recomendado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fundamentación / Descripción</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{rule.id}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
                    {rule.treatment_name}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge badge-${rule.treatment_type.toLowerCase()}`}>
                      {rule.treatment_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-mauve)' }}>
                      {rule.recommended_interval} {rule.interval_unit.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-muted)', maxWidth: '360px' }}>
                    {rule.description || 'Sin descripción'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${rule.active ? 'badge-status-confirmada' : 'badge-status-cancelada'}`}>
                      {rule.active ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenEdit(rule)}
                        style={{ padding: '0.4rem', color: 'var(--color-mauve)' }}
                        title="Editar Regla"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        style={{ padding: '0.4rem', color: '#C62828' }}
                        title="Eliminar Regla"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
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
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                {editingRule ? 'Editar Regla de Frecuencia' : 'Nueva Regla de Frecuencia'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Tratamiento *</label>
                <input
                  type="text"
                  value={formData.treatment_name}
                  onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                  placeholder="Ej. Limpieza Facial Profunda con Espátula Ultrasónica"
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Tratamiento *</label>
                  <select
                    value={formData.treatment_type}
                    onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                    className="form-control"
                  >
                    <option value="FACIAL">FACIAL</option>
                    <option value="CORPORAL">CORPORAL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Intervalo Numérico *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recommended_interval}
                    onChange={(e) => setFormData({ ...formData, recommended_interval: parseInt(e.target.value, 10) })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad de Intervalo *</label>
                  <select
                    value={formData.interval_unit}
                    onChange={(e) => setFormData({ ...formData, interval_unit: e.target.value })}
                    className="form-control"
                  >
                    <option value="DIAS">DÍAS</option>
                    <option value="SEMANAS">SEMANAS</option>
                    <option value="MESES">MESES</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Justificación / Descripción de la Regla</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="form-control"
                  placeholder="Ej. Tiempo necesario para el ciclo dérmico de regeneración celular..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingRule ? 'Actualizar Regla' : 'Crear Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
