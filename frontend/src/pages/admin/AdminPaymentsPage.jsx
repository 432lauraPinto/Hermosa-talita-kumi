import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CreditCard, Plus, Edit2, CheckCircle, AlertCircle, X, DollarSign, Filter, Sparkles } from 'lucide-react';

export default function AdminPaymentsPage({ onNavigate }) {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({ totalCobrado: '0.00', totalAbonado: '0.00', totalPendiente: '0.00' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    client_id: '',
    appointment_id: '',
    total_amount: '',
    paid_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'EFECTIVO',
    notes: ''
  });

  useEffect(() => {
    loadAllData();
  }, [statusFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [payRes, clientsRes, appRes] = await Promise.all([
        api.getPayments(params),
        api.getClients(),
        api.getAppointments()
      ]);

      setPayments(payRes.payments || []);
      if (payRes.summary) setSummary(payRes.summary);
      setClients(clientsRes.clients || []);
      setAppointments(appRes.appointments || []);

      if (clientsRes.clients && clientsRes.clients.length > 0 && !formData.client_id) {
        setFormData(prev => ({
          ...prev,
          client_id: clientsRes.clients[0].client_id
        }));
      }
    } catch (err) {
      console.error('Error al cargar pagos admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPayment(null);
    setFormData({
      client_id: clients[0]?.client_id || '',
      appointment_id: '',
      total_amount: '180.00',
      paid_amount: '180.00',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'EFECTIVO',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPayment(p);
    setFormData({
      client_id: p.client_id,
      appointment_id: p.appointment_id || '',
      total_amount: p.total_amount.toString(),
      paid_amount: p.paid_amount.toString(),
      payment_date: p.payment_date,
      payment_method: p.payment_method,
      notes: p.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await api.updatePayment(editingPayment.id, formData);
        setActionMsg({ type: 'success', text: 'Registro de pago actualizado.' });
      } else {
        await api.createPayment(formData);
        setActionMsg({ type: 'success', text: 'Pago registrado exitosamente.' });
      }
      setModalOpen(false);
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al guardar pago.' });
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
            Módulo Contable y Pagos de Tratamientos
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Control de cobros, abonos parciales y saldos deudores de pacientes.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={18} /> Registrar Cobro / Pago
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

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--color-mauve)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>TOTAL FACTURADO</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-text-dark)', marginTop: '0.3rem' }}>
            Bs {summary.totalCobrado}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2E7D32' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>TOTAL INGRESADO</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2E7D32', marginTop: '0.3rem' }}>
            Bs {summary.totalAbonado}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #C62828' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>SALDO PENDIENTE GLOBAL</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: Number(summary.totalPendiente) > 0 ? '#C62828' : 'var(--color-text-muted)', marginTop: '0.3rem' }}>
            Bs {summary.totalPendiente}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--color-text-muted)" />
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Filtrar Estado:</span>
        {['', 'PENDIENTE', 'PARCIAL', 'PAGADO'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: statusFilter === st ? 'var(--color-mauve)' : 'var(--color-floral)',
              color: statusFilter === st ? '#FFFFFF' : 'var(--color-text-dark)',
              border: '1px solid var(--color-border)'
            }}
          >
            {st || 'TODOS'}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <Sparkles size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.5rem' }} />
          Cargando registros contables...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Paciente</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Método</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Total</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Pagado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Saldo Pendiente</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{p.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700' }}>{p.client_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.client_email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{p.payment_date}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>{p.payment_method}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>Bs {p.total_amount}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#2E7D32', fontWeight: '600' }}>Bs {p.paid_amount}</td>
                  <td style={{ padding: '1rem 1.25rem', color: Number(p.pending_balance) > 0 ? '#C62828' : 'var(--color-text-muted)', fontWeight: '700' }}>
                    Bs {p.pending_balance}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${p.status === 'PAGADO' ? 'badge-status-confirmada' : p.status === 'PARCIAL' ? 'badge-status-pendiente' : 'badge-status-cancelada'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button onClick={() => handleOpenEdit(p)} style={{ color: 'var(--color-mauve)', padding: '0.3rem' }} title="Editar o actualizar abono">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pagos */}
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
                {editingPayment ? 'Actualizar Pago / Abono' : 'Registrar Nuevo Pago'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingPayment && (
                <div className="form-group">
                  <label className="form-label">Paciente *</label>
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
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Monto Total ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monto Abonado ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Pago *</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="form-control"
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="TARJETA">TARJETA</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Concepto</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej. Abono del 50% de tratamiento facial..."
                  rows="2"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingPayment ? 'Guardar Cambios' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
