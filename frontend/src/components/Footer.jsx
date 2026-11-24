import React from 'react';
import { Link } from 'react-router-dom';
import { useBranch } from '../context/BranchContext';
import { whatsappUrl } from '../utils/format';
import { MapPin, MessageCircle, Clock } from 'lucide-react';

export default function Footer() {
  const { sucursalesActivas } = useBranch();

  return (
    <footer
      style={{
        backgroundColor: '#2C1622',
        color: '#FFF8F0',
        padding: '3rem 1.5rem 2rem',
        marginTop: '3rem',
        borderTop: '3px solid #B8860B',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h3 style={{ color: '#F7DFA8', fontSize: '1.3rem', marginBottom: '0.65rem' }}>
            HERMOSA TALITA KUMI
          </h3>
          <p style={{ color: '#E5CAD4', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Centro estético integral en La Paz y El Alto, Bolivia. Atención cálida, reservas en tiempo real y
            seguimiento personalizado.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.9rem', color: '#F7DFA8', fontSize: '0.86rem' }}>
            <Clock size={15} /> Lunes a Sábado: 08:30 – 19:30 (UTC-4)
          </div>
        </div>

        <div>
          <h4 style={{ color: '#F7DFA8', fontSize: '1rem', marginBottom: '0.75rem' }}>Navegación</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.9rem', color: '#F6C6D3' }}>
            <Link to="/">Inicio</Link>
            <Link to="/servicios">Servicios y precios</Link>
            <Link to="/sucursales">Nuestras 4 sucursales</Link>
            <Link to="/reservar">Agendar una cita</Link>
            <Link to="/login">Acceso de clientes y personal</Link>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#F7DFA8', fontSize: '1rem', marginBottom: '0.75rem' }}>Sucursales Oficiales</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem', color: '#E5CAD4' }}>
            {sucursalesActivas.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#F7DFA8" /> {s.nombre} ({s.ciudad})
                </span>
                <a
                  href={whatsappUrl(s.whatsapp, `Hola, consulto por la sucursal ${s.nombre} de HERMOSA TALITA KUMI.`)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#4ADE80', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}
                >
                  <MessageCircle size={13} /> {s.whatsapp}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: '1px solid rgba(246, 198, 211, 0.2)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#C8AAB7',
          gap: '0.5rem',
        }}
      >
        <span>© {new Date().getFullYear()} HERMOSA TALITA KUMI — Todos los derechos reservados.</span>
        <span>Moneda: Bolivianos (Bs) • Zona Horaria: America/La_Paz</span>
      </div>
    </footer>
  );
}
