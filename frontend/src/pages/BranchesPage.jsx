import React from 'react';
import { Link } from 'react-router-dom';
import { useBranch } from '../context/BranchContext';
import { whatsappUrl } from '../utils/format';
import { MapPin, Clock, MessageCircle, Navigation, Users, Calendar } from 'lucide-react';

const DIAS_LABEL = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export default function BranchesPage() {
  const { sucursalesActivas } = useBranch();

  function formatearDias(dias = [1, 2, 3, 4, 5, 6]) {
    if (dias.length === 6 && !dias.includes(0)) return 'Lunes a Sábado';
    return dias.map((d) => DIAS_LABEL[d] || d).join(', ');
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span className="badge badge-gold">La Paz y El Alto, Bolivia</span>
        <h1 style={{ fontSize: '2.3rem', color: '#C46A86', marginTop: '0.5rem' }}>Nuestras 4 Sucursales</h1>
        <p style={{ color: '#6C525F', maxWidth: '680px', margin: '0.4rem auto 0' }}>
          Encuentra dirección, horario de atención, capacidad simultánea y contacto directo por WhatsApp de cada sede.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {sucursalesActivas.map((s) => (
          <section key={s.id} className="card-elegant" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid #FDF1F4', paddingBottom: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase' }}>
                  Ciudad de {s.ciudad}
                </div>
                <h2 style={{ fontSize: '1.8rem', color: '#C46A86' }}>{s.nombre}</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-gold">
                  <Users size={13} /> Capacidad: {s.capacidad || 2} especialistas simultáneos
                </span>
                <span className="badge badge-mauve">Intervalos cada {s.horario?.slotMin || 30} min</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <MapPin size={20} color="#C46A86" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Dirección</div>
                    <div style={{ color: '#6C525F', fontSize: '0.92rem' }}>{s.direccion}</div>
                    {s.referencia && <div style={{ color: '#8A6F7D', fontSize: '0.84rem' }}>Ref: {s.referencia}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <Clock size={20} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Horario de atención (America/La_Paz)</div>
                    <div style={{ color: '#6C525F', fontSize: '0.92rem' }}>
                      {formatearDias(s.horario?.dias)}: {s.horario?.apertura || '08:30'} – {s.horario?.cierre || '19:30'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={whatsappUrl(s.whatsapp, `Hola, quisiera consultar disponibilidad en la sucursal ${s.nombre} de HERMOSA TALITA KUMI.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp-pulse"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFF',
                      padding: '0.72rem 1.35rem',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <MessageCircle size={17} /> WhatsApp ({s.whatsapp})
                  </a>

                  <Link to={`/reservar?sucursalId=${s.id}`} className="btn-primary" style={{ padding: '0.72rem 1.35rem', fontSize: '0.9rem' }}>
                    <Calendar size={16} /> Reservar aquí
                  </Link>

                  {s.googleMapsUrl && (
                    <a
                      href={s.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '0.7rem 1.2rem', fontSize: '0.88rem' }}
                    >
                      <Navigation size={15} /> Cómo llegar
                    </a>
                  )}
                </div>
              </div>

              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #F7DFA8', minHeight: '240px' }}>
                <iframe
                  title={`Mapa ${s.nombre}`}
                  src={s.mapEmbedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(s.nombre + ' ' + s.ciudad + ' Bolivia')}&z=15&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
