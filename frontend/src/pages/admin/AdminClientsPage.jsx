import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Eye, Sparkles, X, Calendar, Clock, ShoppingBag, CreditCard, Shield } from 'lucide-react';

export default function AdminClientsPage({ onNavigate }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientDossier, setSelectedClientDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.getClients();
      if (res.clients) {
        setClients(res.clients);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = async (clientId) => {
    try {
      setLoadingDossier(true);
      const res = await api.getClientDetails(clientId);
      if (res.success) {
        setSelectedClientDossier(res);
      }
    } catch (err) {
      console.error('Error al cargar expediente del cliente:', err);
    } finally {
      setLoadingDossier(false);
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
            Expedientes de Pacientes y Clientes
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Fichas clínicas dérmicas, citas acumuladas, saldos y seguimiento de cada paciente.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.5rem' }} />
          Cargando base de datos de pacientes...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Ficha ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Paciente</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tipo de Piel</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Contacto Emergencia</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Citas Agendadas</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Sesiones Hechas</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Saldo Deudor</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.client_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{c.client_id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{c.email} • {c.phone || 'S/N'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="badge badge-facial">{c.skin_type || 'No registrado'}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>
                    <div>{c.emergency_contact || 'No asignado'}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{c.emergency_phone || ''}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>
                    {c.total_appointments} cita(s)
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: 'var(--color-mauve)' }}>
                    {c.total_treatments} sesión(es)
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: Number(c.pending_balance) > 0 ? '#C62828' : '#2E7D32' }}>
                    Bs {Number(c.pending_balance).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenDossier(c.client_id)}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      <Eye size={14} /> Ver Expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Expediente Integral */}
      {selectedClientDossier && (
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
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.6rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                  Expediente Clínico: {selectedClientDossier.client.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {selectedClientDossier.client.email} • {selectedClientDossier.client.phone} • Ficha #{selectedClientDossier.client.id}
                </div>
              </div>
              <button onClick={() => setSelectedClientDossier(null)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Ficha Diagnóstica */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--color-floral)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Tipo de Cutis</div>
                <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{selectedClientDossier.client.skin_type || 'Normal/Mixta'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Alergias Conocidas</div>
                <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{selectedClientDossier.client.allergies || 'Ninguna'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Notas Clínicas</div>
                <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{selectedClientDossier.client.medical_notes || 'Sin antecedentes'}</div>
              </div>
            </div>

            {/* Seguimiento Inteligente */}
            {selectedClientDossier.followUp && selectedClientDossier.followUp.hasHistory && (
              <div style={{ backgroundColor: 'var(--color-blush)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-rose-pastel)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-mauve)', fontWeight: '700', marginBottom: '0.4rem' }}>
                  <Sparkles size={16} /> Próxima Sesión Calculada por Regla:
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', lineHeight: '1.5' }}>
                  {selectedClientDossier.followUp.recommendationText}
                </p>
              </div>
            )}

            {/* Sesiones Clínicas Realizadas */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Sesiones Realizadas en Cabina ({selectedClientDossier.history?.length || 0})
              </h4>
              {(!selectedClientDossier.history || selectedClientDossier.history.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sin sesiones previas registradas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedClientDossier.history.map(h => (
                    <div key={h.id} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                        <span>{h.treatment_name} ({h.treatment_type})</span>
                        <span>{h.date}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        Profesional: {h.professional} • Próxima sesión sugerida: {h.suggested_next_session || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Productos Recetados */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={16} /> Productos Asignados ({selectedClientDossier.products?.length || 0})
              </h4>
              {(!selectedClientDossier.products || selectedClientDossier.products.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sin productos prescritos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedClientDossier.products.map(p => (
                    <div key={p.id} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700' }}>{p.product_name} ({p.brand})</div>
                      <div style={{ color: 'var(--color-mauve)', marginTop: '0.2rem' }}>Frecuencia: {p.usage_frequency}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedClientDossier(null)} className="btn-secondary">
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
