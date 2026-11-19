import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sparkles, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function AdminServicesPage({ onNavigate }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    type: 'FACIAL',
    status: 'ACTIVO',
    image: '/trat_limpieza_facial.png'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices({});
      if (res.services) {
        setServices(res.services);
      }
    } catch (err) {
      console.error('Error al cargar servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: 'Facial Purificante',
      price: '',
      duration: '60',
      type: 'FACIAL',
      status: 'ACTIVO',
      image: '/trat_limpieza_facial.png'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      name: svc.name,
      description: svc.description || '',
      category: svc.category || '',
      price: svc.price.toString(),
      duration: svc.duration.toString(),
      type: svc.type,
      status: svc.status,
      image: svc.image || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, formData);
        setActionMsg({ type: 'success', text: 'Servicio actualizado correctamente.' });
      } else {
        await api.createService(formData);
        setActionMsg({ type: 'success', text: 'Nuevo servicio creado con éxito.' });
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al guardar servicio.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Deseas eliminar o desactivar este servicio del catálogo?')) return;
    try {
      const res = await api.deleteService(id);
      setActionMsg({ type: 'success', text: res.message || 'Servicio eliminado.' });
      fetchServices();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al eliminar servicio.' });
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
            Catálogo de Tratamientos y Servicios
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Crea y administra la oferta de servicios faciales y corporales.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={18} /> Nuevo Servicio
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
          Cargando catálogo...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Nombre & Categoría</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tipo</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Precio</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Duración</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{svc.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{svc.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{svc.category}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge badge-${svc.type.toLowerCase()}`}>
                      {svc.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--color-mauve)' }}>
                    Bs {svc.price}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {svc.duration} min
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${svc.status === 'ACTIVO' ? 'badge-status-confirmada' : 'badge-status-cancelada'}`}>
                      {svc.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenEdit(svc)}
                        style={{ padding: '0.4rem', color: 'var(--color-mauve)' }}
                        title="Editar Servicio"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        style={{ padding: '0.4rem', color: '#C62828' }}
                        title="Eliminar o Desactivar"
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
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                {editingService ? 'Editar Servicio Estético' : 'Nuevo Servicio Estético'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Peeling Enzimático Iluminador"
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Tratamiento *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-control"
                  >
                    <option value="FACIAL">FACIAL</option>
                    <option value="CORPORAL">CORPORAL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej. Facial Renovador"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="180.00"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duración (Minutos) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Imagen</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-control"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? 'Actualizar Servicio' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
