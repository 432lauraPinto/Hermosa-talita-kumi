import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  User,
  Sparkles,
  FileText,
} from 'lucide-react';

export default function Navbar() {
  const { user, isStaff, isCliente, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) => ({
    padding: '0.45rem 0.9rem',
    borderRadius: '999px',
    fontWeight: isActive ? 800 : 600,
    fontSize: '0.92rem',
    color: isActive ? '#9F3E5E' : '#4A3B43',
    backgroundColor: isActive ? '#FFE8F0' : 'transparent',
    transition: 'all 0.2s ease',
  });

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 250, 246, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid #F6C6D3',
        boxShadow: '0 4px 16px rgba(196, 106, 134, 0.08)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          gap: '1rem',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-official-badge">
            <img
              src="/logo-talitakumi.png"
              alt="Hermosa Talita Kumi"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '/logo-talitakumi.jpg';
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 800,
                fontSize: '1.08rem',
                color: '#C46A86',
                lineHeight: 1.15,
              }}
            >
              HERMOSA TALITA KUMI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#B8860B', fontWeight: 700, letterSpacing: '0.5px' }}>
              LA PAZ & EL ALTO • CENTRO ESTÉTICO
            </div>
          </div>
        </Link>

        {/* Navegación principal */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexWrap: 'wrap',
          }}
        >
          <NavLink to="/" end style={linkStyle}>
            Inicio
          </NavLink>
          <NavLink to="/servicios" style={linkStyle}>
            Servicios
          </NavLink>
          <NavLink to="/sucursales" style={linkStyle}>
            Sucursales
          </NavLink>

          {user && isCliente && (
            <>
              <NavLink to="/reservar" style={linkStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={15} /> Reservar
                </span>
              </NavLink>
              <NavLink to="/mis-citas" style={linkStyle}>
                Mis citas
              </NavLink>
              <NavLink to="/mi-historial" style={linkStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={15} /> Mi historial
                </span>
              </NavLink>
            </>
          )}

          {user && isStaff && (
            <NavLink to="/panel" style={linkStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <LayoutDashboard size={15} /> Panel {user.role === 'admin' ? 'Admin' : 'Encargado'}
              </span>
            </NavLink>
          )}
        </nav>

        {/* Acciones de sesión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {!user ? (
            <>
              <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}>
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn-primary" style={{ padding: '0.52rem 1.15rem', fontSize: '0.88rem' }}>
                <Sparkles size={15} /> Registrarse
              </Link>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-gold" title={user.email}>
                <User size={13} /> {user.nombre.split(' ')[0]} ({user.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
                title="Cerrar sesión"
              >
                <LogOut size={15} /> Salir
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menú"
            style={{ display: 'none', color: '#C46A86' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
