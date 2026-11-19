import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Calendar, CheckCircle2, Clock, AlertTriangle, DollarSign, Sparkles, Sliders, ShoppingBag, CreditCard, Shield, ArrowUpRight, MapPin } from 'lucide-react';

export default function AdminDashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error al cargar métricas de dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem', color: 'var(--color-text-muted)' }}>
        <Sparkles size={36} color="var(--color-mauve)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
        <p>Cargando panel de control gerencial...</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gold-deep)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <Shield size={16} /> Panel de Administración General • Hermosa Talita Kumi
          </div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '900', color: 'var(--color-text-dark)', marginTop: '0.2rem' }}>
            Panel de Control Estético Centralizado
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
            Base de datos conectada: <strong>{data?.databaseEngine || 'MySQL'}</strong> • Sedes: <strong>4 Sedes Oficiales en La Paz y El Alto</strong>
          </p>
        </div>

        {/* Quick Module Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('admin-branches')} className="btn-gold" style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}>
            <MapPin size={15} /> 4 Sucursales
          </button>
          <button onClick={() => onNavigate('admin-appointments')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Calendar size={15} /> Citas
          </button>
          <button onClick={() => onNavigate('admin-services')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Sparkles size={15} /> Servicios
          </button>
          <button onClick={() => onNavigate('admin-treatments')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Clock size={15} /> Historial
          </button>
          <button onClick={() => onNavigate('admin-rules')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Sliders size={15} /> Reglas
          </button>
          <button onClick={() => onNavigate('admin-products')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <ShoppingBag size={15} /> Productos
          </button>
          <button onClick={() => onNavigate('admin-payments')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <CreditCard size={15} /> Pagos
          </button>
          <button onClick={() => onNavigate('admin-clients')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Users size={15} /> Clientes
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        {/* Total Clientes */}
        <div className="card" onClick={() => onNavigate('admin-clients')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-mauve)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL CLIENTES</span>
            <Users size={20} color="var(--color-mauve)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-dark)', marginTop: '0.5rem' }}>
            {stats.totalClients || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-mauve)', marginTop: '0.3rem' }}>
            Ver lista de clientes →
          </div>
        </div>

        {/* Reservas Pendientes */}
        <div className="card" onClick={() => onNavigate('admin-appointments')} style={{ cursor: 'pointer', borderLeft: '4px solid #FFA000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>CITAS PENDIENTES</span>
            <Calendar size={20} color="#FFA000" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFA000', marginTop: '0.5rem' }}>
            {stats.pendingAppointments || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#FFA000', marginTop: '0.3rem' }}>
            Requieren confirmación →
          </div>
        </div>

        {/* Reservas Confirmadas */}
        <div className="card" onClick={() => onNavigate('admin-appointments')} style={{ cursor: 'pointer', borderLeft: '4px solid #2E7D32' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>CONFIRMADAS</span>
            <CheckCircle2 size={20} color="#2E7D32" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2E7D32', marginTop: '0.5rem' }}>
            {stats.confirmedAppointments || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2E7D32', marginTop: '0.3rem' }}>
            Listas para atención →
          </div>
        </div>

        {/* Tratamientos Realizados */}
        <div className="card" onClick={() => onNavigate('admin-treatments')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>SESIONES COMPLETADAS</span>
            <Clock size={20} color="var(--color-gold)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-dark)', marginTop: '0.5rem' }}>
            {stats.totalTreatmentsDone || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)', marginTop: '0.3rem' }}>
            Historial clínico registrado →
          </div>
        </div>

        {/* Saldo Pendiente por Cobrar */}
        <div className="card" onClick={() => onNavigate('admin-payments')} style={{ cursor: 'pointer', borderLeft: '4px solid #C62828' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>SALDO PENDIENTE</span>
            <AlertTriangle size={20} color="#C62828" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#C62828', marginTop: '0.5rem' }}>
            Bs {stats.pendingBalanceTotal || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#C62828', marginTop: '0.3rem' }}>
            {stats.pendingPaymentsCount || 0} pago(s) pendientes →
          </div>
        </div>

        {/* Ingresos Recaudados */}
        <div className="card" onClick={() => onNavigate('admin-payments')} style={{ cursor: 'pointer', borderLeft: '4px solid #1565C0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL COBRADO</span>
            <DollarSign size={20} color="#1565C0" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1565C0', marginTop: '0.5rem' }}>
            Bs {stats.totalPaidRevenue || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#1565C0', marginTop: '0.3rem' }}>
            Flujo de caja registrado →
          </div>
        </div>
      </div>

      {/* Two columns: Upcoming Appointments & Top Requested Services */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem'
      }}>
        {/* Próximas Citas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
              Próximas Citas en Agenda
            </h3>
            <button onClick={() => onNavigate('admin-appointments')} style={{ fontSize: '0.82rem', color: 'var(--color-mauve)', fontWeight: '600' }}>
              Ver todas →
            </button>
          </div>

          {(!data?.upcomingAppointments || data.upcomingAppointments.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No hay citas activas agendadas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.upcomingAppointments.map(app => (
                <div key={app.id} style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-floral)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{app.client_name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {app.service_name} • {app.date} a las {app.time} hrs
                    </div>
                  </div>
                  <span className={`badge badge-status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servicios Más Solicitados */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
              Servicios Más Solicitados
            </h3>
            <button onClick={() => onNavigate('admin-services')} style={{ fontSize: '0.82rem', color: 'var(--color-mauve)', fontWeight: '600' }}>
              Gestionar →
            </button>
          </div>

          {(!data?.topServices || data.topServices.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Sin registros de reservas aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.topServices.map((svc, idx) => (
                <div key={svc.id} style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-floral)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-champagne)',
                      color: 'var(--color-gold)',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{svc.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {svc.type} • Bs {svc.price}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--color-mauve)', fontSize: '0.88rem' }}>
                    {svc.booking_count} reserva(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
