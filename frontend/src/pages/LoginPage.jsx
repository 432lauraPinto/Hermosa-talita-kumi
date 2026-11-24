import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { USE_EMULATORS } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { traducirErrorAuth } from '../utils/authErrors';
import { validarEmail } from '../utils/validators';
import { LogIn, KeyRound, Eye, EyeOff, Mail, X } from 'lucide-react';

const CUENTAS_DEMO = [
  { label: 'Admin General', email: 'admin@talitakumi.com', pass: 'Admin123!' },
  { label: 'Encargada Villa Fátima', email: 'encargado.villafatima@talitakumi.com', pass: 'Encargado123!' },
  { label: 'Encargada UPEA', email: 'encargado.upea@talitakumi.com', pass: 'Encargado123!' },
  { label: 'Cliente Demo', email: 'cliente@talitakumi.com', pass: 'Cliente123!' },
];

export default function LoginPage() {
  const { login, resetPassword, authNotice, clearAuthNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal recuperación de contraseña
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    clearAuthNotice();

    const checkMail = validarEmail(email);
    if (!checkMail.valido) {
      setError(checkMail.motivo);
      return;
    }

    setSubmitting(true);
    try {
      const { profile } = await login(checkMail.valor, password);
      const role = profile?.role || 'cliente';
      const from = location.state?.from;

      if (role === 'admin' || role === 'encargado') {
        const destino = from && from.startsWith('/panel') ? from : '/panel';
        navigate(destino, { replace: true });
      } else {
        const destino =
          from && from !== '/login' && from !== '/registro' && !from.startsWith('/panel')
            ? from
            : '/mis-citas';
        navigate(destino, { replace: true });
      }
    } catch (err) {
      setError(traducirErrorAuth(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError('');
    setResetMsg('');

    const checkMail = validarEmail(resetEmail);
    if (!checkMail.valido) {
      setResetError(checkMail.motivo);
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(checkMail.valor);
      // Mensaje neutral anti-enumeración de cuentas
      setResetMsg(
        'Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.'
      );
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setResetMsg(
          'Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.'
        );
      } else {
        setResetError(traducirErrorAuth(err));
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '500px' }}>
      <div className="card-elegant" style={{ padding: '2.2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.9rem', color: '#C46A86' }}>Iniciar sesión</h1>
          <p style={{ color: '#6C525F', fontSize: '0.92rem' }}>
            Accede a tus citas, historial o panel administrativo.
          </p>
        </div>

        {(error || authNotice) && (
          <div
            className="badge badge-danger"
            style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}
          >
            {error || authNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 700 }}>Contraseña</label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetMsg('');
                  setResetError('');
                  setResetOpen(true);
                }}
                style={{ fontSize: '0.8rem', color: '#9F3E5E', fontWeight: 700, textDecoration: 'underline' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6C525F',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>
            <LogIn size={17} /> {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#6C525F' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: '#C46A86', fontWeight: 800 }}>
            Regístrate aquí
          </Link>
        </div>

        {/* Accesos rápidos visibles ÚNICAMENTE en modo emulador local */}
        {USE_EMULATORS && (
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed #E5B9C7' }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#B8860B',
                marginBottom: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <KeyRound size={14} /> Accesos demo del emulador local (seed.js)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {CUENTAS_DEMO.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => {
                    setEmail(c.email);
                    setPassword(c.pass);
                    setError('');
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.7rem',
                    borderRadius: '10px',
                    border: '1px solid #F6C6D3',
                    backgroundColor: '#FFF9F6',
                    fontSize: '0.78rem',
                    color: '#4A3B43',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#9F3E5E' }}>{c.label}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal recuperación de contraseña */}
      {resetOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ color: '#C46A86', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Mail size={20} /> Restablecer contraseña
              </h2>
              <button type="button" onClick={() => setResetOpen(false)} aria-label="Cerrar">
                <X size={20} color="#6C525F" />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#6C525F', marginBottom: '1rem' }}>
              Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para crear una nueva contraseña.
            </p>

            {resetError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '0.7rem 0.9rem', borderRadius: '10px', marginBottom: '0.9rem' }}>
                {resetError}
              </div>
            )}
            {resetMsg && (
              <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem 0.95rem', borderRadius: '10px', marginBottom: '0.9rem' }}>
                {resetMsg}
                {USE_EMULATORS && (
                  <div style={{ fontSize: '0.76rem', marginTop: '0.35rem', fontWeight: 600 }}>
                    En el emulador local puedes ver el enlace generado en la consola del emulador de Firebase.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <input
                type="email"
                required
                className="form-control"
                placeholder="correo@ejemplo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" onClick={() => setResetOpen(false)} className="btn-secondary">
                  Cerrar
                </button>
                <button type="submit" disabled={resetLoading} className="btn-primary">
                  {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
