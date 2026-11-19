import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Clock, Heart, ShieldCheck, ExternalLink, MessageCircle } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-combined-hero" style={{
      borderTop: '2px solid #F6C6D3',
      marginTop: '5rem',
      padding: '4rem 1.5rem 2rem',
      boxShadow: '0 -4px 20px rgba(196, 106, 134, 0.06)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        {/* Marca y Misión Cristiana */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.2rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '2px solid #B8860B',
              overflow: 'hidden',
              boxShadow: '0 3px 10px rgba(184, 134, 11, 0.3)',
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
                color: '#C46A86',
                fontFamily: "'Playfair Display', Georgia, serif"
              }}>
                HERMOSA TALITA KUMI
              </div>
              <div style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                color: '#B8860B',
                fontWeight: '700'
              }}>
                Centro Estético Facial & Corporal Cristiano
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFF8F0',
            borderLeft: '3px solid #B8860B',
            padding: '0.85rem 1rem',
            borderRadius: '0 10px 10px 0',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: '#444444'
          }}>
            "Y tomando la mano de la niña, le dijo: Talita cumi; que traducido es: Niña, a ti te digo, levántate."
            <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.8rem', color: '#B8860B', marginTop: '0.2rem' }}>
              — Marcos 5:41
            </div>
          </div>

          <p style={{ color: '#666666', fontSize: '0.88rem', lineHeight: '1.6' }}>
            Cuidado integral del templo del Espíritu Santo con tratamientos faciales, Baño de Luna y relajación corporal en un ambiente de respeto, paz y calidez.
          </p>
        </div>

        {/* Las 4 Sucursales Oficiales */}
        <div>
          <h4 style={{
            fontSize: '1.05rem',
            fontWeight: '800',
            color: '#C46A86',
            marginBottom: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Playfair Display', Georgia, serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <MapPin size={18} color="#B8860B" /> Nuestras 4 Sucursales
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
            {/* Sede 1: Villa Fátima */}
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #FDF1F4' }}>
              <div style={{ fontWeight: '800', color: '#333333' }}>
                📍 Villa Fátima (La Paz)
              </div>
              <div style={{ color: '#666666' }}>Av. Las Américas esq. Plaza del Maestro [DEMO]</div>
              <div style={{ color: '#B8860B', fontWeight: '700', marginTop: '2px' }}>
                WhatsApp: +591 62353452
              </div>
            </div>

            {/* Sede 2: UPEA – El Alto */}
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #FDF1F4' }}>
              <div style={{ fontWeight: '800', color: '#333333' }}>
                📍 UPEA – El Alto
              </div>
              <div style={{ color: '#666666' }}>Zona UPEA, avenida principal (referencial) [DEMO]</div>
              <div style={{ color: '#B8860B', fontWeight: '700', marginTop: '2px' }}>
                WhatsApp Central: +591 62353452
              </div>
            </div>

            {/* Sede 3: Ceja – El Alto */}
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #FDF1F4' }}>
              <div style={{ fontWeight: '800', color: '#333333' }}>
                📍 Ceja – El Alto
              </div>
              <div style={{ color: '#666666' }}>Zona Ceja, avenida principal (referencial) [DEMO]</div>
              <div style={{ color: '#B8860B', fontWeight: '700', marginTop: '2px' }}>
                WhatsApp Central: +591 62353452
              </div>
            </div>

            {/* Sede 4: Max Paredes */}
            <div>
              <div style={{ fontWeight: '800', color: '#333333' }}>
                📍 Max Paredes (La Paz)
              </div>
              <div style={{ color: '#666666' }}>Av. Buenos Aires esq. Max Paredes [DEMO]</div>
              <div style={{ color: '#B8860B', fontWeight: '700', marginTop: '2px' }}>
                WhatsApp: +591 62353452
              </div>
            </div>
          </div>
        </div>

        {/* Horarios y Navegación Rápida */}
        <div>
          <h4 style={{
            fontSize: '1.05rem',
            fontWeight: '800',
            color: '#C46A86',
            marginBottom: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Playfair Display', Georgia, serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Clock size={18} color="#B8860B" /> Horario y Contacto
          </h4>

          <div style={{ backgroundColor: '#FFF8F0', padding: '1rem', borderRadius: '14px', border: '1px solid #F6C6D3', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: '800', color: '#C46A86', fontSize: '0.9rem', marginBottom: '4px' }}>
              Lunes a Sábado:
            </div>
            <div style={{ fontSize: '0.86rem', color: '#444444', marginBottom: '6px' }}>
              08:30 a 19:30 (Jornada Continua)
            </div>
            <div style={{ fontWeight: '800', color: '#B8860B', fontSize: '0.9rem', marginBottom: '4px' }}>
              Domingos:
            </div>
            <div style={{ fontSize: '0.86rem', color: '#777777' }}>
              Cerrado por reposo y descanso espiritual
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button onClick={() => onNavigate('home')} style={footerLinkStyle}>• Inicio</button>
            <button onClick={() => onNavigate('services')} style={footerLinkStyle}>• Servicios (7 Categorías)</button>
            <button onClick={() => onNavigate('products')} style={footerLinkStyle}>• Catálogo de Productos</button>
            <button onClick={() => onNavigate('branches')} style={footerLinkStyle}>• Sucursales</button>
            <button onClick={() => onNavigate('promotions')} style={footerLinkStyle}>• Promociones Especiales</button>
            <button onClick={() => onNavigate('booking')} style={{ ...footerLinkStyle, color: '#C46A86', fontWeight: '800' }}>• Agendar Cita</button>
          </div>
        </div>
      </div>

      {/* Barra Inferior de Derechos */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid #F5F5DC',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.82rem',
        color: '#888888'
      }}>
        <div>
          © 2026 HERMOSA TALITA KUMI. Todos los derechos reservados. Villa Fátima, UPEA, Ceja, Max Paredes.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Moneda: Bolivianos (Bs)</span>
          <span>Zona Horaria: America/La_Paz</span>
        </div>
      </div>
    </footer>
  );
}

const footerLinkStyle = {
  background: 'none',
  border: 'none',
  textAlign: 'left',
  padding: '2px 0',
  color: '#555555',
  fontSize: '0.86rem',
  cursor: 'pointer',
  transition: 'color 0.2s'
};
