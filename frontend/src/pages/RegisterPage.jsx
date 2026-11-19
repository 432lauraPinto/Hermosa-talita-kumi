import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, Phone, AlertCircle, Calendar } from 'lucide-react';

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    skin_type: 'Normal/Mixta',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Nombre, correo electrónico y contraseña son obligatorios.');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      onNavigate('profile');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Verifica los datos ingresados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '3.5rem auto', padding: '0 1.5rem' }} className="animate-fade-in">
      <div className="card" style={{ padding: '2.5rem' }}>
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
            Registro de Nueva Ficha de Cliente
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Centro Estético Cristiano Hermosa Talita Kumi • La Paz y El Alto
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Carolina Mendoza"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="carolina@ejemplo.com"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+591 70000000"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Piel (Autoevaluación inicial)</label>
              <select
                name="skin_type"
                value={formData.skin_type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Normal/Mixta">Normal / Mixta</option>
                <option value="Grasa con tendencia acneica">Grasa con tendencia acneica</option>
                <option value="Seca / Deshidratada">Seca / Deshidratada</option>
                <option value="Sensible con rojeces">Sensible con rojeces</option>
                <option value="Madura / Con líneas finas">Madura / Con líneas finas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contacto de Emergencia</label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Nombre de familiar o allegado"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono de Emergencia</label>
              <input
                type="text"
                name="emergency_phone"
                value={formData.emergency_phone}
                onChange={handleChange}
                placeholder="+591 71111111"
                className="form-control"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginTop: '1.5rem', fontSize: '1rem' }}
          >
            {loading ? 'Creando ficha de cliente...' : 'Registrar Ficha y Acceder'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          ¿Ya tienes cuenta registrada?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{ color: 'var(--color-mauve)', fontWeight: '700', textDecoration: 'underline' }}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
}
