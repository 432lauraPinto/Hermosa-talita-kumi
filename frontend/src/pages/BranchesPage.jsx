import React from 'react';
import { useBranch } from '../context/BranchContext';
import { 
  MapPin, MessageCircle, Clock, Navigation, ExternalLink, Info, Compass
} from 'lucide-react';

export default function BranchesPage() {
  const { branches } = useBranch();

  // Coordenadas o enlaces referenciales para Google Maps Embed (Módulo 06)
  const getMapEmbedSrc = (branch) => {
    if (branch.map_embed_url) return branch.map_embed_url;
    // Embed interactivo por búsqueda oficial o coordenadas por sede
    const query = encodeURIComponent(`Hermosa Talita Kumi ${branch.name} ${branch.city} Bolivia`);
    return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
  };

  // Enlace "Cómo llegar" a Google Maps Directions (Módulo 06)
  const getDirectionsUrl = (branch) => {
    if (branch.google_maps_url) return branch.google_maps_url;
    const dest = encodeURIComponent(`Hermosa Talita Kumi ${branch.name} ${branch.city} Bolivia`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  };

  // Botón "Escribir por WhatsApp" central único (+591 62353452 - Módulo 07)
  const getWhatsAppLink = (branch) => {
    const rawNumber = (branch.whatsapp || '62353452').replace(/[^0-9]/g, '');
    const cleanNumber = rawNumber.startsWith('591') ? rawNumber : `591${rawNumber}`;
    const textMsg = encodeURIComponent(
      `Hola, quisiera consultar los servicios y horarios de la sucursal ${branch.name} de Talita Kumi.`
    );
    return `https://wa.me/${cleanNumber}?text=${textMsg}`;
  };

  return (
    <div style={{ backgroundColor: '#FFF8F0', minHeight: '100vh', padding: '3.5rem 1.5rem', color: '#333333' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Cabecera Informativa Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
            Área Metropolitana de La Paz y El Alto
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.5rem',
            color: '#C46A86',
            margin: '0 0 0.6rem 0',
            fontWeight: '900'
          }}>
            NUESTRAS SUCURSALES
          </h1>
          <p style={{ color: '#666666', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
            Información de ubicación, horarios de atención y mapas interactivos de nuestras cuatro sedes oficiales.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#FDF1F4',
            border: '1.5px solid #F6C6D3',
            padding: '0.65rem 1.25rem',
            borderRadius: '25px',
            marginTop: '1.25rem',
            fontSize: '0.88rem',
            color: '#C46A86'
          }}>
            <Info size={18} color="#C46A86" style={{ flexShrink: 0 }} />
            <span>
              Página exclusivamente informativa. Las citas se reservan únicamente en la sección <strong>Agendar cita</strong>.
            </span>
          </div>
        </div>

        {/* 4 Secciones Independientes por Sucursal (Orden estricto V12) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          {branches.map((branch, index) => (
            <section
              key={branch.id || index}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1.5px solid #F6C6D3',
                boxShadow: '0 10px 30px rgba(196, 106, 134, 0.08)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              {/* 1. Nombre de la Sucursal */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #FFF8F0', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sucursal Oficial • Municipio de {branch.city || branch.municipio || 'La Paz'}
                  </div>
                  <h2 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '2rem',
                    color: '#C46A86',
                    margin: '0.2rem 0 0 0',
                    fontWeight: '800'
                  }}>
                    {branch.name}
                  </h2>
                </div>
                <div style={{
                  backgroundColor: '#FFF8F0',
                  color: '#B8860B',
                  border: '1px solid #F7DFA8',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}>
                  Atención Lunes a Sábado
                </div>
              </div>

              {/* 2. Mapa Interactivo de Google Maps (Grande, responsive, dentro de su propio recuadro) */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid #F7DFA8',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                backgroundColor: '#F5F5DC',
                position: 'relative'
              }}>
                <iframe
                  title={`Mapa de la sucursal ${branch.name}`}
                  src={getMapEmbedSrc(branch)}
                  width="100%"
                  height="340"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  color: '#888888',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '600'
                }}>
                  Ubicación referencial DEMO — confirmar dirección oficial
                </div>
              </div>

              {/* 3. Dirección */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <MapPin size={22} color="#C46A86" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#333333', fontSize: '0.95rem' }}>Dirección</div>
                  <div style={{ color: '#555555', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {branch.address || 'Ubicación pendiente de confirmar'}
                  </div>
                </div>
              </div>

              {/* 4. Referencia */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <Compass size={22} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#333333', fontSize: '0.95rem' }}>Referencia</div>
                  <div style={{ color: '#555555', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {branch.zone || branch.referencia || 'Cerca de una parada de transporte público [DEMO]'}
                  </div>
                </div>
              </div>

              {/* 5. Horario General */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <Clock size={22} color="#C46A86" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#333333', fontSize: '0.95rem' }}>Horario General</div>
                  <div style={{ color: '#555555', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {branch.opening_hours || 'Lunes a Sábado: 08:30 - 19:30 | Domingos cerrado para descanso'}
                  </div>
                </div>
              </div>

              {/* 6. WhatsApp Central y 7. Enlace "Cómo llegar" */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginTop: '0.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #FFF8F0'
              }}>
                {/* 6. Botón Escribir por WhatsApp */}
                <a
                  href={getWhatsAppLink(branch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '25px',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  aria-label={`Escribir por WhatsApp a la sucursal ${branch.name}`}
                >
                  <MessageCircle size={18} />
                  Escribir por WhatsApp
                </a>

                {/* 7. Enlace Cómo llegar (Abre Google Maps con ruta) */}
                <a
                  href={getDirectionsUrl(branch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#FFF8F0',
                    color: '#B8860B',
                    border: '1.5px solid #F7DFA8',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '25px',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Navigation size={18} />
                  Cómo llegar
                  <ExternalLink size={14} style={{ marginLeft: '2px' }} />
                </a>
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
}
