import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles = [], children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#6C525F' }}>
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card-elegant" style={{ maxWidth: '520px', margin: '0 auto', padding: '2.5rem' }}>
          <h2 style={{ color: '#C46A86', marginBottom: '0.75rem' }}>Acceso restringido</h2>
          <p style={{ color: '#6C525F', marginBottom: '1.5rem' }}>
            Tu cuenta con rol <strong>{role}</strong> no tiene permisos para ingresar a esta sección.
          </p>
          <a href="/" className="btn-primary">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return children;
}
