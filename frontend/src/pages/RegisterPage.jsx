import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { traducirErrorAuth } from '../utils/authErrors';
import {
  evaluarFortalezaPassword,
  validarEmail,
  validarNombreCompleto,
  validarTelefonoBolivia,
} from '../utils/validators';
import { UserPlus, Eye, EyeOff, CheckCircle2, Circle, MapPin } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { sucursalesActivas } = useBranch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    telefonoLocal: '',
    email: '',
    password: '',
    confirmPassword: '',
    sucursalPreferida: '',
    aceptaWhatsapp: true,
    aceptaTerminos: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fortaleza = useMemo(() => evaluarFortalezaPassword(form.password), [form.password]);
  const passwordsCoinciden = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const checkNombre = validarNombreCompleto(form.nombre);
    if (!checkNombre.valido) {
      setError(checkNombre.motivo);
      return;
    }

    const checkTel = validarTelefonoBolivia(form.telefonoLocal);
    if (!checkTel.valido) {
      setError(checkTel.motivo);
      return;
    }

    const checkEmail = validarEmail(form.email);
    if (!checkEmail.valido) {
      setError(checkEmail.motivo);
      return;
    }

    if (!fortaleza.cumplePolitica) {
      setError('La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!form.aceptaTerminos) {
      setError('Debes aceptar los Términos de uso, Privacidad y la política de cancelación (2 h).');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        nombre: checkNombre.valor,
        telefono: checkTel.valor,
        email: checkEmail.valor,
        password: form.password,
        sucursalPreferida: form.sucursalPreferida || null,
        aceptaWhatsapp: form.aceptaWhatsapp,
        aceptaTerminos: form.aceptaTerminos,
      });
      navigate('/reservar', { replace: true });
    } catch (err) {
      setError(traducirErrorAuth(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '560px' }}>
      <div className="card-elegant" style={{ padding: '2.2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.9rem', color: '#C46A86' }}>Crear cuenta de cliente</h1>
          <p style={{ color: '#6C525F', fontSize: '0.92rem' }}>
            Regístrate para reservar citas en tiempo real, reprogramar y revisar tu historial de tratamientos y pagos.
          </p>
        </div>

        {error && (
          <div
            className="badge badge-danger"
            style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre completo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Nombre y apellido *
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              className="form-control"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Ana María Quispe"
            />
          </div>

          {/* Celular WhatsApp Bolivia */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Celular WhatsApp (Bolivia) *
            </label>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.9rem',
                  borderRadius: '14px',
                  border: '2px solid #E5B9C7',
                  backgroundColor: '#FDF1F4',
                  fontWeight: 800,
                  color: '#9F3E5E',
                  fontSize: '0.92rem',
                  whiteSpace: 'nowrap',
                }}
              >
                +591
              </span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={8}
                className="form-control"
                value={form.telefonoLocal}
                onChange={(e) =>
                  setForm({ ...form, telefonoLocal: e.target.value.replace(/\D/g, '').slice(0, 8) })
                }
                placeholder="77197857 (8 dígitos)"
              />
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6C525F', marginTop: '0.25rem' }}>
              Número móvil boliviano de 8 dígitos (inicia con 6 o 7) para avisos de tus citas.
            </div>
          </div>

          {/* Correo electrónico */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Correo electrónico *
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@ejemplo.com"
            />
          </div>

          {/* Contraseña + medidor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número"
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
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Barra de fortaleza y requisitos */}
            {form.password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#6C525F' }}>Seguridad de contraseña</span>
                  <strong style={{ color: fortaleza.color }}>{fortaleza.etiqueta}</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: '#F3E5EA', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${fortaleza.porcentaje}%`,
                      height: '100%',
                      backgroundColor: fortaleza.color,
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.75rem' }}>
                  <Requisito ok={fortaleza.requisitos.tieneLongitud} texto="8+ caracteres" />
                  <Requisito ok={fortaleza.requisitos.tieneMayuscula} texto="1 mayúscula" />
                  <Requisito ok={fortaleza.requisitos.tieneNumero} texto="1 número" />
                </div>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Confirmar contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className="form-control"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña"
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6C525F',
                  display: 'flex',
                }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirmPassword.length > 0 && (
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: passwordsCoinciden ? '#156E42' : '#B52825',
                }}
              >
                {passwordsCoinciden ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'}
              </div>
            )}
          </div>

          {/* Sucursal preferida (opcional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <MapPin size={14} style={{ verticalAlign: 'middle' }} /> Sucursal preferida (opcional)
            </label>
            <select
              className="form-control"
              value={form.sucursalPreferida}
              onChange={(e) => setForm({ ...form, sucursalPreferida: e.target.value })}
            >
              <option value="">Seleccionar después</option>
              {sucursalesActivas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudad})
                </option>
              ))}
            </select>
          </div>

          {/* Consentimientos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', backgroundColor: '#FFF9F6', padding: '0.9rem 1rem', borderRadius: '14px', border: '1px solid #F6C6D3' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.83rem', color: '#4A3B43', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.aceptaWhatsapp}
                onChange={(e) => setForm({ ...form, aceptaWhatsapp: e.target.checked })}
                style={{ marginTop: '3px' }}
              />
              <span>Deseo recibir confirmaciones y recordatorios de mis citas por WhatsApp.</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.83rem', color: '#2C1622', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={form.aceptaTerminos}
                onChange={(e) => setForm({ ...form, aceptaTerminos: e.target.checked })}
                style={{ marginTop: '3px' }}
              />
              <span>
                Acepto los Términos de uso, el tratamiento privado de mis datos y la política de cancelación o
                reprogramación con al menos <strong>2 horas de anticipación</strong>. *
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>
            <UserPlus size={17} /> {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#6C525F' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#C46A86', fontWeight: 800 }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function Requisito({ ok, texto }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: ok ? '#156E42' : '#6C525F', fontWeight: ok ? 700 : 500 }}>
      {ok ? <CheckCircle2 size={13} /> : <Circle size={13} />} {texto}
    </span>
  );
}
