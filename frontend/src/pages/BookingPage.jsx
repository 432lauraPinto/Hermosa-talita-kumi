import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, ChevronRight, 
  MapPin, Phone, MessageCircle, Info, ExternalLink, X, Heart, ArrowLeft, ArrowRight,
  ShieldCheck, Lock, User, Tag
} from 'lucide-react';

export default function BookingPage({ initialServiceId, initialBranchId, initialPromoId, onNavigate }) {
  const { user, login, register } = useAuth();
  const { selectedBranch: globalBranch, selectBranch } = useBranch();

  // Paso actual del asistente (1: Sucursal, 2: Servicio, 3: Fecha y Hora, 4: Confirmar)
  const [currentStep, setCurrentStep] = useState(initialServiceId ? 3 : 1);

  // Estados de selección
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || globalBranch?.id || 1);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || '');
  const [selectedPromoId, setSelectedPromoId] = useState(initialPromoId || null);
  const [promotions, setPromotions] = useState([]);

  // Fecha y hora
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [observations, setObservations] = useState('');

  // Disponibilidad de horarios
  const [slotsData, setSlotsData] = useState({
    slots: [],
    availableSlots: [],
    isClosed: false,
    reason: '',
    serviceDuration: 60
  });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Autenticación rápida en Paso 4 (si el visitante no tiene sesión iniciada)
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Modal de confirmación exitosa
  const [confirmationData, setConfirmationData] = useState(null);

  // Inicialización de datos
  useEffect(() => {
    async function init() {
      try {
        const [branchRes, catRes, svcRes, promoRes] = await Promise.all([
          api.getBranches(),
          api.getCategories(),
          api.getServices({ status: 'ACTIVO' }),
          api.getPromotions()
        ]);

        if (branchRes.success && branchRes.branches) {
          setBranches(branchRes.branches);
          if (!selectedBranchId && branchRes.branches.length > 0) {
            setSelectedBranchId(branchRes.branches[0].id);
          }
        }
        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        }
        if (svcRes.success && svcRes.services) {
          setServices(svcRes.services);
          if (!selectedServiceId && svcRes.services.length > 0 && !initialPromoId) {
            setSelectedServiceId(svcRes.services[0].id);
          }
        }
        if (promoRes.success && promoRes.data) {
          setPromotions(promoRes.data);
        }

        // Calcular fecha por defecto (próximo día hábil, evitando domingos)
        const target = new Date();
        target.setDate(target.getDate() + 1);
        if (target.getDay() === 0) {
          target.setDate(target.getDate() + 1);
        }
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
      } catch (e) {
        console.error('Error al inicializar agendamiento:', e);
      }
    }
    init();
  }, []);

  // Consultar disponibilidad cuando cambie sucursal, fecha o servicio
  const fetchAvailability = async () => {
    if (!selectedDate || !selectedBranchId) return;

    try {
      setLoadingSlots(true);
      setSelectedTime('');
      const res = await api.getAvailableSlots(selectedDate, selectedBranchId, selectedServiceId);
      if (res.success) {
        setSlotsData({
          slots: res.slots || [],
          availableSlots: res.availableSlots || [],
          isClosed: !!res.isClosed,
          reason: res.reason || '',
          serviceDuration: res.serviceDuration || 60
        });
      }
    } catch (err) {
      console.error('Error consultando horarios:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, selectedBranchId, selectedServiceId]);

  // Suscripción SSE para actualizar horarios en vivo si otro cliente reserva
  useEffect(() => {
    const unsubscribe = api.subscribeToEvents((event) => {
      if (event.type === 'BOOKING_CHANGED' || event.type === 'NEW_BOOKING') {
        if (parseInt(event.branchId, 10) === parseInt(selectedBranchId, 10) && event.date === selectedDate) {
          fetchAvailability();
        }
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [selectedBranchId, selectedDate, selectedServiceId]);

  const currentBranch = branches.find(b => String(b.id) === String(selectedBranchId)) || branches[0];
  const currentService = services.find(s => String(s.id) === String(selectedServiceId)) || services[0];
  const currentPromo = promotions.find(p => String(p.id) === String(selectedPromoId));

  // Manejador de selección de fecha
  const handleDateChange = (newDate) => {
    if (!newDate) return;
    const [y, m, d] = newDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDay() === 0) {
      setFeedback({
        type: 'warning',
        message: 'Has seleccionado Domingo. Nuestro centro permanece cerrado los domingos para descanso espiritual. Por favor selecciona de Lunes a Sábado.'
      });
    } else {
      setFeedback({ type: '', message: '' });
    }
    setSelectedDate(newDate);
  };

  // Retención temporal al elegir horario y pasar al paso 4
  const handleSelectSlotAndProceed = async (time) => {
    setSelectedTime(time);
    try {
      await api.holdSlot({
        branch_id: selectedBranchId,
        date: selectedDate,
        time
      });
    } catch (e) {
      // Continuar normalmente
    }
    setCurrentStep(4);
  };

  // Manejo de autenticación rápida en paso 4
  const handleQuickAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
      } else {
        await register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          phone: authForm.phone
        });
      }
    } catch (err) {
      setAuthError(err.message || 'Error en la autenticación. Verifica tus credenciales.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Confirmar reserva final
  const handleConfirmBooking = async () => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Por favor inicia sesión o regístrate para confirmar tu reserva.' });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const finalPrice = currentPromo ? currentPromo.promo_price : (currentService?.price || 0.00);

      const payload = {
        service_id: currentService?.id,
        branch_id: selectedBranchId,
        date: selectedDate,
        time: selectedTime,
        total_price: finalPrice,
        observations: observations || ''
      };

      const res = await api.createAppointment(payload);
      if (res.success && res.appointment) {
        setConfirmationData(res.appointment);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'No fue posible registrar la reserva. Es posible que el horario haya sido ocupado hace instantes.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppConfirmationLink = () => {
    if (!confirmationData) return '#';
    const phone = currentBranch?.whatsapp ? currentBranch.whatsapp.replace(/[^0-9]/g, '') : '62353452';
    const cleanPhone = phone.startsWith('591') ? phone : `591${phone}`;
    const msg = encodeURIComponent(
      `¡Hola Hermosa Talita Kumi! He registrado mi reserva para "${currentService?.name}" en la sucursal ${currentBranch?.name} el ${selectedDate} a las ${selectedTime}. Mi código es ${confirmationData.booking_code}. ¡Muchas gracias!`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="bg-combined-hero" style={{ minHeight: '100vh', padding: '2.5rem 1.5rem', color: '#333333' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Encabezado y Asistente en 4 Pasos (Módulo 06.1) */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.35rem' }}>
            Agendamiento en Línea y Disponibilidad en Vivo
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2.3rem', color: '#C46A86', margin: '0 0 0.5rem 0' }}>
            ASISTENTE DE RESERVA
          </h1>
          <p style={{ color: '#666666', fontSize: '0.95rem' }}>
            Selecciona tu sucursal, tratamiento y horario en solo 4 sencillos pasos.
          </p>

          {/* Barra de Progreso de 4 Pasos */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            {[
              { num: 1, title: '1. Sucursal' },
              { num: 2, title: '2. Tratamiento' },
              { num: 3, title: '3. Fecha y Hora' },
              { num: 4, title: '4. Confirmar' }
            ].map(step => (
              <div 
                key={step.num}
                onClick={() => { if (step.num < currentStep) setCurrentStep(step.num); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '25px',
                  backgroundColor: currentStep === step.num ? '#C46A86' : (currentStep > step.num ? '#FFFFFF' : '#F5F5DC'),
                  color: currentStep === step.num ? '#FFFFFF' : (currentStep > step.num ? '#C46A86' : '#888888'),
                  border: currentStep > step.num ? '1.5px solid #C46A86' : '1px solid transparent',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: step.num < currentStep ? 'pointer' : 'default',
                  boxShadow: currentStep === step.num ? '0 4px 12px rgba(196, 106, 134, 0.3)' : 'none'
                }}
              >
                <span>{step.title}</span>
                {currentStep > step.num && <CheckCircle2 size={16} color="#C46A86" />}
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================================
            PASO 1: SELECCIÓN DE SUCURSAL
           ===================================================================== */}
        {currentStep === 1 && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #F6C6D3', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86', marginBottom: '1.25rem' }}>
              Paso 1: Elige tu Sucursal
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {branches.map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBranchId(b.id);
                    selectBranch(b);
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: selectedBranchId === b.id ? '2.5px solid #C46A86' : '1px solid #E0E0E0',
                    backgroundColor: selectedBranchId === b.id ? '#FDF1F4' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#B8860B' }}>{b.city}</span>
                    <span style={{ fontSize: '0.75rem', color: '#888888' }}>Atención personalizada</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#333333', margin: '0 0 6px 0' }}>{b.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: '#666666', lineHeight: 1.4 }}>{b.address}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  backgroundColor: '#C46A86',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Continuar a Tratamientos
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            PASO 2: SELECCIÓN DE SERVICIO O PROMOCIÓN
           ===================================================================== */}
        {currentStep === 2 && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #F6C6D3', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86', margin: 0 }}>
                Paso 2: Elige tu Tratamiento o Promoción
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#B8860B', fontWeight: '700' }}>
                Sucursal: {currentBranch?.name} ({currentBranch?.city})
              </span>
            </div>

            {/* Filtros de Categorías */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setSelectedCategoryCode('ALL')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: selectedCategoryCode === 'ALL' ? '2px solid #C46A86' : '1px solid #D0D0D0',
                  backgroundColor: selectedCategoryCode === 'ALL' ? '#C46A86' : '#FFFFFF',
                  color: selectedCategoryCode === 'ALL' ? '#FFFFFF' : '#555555',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Todas las Categorías
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryCode(c.code)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: selectedCategoryCode === c.code ? '2px solid #C46A86' : '1px solid #D0D0D0',
                    backgroundColor: selectedCategoryCode === c.code ? '#C46A86' : '#FFFFFF',
                    color: selectedCategoryCode === c.code ? '#FFFFFF' : '#555555',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Listado de Servicios */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              maxHeight: '450px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              marginBottom: '2rem'
            }}>
              {services
                .filter(s => selectedCategoryCode === 'ALL' || s.category_code === selectedCategoryCode)
                .map(svc => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      setSelectedServiceId(svc.id);
                      setSelectedPromoId(null);
                    }}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: selectedServiceId === svc.id ? '2.5px solid #C46A86' : '1px solid #E0E0E0',
                      backgroundColor: selectedServiceId === svc.id ? '#FDF1F4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B8860B', textTransform: 'uppercase' }}>
                        {svc.category} • {svc.duration} min
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#333333', margin: '4px 0 6px 0' }}>
                        {svc.name}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#666666', lineHeight: 1.4, margin: '0 0 0.75rem 0' }}>
                        {svc.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F5F5DC', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#C46A86' }}>
                        Bs {parseFloat(svc.price).toFixed(2)}
                      </span>
                      {selectedServiceId === svc.id && (
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#C46A86' }}>Seleccionado ✓</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '1px solid #D0D0D0',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ArrowLeft size={16} />
                Volver a Sucursal
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  backgroundColor: '#C46A86',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Continuar a Calendario
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            PASO 3: FECHA Y HORA (CALENDARIO EN TIEMPO REAL POR SUCURSAL)
           ===================================================================== */}
        {currentStep === 3 && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #F6C6D3', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86', margin: 0 }}>
                  Paso 3: Elige Fecha y Horario Disponible
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '2px' }}>
                  {currentService?.name} • Sucursal {currentBranch?.name}
                </div>
              </div>

              {/* Selector de Fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="#B8860B" />
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F6C6D3',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    color: '#C46A86'
                  }}
                />
              </div>
            </div>

            {/* SI EL VISITANTE NO ESTÁ AUTENTICADO: REDIRIGIR A PÁGINA INDEPENDIENTE DE INICIO DE SESIÓN (MÓDULO 05 Y 11) */}
            {!user ? (
              <div style={{
                backgroundColor: '#FDF1F4',
                borderRadius: '20px',
                padding: '2.5rem 2rem',
                border: '1.5px solid #F6C6D3',
                marginBottom: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(196, 106, 134, 0.08)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '2px solid #F6C6D3',
                  boxShadow: '0 4px 12px rgba(196, 106, 134, 0.15)'
                }}>
                  <Lock size={26} color="#C46A86" />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86', margin: '0 0 0.6rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Inicia sesión para consultar los turnos disponibles
                </h3>
                
                <p style={{ fontSize: '0.95rem', color: '#666666', margin: '0 auto 1.5rem', maxWidth: '600px', lineHeight: 1.6 }}>
                  Para consultar la ocupación real y confirmar tu cita, es necesario iniciar sesión. Tu selección de sucursal (<strong>{currentBranch?.name}</strong>), servicio (<strong>{currentService?.name}</strong>) y fecha elegida quedará guardada y volverás automáticamente a este punto.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('htk_booking_context', JSON.stringify({
                        branchId: selectedBranchId,
                        serviceId: selectedServiceId,
                        date: selectedDate,
                        promoId: selectedPromoId
                      }));
                      onNavigate('login', {
                        returnTo: 'booking',
                        branchId: selectedBranchId,
                        serviceId: selectedServiceId,
                        date: selectedDate,
                        promoId: selectedPromoId
                      });
                    }}
                    style={{
                      backgroundColor: '#C46A86',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.85rem 2rem',
                      borderRadius: '30px',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(196, 106, 134, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <User size={18} />
                    Ingresar a la plataforma
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('htk_booking_context', JSON.stringify({
                        branchId: selectedBranchId,
                        serviceId: selectedServiceId,
                        date: selectedDate,
                        promoId: selectedPromoId
                      }));
                      onNavigate('register', {
                        returnTo: 'booking',
                        branchId: selectedBranchId,
                        serviceId: selectedServiceId,
                        date: selectedDate,
                        promoId: selectedPromoId
                      });
                    }}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#B8860B',
                      border: '1.5px solid #F7DFA8',
                      padding: '0.85rem 1.6rem',
                      borderRadius: '30px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Regístrate aquí
                  </button>
                </div>

                <div style={{ marginTop: '1.75rem', fontSize: '0.82rem', color: '#888888', borderTop: '1px solid #F7DFA8', paddingTop: '1rem' }}>
                  Horario habitual: Lunes a Sábado de 08:30 a 19:30 • Domingos cerrado para descanso y reposo espiritual.
                </div>
              </div>
            ) : slotsData.isClosed ? (
              <div style={{
                backgroundColor: '#FFF8F0',
                border: '1.5px solid #F7DFA8',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                margin: '2rem 0'
              }}>
                <AlertCircle size={32} color="#B8860B" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#B8860B', margin: '0 0 0.35rem 0' }}>
                  Sede no disponible en esta fecha
                </h4>
                <p style={{ color: '#555555', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                  {slotsData.reason || 'Por favor selecciona otra fecha de Lunes a Sábado.'}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#555555' }}>
                    Horarios para el {selectedDate} (Duración: {slotsData.serviceDuration} min):
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#B8860B', fontWeight: '600' }}>
                    {slotsData.availableSlots.length} horarios libres encontrados
                  </span>
                </div>

                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#C46A86', fontWeight: '700' }}>
                    Consultando turnos disponibles en tiempo real...
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '2rem'
                  }}>
                    {slotsData.slots.map(slot => {
                      const isSelected = selectedTime === slot.time;
                      const isFree = slot.isAvailable;

                      return (
                        <button
                          key={slot.time}
                          disabled={!isFree}
                          onClick={() => handleSelectSlotAndProceed(slot.time)}
                          style={{
                            padding: '0.75rem 0.5rem',
                            borderRadius: '14px',
                            border: isSelected ? '2px solid #C46A86' : (isFree ? '1px solid #D77FA1' : '1px solid #E5E5E5'),
                            backgroundColor: isSelected ? '#C46A86' : (isFree ? '#FFFFFF' : '#F5F5F5'),
                            color: isSelected ? '#FFFFFF' : (isFree ? '#333333' : '#AAAAAA'),
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            cursor: isFree ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{slot.time}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: '600', color: isSelected ? '#FFF' : (isFree ? '#059669' : '#DC2626') }}>
                            {isFree ? `${2 - (slot.occupiedCount || 0)} libre(s)` : 'Ocupado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F5F5DC', paddingTop: '1.25rem' }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '1px solid #D0D0D0',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ArrowLeft size={16} />
                Volver a Tratamientos
              </button>

              {selectedTime && (
                <button
                  onClick={() => setCurrentStep(4)}
                  style={{
                    backgroundColor: '#C46A86',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '30px',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  Continuar a Confirmación
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            PASO 4: CONFIRMACIÓN Y REGISTRO/LOGIN RÁPIDO INTEGRADO (MÓDULO 06.1)
           ===================================================================== */}
        {currentStep === 4 && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '2rem', border: '1px solid #F6C6D3', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86', marginBottom: '1.5rem' }}>
              Paso 4: Resumen y Confirmación de tu Cita
            </h2>

            {/* Tarjeta de Resumen */}
            <div style={{
              backgroundColor: '#FFF8F0',
              borderRadius: '18px',
              padding: '1.5rem',
              border: '1.5px solid #F6C6D3',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#888888', textTransform: 'uppercase', fontWeight: '700' }}>Sucursal</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#333333' }}>{currentBranch?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666666' }}>{currentBranch?.address}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#888888', textTransform: 'uppercase', fontWeight: '700' }}>Tratamiento</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#C46A86' }}>{currentService?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666666' }}>Duración: {currentService?.duration} minutos</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#888888', textTransform: 'uppercase', fontWeight: '700' }}>Fecha y Hora</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#B8860B' }}>{selectedDate} a las {selectedTime}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666666' }}>Agenda confirmada por franja</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#888888', textTransform: 'uppercase', fontWeight: '700' }}>Total a Pagar</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#C46A86' }}>
                    Bs {parseFloat(currentPromo ? currentPromo.promo_price : (currentService?.price || 0)).toFixed(2)}
                  </div>
                  {currentPromo && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                      Tarifa Promocional Aplicada ({currentPromo.badge})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Si el cliente NO ha iniciado sesión: Formulario Rápido de Login/Registro */}
            {!user ? (
              <div style={{
                backgroundColor: '#FDF1F4',
                borderRadius: '18px',
                padding: '1.75rem',
                border: '1.5px solid #F6C6D3',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Lock size={18} color="#C46A86" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#C46A86', margin: 0 }}>
                    Para confirmar tu cita, ingresa o regístrate en segundos
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#666666', margin: '0 0 1.25rem 0' }}>
                  Tus datos seleccionados (sucursal, servicio y horario) se conservarán intactos.
                </p>

                {/* Switch Login / Registro */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      border: authMode === 'login' ? '2px solid #C46A86' : '1px solid #D0D0D0',
                      backgroundColor: authMode === 'login' ? '#C46A86' : '#FFFFFF',
                      color: authMode === 'login' ? '#FFFFFF' : '#666666',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ya tengo cuenta (Ingresar)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      border: authMode === 'register' ? '2px solid #C46A86' : '1px solid #D0D0D0',
                      backgroundColor: authMode === 'register' ? '#C46A86' : '#FFFFFF',
                      color: authMode === 'register' ? '#FFFFFF' : '#666666',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Soy nueva cliente (Registro rápido)
                  </button>
                </div>

                {authError && (
                  <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {authError}
                  </div>
                )}

                <form onSubmit={handleQuickAuth} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                  {authMode === 'register' && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555555', display: 'block', marginBottom: '4px' }}>
                        Nombre Completo:
                      </label>
                      <input
                        type="text"
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        placeholder="Ej. Valeria Montes"
                        style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #D0D0D0', fontSize: '0.88rem' }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555555', display: 'block', marginBottom: '4px' }}>
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #D0D0D0', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555555', display: 'block', marginBottom: '4px' }}>
                      Contraseña:
                    </label>
                    <input
                      type="password"
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #D0D0D0', fontSize: '0.88rem' }}
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#555555', display: 'block', marginBottom: '4px' }}>
                        Teléfono / WhatsApp:
                      </label>
                      <input
                        type="tel"
                        value={authForm.phone}
                        onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                        placeholder="+591 7XXXXXXX"
                        style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #D0D0D0', fontSize: '0.88rem' }}
                      />
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      style={{
                        width: '100%',
                        backgroundColor: '#C46A86',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      {authLoading ? 'Verificando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ backgroundColor: '#FDF1F4', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={20} color="#059669" />
                <div style={{ fontSize: '0.9rem', color: '#333333' }}>
                  Sesión iniciada como: <strong>{user.name}</strong> ({user.email})
                </div>
              </div>
            )}

            {/* Campo Opcional de Observaciones */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#555555', display: 'block', marginBottom: '6px' }}>
                Observaciones o notas para la especialista (opcional):
              </label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Indícanos si tienes piel sensible, alergias conocidas o alguna consulta..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #D0D0D0', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            {feedback.message && (
              <div style={{
                backgroundColor: feedback.type === 'error' ? '#FEE2E2' : '#FEF3C7',
                color: feedback.type === 'error' ? '#DC2626' : '#B45309',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                {feedback.message}
              </div>
            )}

            {/* Botones de Confirmación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  border: '1px solid #D0D0D0',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ArrowLeft size={16} />
                Cambiar Fecha/Hora
              </button>

              <button
                onClick={handleConfirmBooking}
                disabled={submitting || !user}
                style={{
                  backgroundColor: user ? '#C46A86' : '#CCCCCC',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: user ? 'pointer' : 'not-allowed',
                  boxShadow: user ? '0 6px 18px rgba(196, 106, 134, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting ? 'Confirmando...' : 'Confirmar Reserva Definitiva'}
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL DE CONFIRMACIÓN EXITOSA (MÓDULO 11.3)
           ===================================================================== */}
        {confirmationData && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 2500
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '2.5rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#D1FAE5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#C46A86', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
                ¡Tu reserva ha sido confirmada!
              </h2>

              <p style={{ color: '#555555', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                ¡Te esperamos en <strong>Hermosa Talita Kumi</strong> con mucho cariño y bendición! Tu espacio ha sido reservado con éxito.
              </p>

              <div style={{ backgroundColor: '#FFF8F0', borderRadius: '16px', padding: '1.25rem', border: '1px solid #F6C6D3', textAlign: 'left', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>Código de Reserva:</strong> <span style={{ color: '#C46A86', fontWeight: '800' }}>{confirmationData.booking_code || `HTK-${confirmationData.id}`}</span>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>Tratamiento:</strong> {currentService?.name}
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>Sucursal:</strong> {currentBranch?.name} ({currentBranch?.address})
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <strong>Fecha y Hora:</strong> {selectedDate} a las {selectedTime}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Total:</strong> Bs {parseFloat(confirmationData.total_price || currentService?.price || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={getWhatsAppConfirmationLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    padding: '0.75rem',
                    borderRadius: '25px',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                  }}
                >
                  <MessageCircle size={18} />
                  Enviar confirmación por WhatsApp a la sede
                </a>

                <button
                  onClick={() => onNavigate('profile')}
                  style={{
                    backgroundColor: '#C46A86',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '25px',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    cursor: 'pointer'
                  }}
                >
                  Ver mis citas en Mi Cuenta
                </button>

                <button
                  onClick={() => onNavigate('home')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888888',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
