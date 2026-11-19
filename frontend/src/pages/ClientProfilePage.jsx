import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, Calendar, Clock, Sparkles, CheckCircle2, AlertCircle, ShoppingBag, 
  CreditCard, ChevronRight, RefreshCw, XCircle, Inbox, MapPin, MessageCircle, CheckCheck 
} from 'lucide-react';

export default function ClientProfilePage({ onNavigate }) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('seguimiento'); // 'seguimiento', 'notificaciones', 'citas', 'historial', 'productos', 'pagos', 'datos'

  const [followUp, setFollowUp] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [productRequests, setProductRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ totalCobrado: '0.00', totalAbonado: '0.00', totalPendiente: '0.00' });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAllClientData();
  }, [user]);

  const loadAllClientData = async () => {
    try {
      setLoading(true);
      const [fUpRes, appRes, notifRes, histRes, prodRes, payRes, reqRes] = await Promise.all([
        api.getMyFollowUp().catch(() => ({})),
        api.getAppointments().catch(() => ({ appointments: [] })),
        api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        api.getTreatmentHistory().catch(() => ({ history: [] })),
        api.getClientProducts().catch(() => ({ clientProducts: [] })),
        api.getPayments().catch(() => ({ payments: [], summary: { totalCobrado: '0.00', totalAbonado: '0.00', totalPendiente: '0.00' } })),
        api.getMyProductRequests().catch(() => ({ requests: [] }))
      ]);

      setFollowUp(fUpRes);
      setAppointments(appRes.appointments || []);
      setNotifications(notifRes.notifications || []);
      setUnreadNotifsCount(notifRes.unreadCount || 0);
      setHistory(histRes.history || []);
      setProducts(prodRes.clientProducts || []);
      setProductRequests(reqRes.requests || []);
      setPayments(payRes.payments || []);
      if (payRes.summary) {
        setPaymentSummary(payRes.summary);
      }
    } catch (err) {
      console.error('Error al cargar datos del perfil del cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('¿Confirmas que deseas cancelar esta cita agendada? El horario se liberará inmediatamente para otros pacientes.')) return;
    try {
      const res = await api.cancelAppointment(appointmentId);
      if (res.success) {
        setActionMsg({ type: 'success', text: 'Cita cancelada exitosamente y horario liberado.' });
        loadAllClientData();
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'No se pudo cancelar la cita.' });
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifsCount(0);
      setActionMsg({ type: 'success', text: 'Todas las notificaciones han sido marcadas como leídas.' });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem', color: 'var(--color-text-muted)' }}>
        <Sparkles size={36} color="var(--color-mauve)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
        <p>Cargando ficha integral de Hermosa Talita Kumi...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }} className="animate-fade-in">
      {/* Client Header Banner */}
      <div className="card-elegant card-gold-border" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%)',
        marginBottom: '2.5rem',
        padding: '2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid var(--color-gold)',
            background: 'linear-gradient(135deg, var(--color-mauve), var(--color-rose-solid))',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: '900',
            boxShadow: '0 6px 20px rgba(184, 134, 11, 0.3)'
          }}>
            {user?.name ? user.name.charAt(0) : 'C'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span className="badge badge-gold">
                PACIENTE HERMOSA TALITA KUMI
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                ID #{user?.clientProfile?.id || user?.id}
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-text-dark)', fontFamily: "'Playfair Display', Georgia, serif" }}>
              {user?.name}
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {user?.email} • {user?.phone || 'Sin teléfono'} • Sede habitual: <strong>{user?.preferred_branch_name || 'La Paz y El Alto (4 Sedes Oficiales)'}</strong>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('booking')}
          className="btn-primary"
          style={{ padding: '0.85rem 1.8rem' }}
        >
          <Calendar size={18} />
          Agendar Nueva Cita
        </button>
      </div>

      {actionMsg.text && (
        <div style={{
          backgroundColor: actionMsg.type === 'error' ? '#FFEBEE' : '#E8F5E9',
          color: actionMsg.type === 'error' ? '#C62828' : '#2E7D32',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          {actionMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        overflowX: 'auto',
        borderBottom: '2px solid var(--color-border)',
        marginBottom: '2rem',
        paddingBottom: '0.6rem'
      }}>
        {[
          { id: 'seguimiento', label: 'Seguimiento Inteligente', icon: Sparkles },
          { id: 'notificaciones', label: `Mis Avisos (${unreadNotifsCount > 0 ? `${unreadNotifsCount} nuevos` : notifications.length})`, icon: Inbox },
          { id: 'citas', label: `Mis Citas (${appointments.length})`, icon: Calendar },
          { id: 'historial', label: `Historial de Sesiones (${history.length})`, icon: Clock },
          { id: 'solicitudes', label: `Mis Solicitudes (${productRequests.length})`, icon: ShoppingBag },
          { id: 'productos', label: `Productos Asignados (${products.length})`, icon: Sparkles },
          { id: 'pagos', label: `Estado de Pagos (Bs ${paymentSummary.totalPendiente})`, icon: CreditCard },
          { id: 'datos', label: 'Datos Personales', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.35rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.92rem',
                backgroundColor: isActive ? 'var(--color-mauve-deep)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : 'var(--color-text-dark)',
                border: isActive ? '2px solid var(--color-mauve-deep)' : '1.5px solid var(--color-border)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 15px rgba(163, 62, 94, 0.3)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SEGUIMIENTO INTELIGENTE */}
      {activeTab === 'seguimiento' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {followUp?.hasHistory ? (
            <div className="card-elegant card-gold-border" style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%)',
              padding: '2.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-gold)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '900', color: 'var(--color-text-dark)' }}>
                    Cálculo Inteligente de Próxima Sesión
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-gold-deep)', fontWeight: '700' }}>
                    Basado estrictamente en la regla de frecuencia dérmica configurada
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                border: '1.5px solid var(--color-border)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-text-dark)' }}>
                  {followUp.recommendationText}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => onNavigate('booking')}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.6rem' }}
                >
                  <Calendar size={17} />
                  Agendar para la fecha sugerida
                </button>
              </div>
            </div>
          ) : (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Sparkles size={42} color="var(--color-gold)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                Aún no tienes tratamientos registrados
              </h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Una vez que asistas a tu primera sesión en cualquiera de nuestras 4 sedes oficiales de La Paz o El Alto, el motor inteligente calculará automáticamente el momento óptimo para tu siguiente sesión.
              </p>
              <button onClick={() => onNavigate('booking')} className="btn-gold">
                Reservar Mi Primera Cita
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MIS NOTIFICACIONES (REQUERIDO) */}
      {activeTab === 'notificaciones' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                Centro de Notificaciones y Avisos de Citas
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                Confirmaciones automáticas, modificaciones y recordatorios de tus tratamientos en Hermosa Talita Kumi.
              </p>
            </div>

            {unreadNotifsCount > 0 && (
              <button
                onClick={handleMarkAllNotifsRead}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <CheckCheck size={16} /> Marcar todas como leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Inbox size={40} color="var(--color-rose-solid)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-dark)', marginBottom: '0.5rem' }}>
                No tienes avisos pendientes
              </h4>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Aquí recibirás las confirmaciones inmediatas cuando reserves en cualquiera de nuestras cuatro sucursales oficiales.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="card-elegant"
                  style={{
                    padding: '1.5rem',
                    backgroundColor: n.is_read ? '#FFFFFF' : '#FFF5F8',
                    borderLeft: `4px solid ${n.type === 'CANCELACION' ? '#C41C48' : 'var(--color-gold)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={`badge ${n.type === 'CANCELACION' ? 'badge-danger' : 'badge-gold'}`}>
                        {n.type}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-dark)', margin: 0 }}>
                        {n.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {new Date(n.created_at).toLocaleString('es-BO')}
                      </span>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkNotifRead(n.id)}
                          title="Marcar como leída"
                          style={{ color: 'var(--color-gold-deep)', fontSize: '0.8rem', fontWeight: '700' }}
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--color-text-dark)', lineHeight: '1.6', margin: 0 }}>
                    {n.message}
                  </p>

                  {n.branch_name && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-gold-deep)', fontWeight: '700' }}>
                        <MapPin size={15} /> {n.branch_name}
                      </span>
                      {n.branch_address && <span>({n.branch_address})</span>}
                      {n.appointment_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} /> Fecha Cita: {n.appointment_date} {n.appointment_time ? `a las ${n.appointment_time}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIS CITAS (CON INFORMACIÓN DE SEDE Y HORARIO FIN) */}
      {activeTab === 'citas' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Mis Reservas y Citas Programadas
            </h3>
            <button onClick={() => onNavigate('booking')} className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
              Nueva reserva
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No tienes citas registradas actualmente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {appointments.map(app => (
                <div key={app.id} className="card-elegant" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.5rem 1.75rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <span className={`badge ${app.status === 'CONFIRMADA' ? 'badge-success' : app.status === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}`}>
                        {app.status}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Cita #{app.id}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-dark)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {app.service_name}
                    </h4>

                    {/* Sede asignada */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-gold-deep)', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      <MapPin size={16} /> {app.branch_name || 'Sede Central'} {app.branch_address ? `• ${app.branch_address}` : ''}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={15} color="var(--color-mauve)" /> {app.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={15} color="var(--color-gold)" /> {app.time} {app.end_time ? `hasta ${app.end_time}` : ''} hrs
                      </span>
                      <span>Precio: <strong>Bs {app.service_price}</strong></span>
                    </div>

                    {app.observations && (
                      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Observación: "{app.observations}"
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {app.branch_whatsapp && (
                      <a
                        href={`https://wa.me/${app.branch_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola Hermosa Talita Kumi, confirmo mi cita #${app.id} de ${app.service_name} en la ${app.branch_name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', textDecoration: 'none' }}
                      >
                        <MessageCircle size={15} /> WhatsApp Sede
                      </a>
                    )}

                    {app.status === 'PENDIENTE' && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#C62828',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          padding: '0.45rem 0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #FFCDD2',
                          backgroundColor: '#FFEBEE'
                        }}
                      >
                        <XCircle size={15} />
                        Cancelar cita
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORIAL DE TRATAMIENTOS REALIZADOS */}
      {activeTab === 'historial' && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '1.5rem' }}>
            Historial de Sesiones Realizadas en Cabina
          </h3>

          {history.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Aún no tienes procedimientos clínicos registrados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {history.map(item => (
                <div key={item.id} className="card-elegant" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-gold">{item.treatment_type}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.date}</span>
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-dark)' }}>{item.treatment_name}</h4>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                    Profesional a cargo: <strong>{item.professional}</strong> • Sede: <strong>{item.branch_name || 'La Paz'}</strong>
                  </div>
                  {item.observations && (
                    <div style={{ backgroundColor: '#FFFDF9', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.75rem', fontSize: '0.88rem' }}>
                      {item.observations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4.5: MIS SOLICITUDES DE PRODUCTOS */}
      {activeTab === 'solicitudes' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>
                Mis Solicitudes de Productos
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Seguimiento de artículos solicitados para retiro y pago presencial en cabina.
              </p>
            </div>
            <button onClick={() => onNavigate('products')} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              + Ver Catálogo de Productos
            </button>
          </div>

          <div style={{ backgroundColor: '#FDF1F4', border: '1px solid #F6C6D3', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
            ℹ️ <strong>Importante:</strong> Las solicitudes de producto no constituyen cobros web ni ventas por internet. El personal de tu sede coordina la entrega física y el pago presencial en cabina.
          </div>

          {productRequests.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <ShoppingBag size={40} color="var(--color-mauve)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <p style={{ color: 'var(--color-text-muted)' }}>No has enviado solicitudes de productos aún.</p>
              <button onClick={() => onNavigate('products')} className="btn-primary" style={{ marginTop: '1rem', padding: '0.65rem 1.4rem' }}>
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="card-elegant" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Producto</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Sucursal de Retiro</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cantidad</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Precio Unit.</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {productRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{req.id}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{req.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#B8860B' }}>{req.product_brand} • {req.product_type}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '600' }}>{req.branch_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.branch_address}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>{req.quantity} ud(s)</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--color-mauve)' }}>
                        Bs {parseFloat(req.product_price).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${
                          req.status === 'ENTREGADA' ? 'badge-success' : 
                          req.status === 'LISTA_RECOJO' ? 'badge-gold' : 
                          req.status === 'CONFIRMADA' ? 'badge-facial' : 
                          req.status === 'CANCELADA' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {req.status}
                        </span>
                        {req.admin_notes && (
                          <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '3px' }}>
                            Nota: {req.admin_notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PRODUCTOS ASIGNADOS */}
      {activeTab === 'productos' && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '1.5rem' }}>
            Cosmecéutica y Productos Indicados
          </h3>

          {products.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No tienes productos recomendados asignados a tu ficha.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {products.map(p => (
                <div key={p.id} className="card-elegant" style={{ padding: '1.5rem' }}>
                  <span className="badge badge-mauve" style={{ marginBottom: '0.5rem' }}>{p.category}</span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-dark)' }}>{p.product_name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-gold-deep)', fontWeight: '700' }}>{p.brand}</div>
                  <div style={{ fontSize: '0.88rem', marginTop: '0.6rem', color: 'var(--color-text-muted)' }}>
                    <strong>Frecuencia:</strong> {p.usage_frequency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PAGOS */}
      {activeTab === 'pagos' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Estado Financiero y Pagos
            </h3>
            <div style={{ fontWeight: '800', color: Number(paymentSummary.totalPendiente) > 0 ? '#C41C48' : '#156E42', fontSize: '1.1rem' }}>
              Saldo Pendiente: Bs {paymentSummary.totalPendiente}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="card-elegant" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No tienes pagos o cobros registrados.</p>
            </div>
          ) : (
            <div className="card-elegant" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Método</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Monto Total</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Abonado</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Saldo Pendiente</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>#{p.id}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{p.payment_date}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>{p.payment_method}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>Bs {p.total_amount}</td>
                      <td style={{ padding: '1rem 1.25rem', color: '#156E42', fontWeight: '700' }}>Bs {p.paid_amount}</td>
                      <td style={{ padding: '1rem 1.25rem', color: Number(p.pending_balance) > 0 ? '#C41C48' : 'var(--color-text-muted)', fontWeight: '700' }}>
                        Bs {p.pending_balance}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${p.status === 'PAGADO' ? 'badge-success' : 'badge-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DATOS PERSONALES */}
      {activeTab === 'datos' && (
        <div className="animate-fade-in card-elegant" style={{ maxWidth: '720px', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mauve-deep)', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '1.5rem' }}>
            Información de la Ficha del Paciente
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nombre Completo</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.2rem' }}>{user?.name}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Correo Electrónico</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.2rem' }}>{user?.email}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Teléfono Registrado</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.2rem' }}>{user?.phone || 'No registrado'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tipo de Piel</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-mauve)', marginTop: '0.2rem' }}>
                {user?.clientProfile?.skin_type || 'Evaluada en cabina'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
