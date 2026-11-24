import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useBranch } from '../context/BranchContext';
import { formatBs, whatsappUrl } from '../utils/format';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  Feather,
  Tag,
  Users,
} from 'lucide-react';

const HERO_SLIDES = [
  {
    src: '/hero_chica_tratamiento_facial.png',
    badge: 'Tratamiento Facial Exclusivo',
    title: 'Limpieza Profunda & Luminosidad Dérmica',
    description: 'Atención personalizada con activos botánicos hidratantes y purificantes.',
  },
  {
    src: '/hero_chica_producto_serum.png',
    badge: 'Cosmética de Alta Gama',
    title: 'Sérum Revitalizante & Cuidado Diario',
    description: 'Productos certificados para potenciar la tersura y brillo natural de tu piel.',
  },
  {
    src: '/hero_chica_mascarilla_spa.png',
    badge: 'Relax & Bienestar Spa',
    title: 'Baño de Luna & Mascarillas Nutritivas',
    description: 'Protocolos relajantes en un ambiente de calma, dignidad y renovación.',
  },
  {
    src: '/hero_chica_producto_crema.png',
    badge: 'Nutrición Dermo-Cosmética',
    title: 'Crema Hidratante & Cuidado Reafirmante',
    description: 'Fórmulas delicadas que cuidan tu piel reflejando la belleza desde el corazón.',
  },
];

export default function HomePage() {
  const { sucursalesActivas } = useBranch();
  const [slideIdx, setSlideIdx] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [versiculos, setVersiculos] = useState([]);

  useEffect(() => {
    const unsubServ = onSnapshot(collection(db, 'servicios'), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.activo !== false);
      setServicios(items);
    });
    const unsubPromo = onSnapshot(collection(db, 'promociones'), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.activa !== false);
      setPromociones(items);
    });
    const unsubVer = onSnapshot(collection(db, 'versiculos'), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      setVersiculos(items);
    });
    return () => {
      unsubServ();
      unsubPromo();
      unsubVer();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (versiculos.length <= 1) return;
    const t = setInterval(() => setVerseIdx((i) => (i + 1) % versiculos.length), 7000);
    return () => clearInterval(t);
  }, [versiculos.length]);

  const destacados = servicios.filter((s) => s.destacado).slice(0, 6);
  const listaDestacados = destacados.length > 0 ? destacados : servicios.slice(0, 6);
  const versiculoActual = versiculos[verseIdx] || {
    referencia: 'Salmos 139:14',
    version: 'RVR1960',
    texto: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
    reflexion: 'Cada persona es una creación maravillosa y tiene un valor único.',
  };

  return (
    <div>
      {/* HERO */}
      <section className="bg-combined-hero" style={{ padding: '3.2rem 1.5rem', borderBottom: '1px solid #F6C6D3' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span className="badge badge-mauve" style={{ marginBottom: '1rem' }}>
              <Sparkles size={14} color="#B8860B" /> Belleza con Propósito y Cuidado Integral
            </span>

            <h1 style={{ fontSize: 'clamp(2.1rem, 4vw, 3.2rem)', color: '#C46A86', lineHeight: 1.15, marginBottom: '1rem' }}>
              Bienvenida a <br />
              <span style={{ color: '#B8860B' }}>HERMOSA TALITA KUMI</span>
            </h1>

            <p style={{ fontSize: '1.08rem', color: '#4A3B43', fontWeight: 600, marginBottom: '0.85rem' }}>
              Un espacio para dedicarte tiempo, cuidar tu belleza y reservar en línea en nuestras 4 sucursales de La Paz y El Alto.
            </p>

            <div
              className="card-elegant"
              style={{
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                borderLeft: '4px solid #B8860B',
              }}
            >
              <p className="font-scripture" style={{ fontSize: '1.05rem', color: '#2C1622' }}>
                “{versiculoActual.texto}”
              </p>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#B8860B', marginTop: '0.35rem' }}>
                — {versiculoActual.referencia} ({versiculoActual.version})
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem' }}>
              <Link to="/reservar" className="btn-primary">
                <Calendar size={18} /> Agendar cita
              </Link>
              <Link to="/servicios" className="btn-secondary">
                Ver servicios y precios <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="bg-hero-stage">
            {HERO_SLIDES.map((img, idx) => (
              <div
                key={img.src}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: slideIdx === idx ? 1 : 0,
                  transition: 'opacity 1s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  pointerEvents: slideIdx === idx ? 'auto' : 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '48px' }}>
                  <img
                    src={img.src}
                    alt={img.title}
                    className="hero-cutout-img"
                    style={{ maxHeight: '90%', maxWidth: '88%', objectFit: 'contain' }}
                  />
                </div>
                <div
                  style={{
                    position: 'relative',
                    width: '92%',
                    marginBottom: '1rem',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    padding: '0.9rem 1.15rem',
                    border: '1.5px solid #F6C6D3',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase' }}>
                    {img.badge}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: '#C46A86', fontSize: '1.05rem' }}>
                    {img.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6C525F' }}>{img.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOCIONES DESTACADAS */}
      {promociones.length > 0 && (
        <section className="bg-combined-promos" style={{ padding: '3.5rem 1.5rem' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ color: '#B8860B', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  <Tag size={14} style={{ verticalAlign: 'middle' }} /> Promociones vigentes
                </div>
                <h2 style={{ fontSize: '2rem', color: '#C46A86' }}>Promociones especiales para ti</h2>
              </div>
              <Link to="/reservar" className="btn-secondary" style={{ padding: '0.55rem 1.2rem' }}>
                Reservar ahora <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem' }}>
              {promociones.map((promo) => (
                <div key={promo.id} className="card-elegant img-zoom-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '190px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={promo.imagen || '/promo_bano_luna_facial.png'}
                      alt={promo.titulo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      className="badge badge-gold"
                      style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#B8860B', color: '#FFFFFF', border: 'none' }}
                    >
                      {promo.descuento}
                    </span>
                  </div>
                  <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.18rem', marginBottom: '0.45rem' }}>{promo.titulo}</h3>
                      <p style={{ fontSize: '0.9rem', color: '#6C525F', marginBottom: '0.8rem' }}>{promo.descripcion}</p>
                      <div style={{ fontSize: '0.8rem', color: '#9F3E5E', fontWeight: 700, marginBottom: '0.75rem' }}>
                        {promo.vigencia}
                      </div>
                    </div>
                    <div>
                      {promo.precioPromo && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.9rem' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C46A86' }}>
                            {formatBs(promo.precioPromo)}
                          </span>
                          {promo.precioRegular && (
                            <span style={{ fontSize: '0.92rem', color: '#999', textDecoration: 'line-through' }}>
                              {formatBs(promo.precioRegular)}
                            </span>
                          )}
                        </div>
                      )}
                      <Link
                        to={`/reservar${promo.servicioId ? `?servicioId=${promo.servicioId}` : ''}`}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.7rem' }}
                      >
                        Agendar promoción <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICIOS DESTACADOS */}
      <section className="bg-combined-services" style={{ padding: '3.5rem 1.5rem', borderTop: '1px solid #F6C6D3' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ color: '#B8860B', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
                Catálogo oficial en Bolivianos (Bs)
              </div>
              <h2 style={{ fontSize: '2rem', color: '#C46A86' }}>Servicios destacados</h2>
            </div>
            <Link to="/servicios" className="btn-secondary" style={{ padding: '0.55rem 1.2rem' }}>
              Ver catálogo completo ({servicios.length}) <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {listaDestacados.map((serv) => (
              <div key={serv.id} className="card-elegant img-zoom-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '165px', overflow: 'hidden' }}>
                  <img
                    src={serv.imagen || '/trat_limpieza_facial.png'}
                    alt={serv.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span className="badge badge-mauve" style={{ marginBottom: '0.5rem', fontSize: '0.74rem' }}>
                      {serv.categoria}
                    </span>
                    <h3 style={{ fontSize: '1.12rem', marginBottom: '0.4rem' }}>{serv.nombre}</h3>
                    <p style={{ fontSize: '0.87rem', color: '#6C525F', marginBottom: '1rem' }}>{serv.descripcion}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #FDF1F4', paddingTop: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#C46A86' }}>{formatBs(serv.precio)}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6C525F', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {serv.duracionMin} min
                      </div>
                    </div>
                    <Link to={`/reservar?servicioId=${serv.id}`} className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.86rem' }}>
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 SUCURSALES */}
      <section className="bg-combined-hero" style={{ padding: '3.5rem 1.5rem', borderTop: '1px solid #F6C6D3' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ color: '#B8860B', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
              La Paz & El Alto
            </div>
            <h2 style={{ fontSize: '2rem', color: '#C46A86' }}>Nuestras 4 Sucursales</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.4rem' }}>
            {sucursalesActivas.map((s) => (
              <div key={s.id} className="card-elegant" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span className="badge badge-mauve">{s.ciudad}</span>
                    <span className="badge badge-gold">
                      <Users size={12} /> {s.capacidad || 2} especialistas
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.55rem' }}>{s.nombre}</h3>
                  <p style={{ fontSize: '0.88rem', color: '#6C525F', marginBottom: '0.45rem', display: 'flex', gap: '0.4rem' }}>
                    <MapPin size={15} color="#B8860B" style={{ flexShrink: 0, marginTop: '3px' }} /> {s.direccion}
                  </p>
                  <p style={{ fontSize: '0.86rem', color: '#6C525F', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Clock size={15} color="#B8860B" /> Lun–Sáb: {s.horario?.apertura || '08:30'} – {s.horario?.cierre || '19:30'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <a
                    href={whatsappUrl(s.whatsapp, `Hola, quisiera consultar por la sucursal ${s.nombre} de HERMOSA TALITA KUMI.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp-pulse"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFF',
                      padding: '0.65rem',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <MessageCircle size={16} /> WhatsApp {s.whatsapp}
                  </a>
                  <Link to={`/reservar?sucursalId=${s.id}`} className="btn-secondary" style={{ padding: '0.6rem', fontSize: '0.86rem' }}>
                    Reservar en {s.nombre}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#6C525F', fontSize: '0.9rem' }}>
              <Feather size={16} color="#B8860B" />
              <span>¿Prefieres ver mapas e indicaciones detalladas?</span>
              <Link to="/sucursales" style={{ color: '#C46A86', fontWeight: 800, textDecoration: 'underline' }}>
                Ir a Sucursales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
