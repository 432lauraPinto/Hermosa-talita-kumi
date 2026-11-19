import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { useAudioNotification } from '../hooks/useAudioNotification';
import { api } from '../services/api';
import { 
  Sparkles, Calendar, User, Shield, LogOut, Menu, X, 
  MapPin, CheckCircle, Clock, ChevronDown, MessageSquare, Tag, ShoppingBag
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();
  const { branches, selectedBranch, selectBranch, isBranchModalOpen, setIsBranchModalOpen } = useBranch();
  const { soundEnabled, setSoundEnabled, playChime, initAudio } = useAudioNotification();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const branchRef = useRef(null);

  // Cargar notificaciones para el usuario autenticado (cliente, encargado o admin)
  useEffect(() => {
    let isMounted = true;
    if (user) {
      const loadNotifs = async () => {
        try {
          const res = await api.getNotifications({ branch_id: selectedBranch?.id });
          if (res.success && isMounted) {
            const newNotifs = res.notifications || [];
            const newUnread = res.unreadCount || 0;

            // Si hay nuevas notificaciones no leídas que antes no estaban, hacer sonar la campana
            if (newUnread > unreadCount) {
              playChime();
            }

            setNotifications(newNotifs);
            setUnreadCount(newUnread);
          }
        } catch (e) {
          // Silencioso
        }
      };

      loadNotifs();

      // Escuchar eventos en tiempo real mediante SSE
      const unsubscribe = api.subscribeToEvents((event) => {
        if (event.type === 'BOOKING_CHANGED' || event.type === 'NEW_BOOKING') {
          loadNotifs();
          playChime();
        }
      });

      const interval = setInterval(loadNotifs, 25000);

      return () => {
        isMounted = false;
        clearInterval(interval);
        unsubscribe && unsubscribe();
      };
    }
  }, [user, selectedBranch, unreadCount]);

  // Cerrar desplegables al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (branchRef.current && !branchRef.current.contains(event.target)) {
        setShowBranchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (page, params = {}) => {
    setMobileMenuOpen(false);
    setShowNotifDropdown(false);
    setShowBranchDropdown(false);
    onNavigate(page, params);
  };

  const handleSelectBranch = (branch) => {
    selectBranch(branch);
    setShowBranchDropdown(false);
    setIsBranchModalOpen(false);
  };

  const toggleSound = () => {
    initAudio();
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      setTimeout(() => playChime(), 100);
    }
  };

  const isAdminOrEncargado = user && (user.role === 'ADMINISTRADOR' || user.role === 'ADMIN_GENERAL' || user.role === 'ENCARGADO');

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(215, 127, 161, 0.25)',
        boxShadow: '0 4px 20px rgba(196, 106, 134, 0.08)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo y Nombre Oficial */}
          <div 
            onClick={() => handleNav('home')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '2px solid #B8860B',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(184, 134, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFF8F0',
              flexShrink: 0
            }}>
              <img 
                src="/logo-talitakumi.png" 
                alt="Logo Hermosa Talita Kumi" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/logo-talitakumi.jpg';
                }}
              />
            </div>
            <div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                letterSpacing: '-0.2px',
                color: '#C46A86',
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.15
              }}>
                HERMOSA TALITA KUMI
              </div>
              <div style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#B8860B',
                fontWeight: '700'
              }}>
                Centro Estético Facial & Corporal
              </div>
            </div>
          </div>

          {/* Selector de Sucursal Persistente en Barra Superior */}
          <div ref={branchRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '30px',
                border: '1.5px solid #F6C6D3',
                backgroundColor: '#FFF8F0',
                color: '#C46A86',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(196, 106, 134, 0.1)'
              }}
              title="Cambiar sucursal activa"
            >
              <MapPin size={16} color="#B8860B" />
              <span>{selectedBranch?.name || 'Villa Fátima'}</span>
              <span style={{ fontSize: '0.72rem', color: '#B8860B', marginLeft: '2px' }}>
                ({selectedBranch?.city || 'La Paz'})
              </span>
              <ChevronDown size={14} />
            </button>

            {/* Desplegable de Sucursales */}
            {showBranchDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                border: '1px solid #F6C6D3',
                padding: '0.5rem',
                zIndex: 1100
              }}>
                <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', fontWeight: '800', color: '#B8860B', textTransform: 'uppercase' }}>
                  Selecciona tu sucursal:
                </div>
                {branches.map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBranch(b)}
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      backgroundColor: selectedBranch?.id === b.id ? '#FDF1F4' : 'transparent',
                      borderLeft: selectedBranch?.id === b.id ? '4px solid #C46A86' : '4px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#333333', fontSize: '0.9rem' }}>{b.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#B8860B', fontWeight: '600' }}>{b.city}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666666' }}>{b.zone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menú de Navegación Escritorio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="desktop-menu">
            <button 
              onClick={() => handleNav('home')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: currentPage === 'home' ? '800' : '600',
                color: currentPage === 'home' ? '#C46A86' : '#4A4A4A',
                fontSize: '0.92rem'
              }}
            >
              Inicio
            </button>

            <button 
              onClick={() => handleNav('branches')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: currentPage === 'branches' ? '800' : '600',
                color: currentPage === 'branches' ? '#C46A86' : '#4A4A4A',
                fontSize: '0.92rem'
              }}
            >
              Sucursales
            </button>

            <button 
              onClick={() => handleNav('services')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: currentPage === 'services' ? '800' : '600',
                color: currentPage === 'services' ? '#C46A86' : '#4A4A4A',
                fontSize: '0.92rem'
              }}
            >
              Servicios
            </button>

            <button 
              onClick={() => handleNav('products')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: currentPage === 'products' ? '800' : '600',
                color: currentPage === 'products' ? '#C46A86' : '#4A4A4A',
                fontSize: '0.92rem',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <ShoppingBag size={15} />
              Productos
            </button>

            <button 
              onClick={() => handleNav('promotions')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: currentPage === 'promotions' ? '800' : '600',
                color: currentPage === 'promotions' ? '#C46A86' : '#4A4A4A',
                fontSize: '0.92rem',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Tag size={15} color="#B8860B" />
              Promociones
            </button>

            {/* Botón Destacado Reservar Cita (Única vía oficial al flujo de agendamiento) */}
            <button 
              onClick={() => handleNav('booking')}
              style={{
                background: 'linear-gradient(135deg, #C46A86 0%, #D77FA1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(196, 106, 134, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Calendar size={16} />
              Agendar Cita
            </button>
          </div>

          {/* Opciones de Usuario y Acceso (Sin campana ni íconos de bocina - Módulo 07 y 13) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Botón de Usuario / Rol */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isAdminOrEncargado ? (
                  <button
                    onClick={() => handleNav('admin-dashboard')}
                    style={{
                      backgroundColor: '#B8860B',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Shield size={14} />
                    {user.role === 'ENCARGADO' ? 'Panel Encargado' : 'Panel Admin'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('profile')}
                    style={{
                      backgroundColor: '#FDF1F4',
                      color: '#C46A86',
                      border: '1.5px solid #F6C6D3',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <User size={14} />
                    Mi Cuenta
                  </button>
                )}

                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => handleNav('login')}
                  style={{
                    background: 'none',
                    border: '1px solid #C46A86',
                    color: '#C46A86',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Ingresar
                </button>
              </div>
            )}

            {/* Botón Menú Móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#C46A86',
                cursor: 'pointer',
                padding: '4px'
              }}
              className="mobile-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F6C6D3',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <button onClick={() => handleNav('home')} style={mobileBtnStyle}>Inicio</button>
            <button onClick={() => handleNav('branches')} style={mobileBtnStyle}>Sucursales</button>
            <button onClick={() => handleNav('services')} style={mobileBtnStyle}>Servicios</button>
            <button onClick={() => handleNav('products')} style={mobileBtnStyle}>Productos</button>
            <button onClick={() => handleNav('promotions')} style={mobileBtnStyle}>Promociones</button>
            <button 
              onClick={() => handleNav('booking')} 
              style={{
                ...mobileBtnStyle,
                background: 'linear-gradient(135deg, #C46A86 0%, #D77FA1 100%)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.75rem'
              }}
            >
              Agendar Cita
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

const mobileBtnStyle = {
  background: 'none',
  border: 'none',
  textAlign: 'left',
  padding: '0.5rem',
  fontSize: '1rem',
  fontWeight: '700',
  color: '#4A4A4A',
  cursor: 'pointer'
};
