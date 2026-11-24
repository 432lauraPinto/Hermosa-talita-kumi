import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import {
  LayoutDashboard,
  Calendar,
  Package,
  CreditCard,
  BookOpen,
  Users,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

export default function PanelLayout() {
  const { user, isAdmin } = useAuth();
  const { sucursalesStaff, sucursalActivaId, setSucursalActivaId } = useBranch();

  const tabStyle = ({ isActive }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.6rem 1rem',
    borderRadius: '12px',
    fontWeight: isActive ? 800 : 600,
    fontSize: '0.88rem',
    color: isActive ? '#FFFFFF' : '#4A3B43',
    backgroundColor: isActive ? '#C46A86' : '#FFFFFF',
    border: isActive ? '1.5px solid #9F3E5E' : '1.5px solid #F6C6D3',
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Cabecera de panel + selector de sucursal activa */}
      <div
        className="card-elegant"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span className="badge badge-gold">
            {isAdmin ? 'Administrador General (4 sucursales)' : 'Encargado de Sucursal'}
          </span>
          <h1 style={{ fontSize: '1.7rem', color: '#C46A86', marginTop: '0.35rem' }}>
            Panel de Gestión — {user?.nombre}
          </h1>
        </div>

        <div style={{ minWidth: '240px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#6C525F', marginBottom: '0.3rem' }}>
            <MapPin size={13} style={{ verticalAlign: 'middle' }} /> Sucursal de trabajo activa
          </label>
          <select
            className="form-control"
            value={sucursalActivaId}
            onChange={(e) => setSucursalActivaId(e.target.value)}
            style={{ padding: '0.55rem 0.85rem' }}
          >
            {sucursalesStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-navegación del panel */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginBottom: '1.5rem' }}>
        <NavLink to="/panel" end style={tabStyle}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/panel/agenda" style={tabStyle}>
          <Calendar size={16} /> Agenda de citas
        </NavLink>
        <NavLink to="/panel/inventario" style={tabStyle}>
          <Package size={16} /> Inventario
        </NavLink>
        <NavLink to="/panel/clientes" style={tabStyle}>
          <CreditCard size={16} /> Tratamientos y Pagos
        </NavLink>
        {isAdmin && (
          <>
            <NavLink to="/panel/catalogo" style={tabStyle}>
              <BookOpen size={16} /> Catálogo
            </NavLink>
            <NavLink to="/panel/usuarios" style={tabStyle}>
              <Users size={16} /> Usuarios
            </NavLink>
            <NavLink to="/panel/auditoria" style={tabStyle}>
              <ShieldCheck size={16} /> Auditoría y Consolidado
            </NavLink>
          </>
        )}
      </nav>

      <Outlet />
    </div>
  );
}
