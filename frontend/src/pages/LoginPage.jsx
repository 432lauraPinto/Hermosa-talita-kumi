import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, Shield, User, KeyRound, ArrowRight } from 'lucide-react';

export default function LoginPage({ onNavigate, navParams = {} }) {
  const { login, confirmMFALogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para paso 2FA
  const [mfaState, setMfaState] = useState({ required: false, tempToken: '', code: '' });

  const handlePostLoginRedirect = (resUser) => {
    const bookingCtx = sessionStorage.getItem('htk_booking_context');
    let savedBooking = null;
    if (bookingCtx) {
      try { savedBooking = JSON.parse(bookingCtx); } catch (e) {}
    }

    if (resUser && (resUser.role === 'ADMINISTRADOR' || resUser.role === 'ADMIN_GENERAL' || resUser.role === 'ENCARGADO')) {
      onNavigate('admin-dashboard');
    } else if (navParams.returnTo === 'booking' || savedBooking) {
      sessionStorage.removeItem('htk_booking_context');
      onNavigate('booking', {
        ...(savedBooking || {}),
        ...(navParams || {})
      });
    } else {
      onNavigate('profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res && res.mfaRequired) {
        setMfaState({ required: true, tempToken: res.tempToken, code: '' });
      } else {
        handlePostLoginRedirect(res);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setError('');

    if (!mfaState.code || mfaState.code.trim().length < 6) {
      setError('Por favor ingresa tu código de 6 dígitos o código de respaldo.');
      return;
    }

    try {
      setLoading(true);
      const user = await confirmMFALogin(mfaState.tempToken, mfaState.code.trim());
      handlePostLoginRedirect(user);
    } catch (err) {
      setError(err.message || 'Código de seguridad incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '3.5rem auto',
      padding: '0 1.5rem'
    }} className="animate-fade-in">
      <div className="card-elegant card-gold-border" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 15px 40px rgba(196, 106, 134, 0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo-talitakumi.png"
            alt="Hermosa Talita Kumi"
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'block',
              boxShadow: '0 6px 20px rgba(184, 134, 11, 0.25)',
              border: '2px solid var(--color-gold)'
            }}
          />

          <h2 style={{ fontSize: '1.8rem', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '900', color: 'var(--color-text-dark)' }}>
            {mfaState.required ? 'Verificación de Seguridad (2FA)' : 'Iniciar Sesión'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            Centro Estético Cristiano Hermosa Talita Kumi
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* PASO 2: VERIFICACIÓN TOTP 2FA */}
        {mfaState.required ? (
          <form onSubmit={handleVerifyMFA}>
            <div style={{
              backgroundColor: '#FDF1F4',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #F6C6D3',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              color: '#444444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C46A86', fontWeight: '800', marginBottom: '0.3rem' }}>
                <KeyRound size={18} /> Código Autenticador TOTP
              </div>
              Ingresa el código de 6 dígitos generado por tu aplicación de autenticación (Google Authenticator, Authy) o un código de respaldo.
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>Código de 6 dígitos</label>
              <input
                type="text"
                maxLength={9}
                value={mfaState.code}
                onChange={(e) => setMfaState(prev => ({ ...prev, code: e.target.value }))}
                placeholder="000000 o A1B2-C3D4"
                className="form-control"
                style={{
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  letterSpacing: '4px',
                  fontWeight: '800',
                  padding: '0.75rem'
                }}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', marginBottom: '0.75rem' }}
            >
              {loading ? 'Verificando código...' : 'Verificar e Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => setMfaState({ required: false, tempToken: '', code: '' })}
              style={{ width: '100%', color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '0.5rem' }}
            >
              ← Volver al login normal
            </button>
          </form>
        ) : (
          /* PASO 1: LOGIN NORMAL CON EMAIL Y CONTRASEÑA */
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.9rem' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.9rem' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }}
            >
              {loading ? 'Validando credenciales...' : 'Ingresar a la Plataforma'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          ¿No tienes una cuenta aún?{' '}
          <button
            onClick={() => onNavigate('register')}
            style={{ color: 'var(--color-mauve)', fontWeight: '700', textDecoration: 'underline' }}
          >
            Regístrate aquí
          </button>
        </div>

        {/* DEMO ACCOUNTS QUICK-FILL CARDS */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--color-gold)',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '0.85rem'
          }}>
            Cuentas Oficiales y de Demostración
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@talitakumi.com', 'Admin123!')}
              style={{
                backgroundColor: 'var(--color-floral)',
                border: '1px solid var(--color-champagne)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={16} color="var(--color-gold)" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
                    Administradora General (Jefes)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    admin@talitakumi.com
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--color-gold)' }}>Auto-llenar</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('encargado.lapaz@talitakumi.com', 'Admin123!')}
              style={{
                backgroundColor: '#F9F5FF',
                border: '1px solid #E9D7FE',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={16} color="#7F56D9" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
                    Encargado de Sucursal (Villa Fátima / Max Paredes)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    encargado.lapaz@talitakumi.com
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#7F56D9' }}>Auto-llenar</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('maria.gonzalez@example.com', 'Cliente123!')}
              style={{
                backgroundColor: 'var(--color-blush)',
                border: '1px solid var(--color-rose-pastel)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={16} color="var(--color-mauve)" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-dark)' }}>
                    Cliente (María González)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    maria.gonzalez@example.com
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--color-mauve)' }}>Auto-llenar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
