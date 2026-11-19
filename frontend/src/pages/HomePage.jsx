import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { 
  Sparkles, Calendar, ArrowRight, ShieldCheck, HeartHandshake, Award, 
  Clock, Star, CheckCircle2, ChevronRight, MapPin, Phone, MessageCircle, ExternalLink,
  Play, Pause, Tag, ShoppingBag, Eye, Feather
} from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const { branches, selectedBranch, selectBranch } = useBranch();

  // Fotos transparentes (sin fondo) de alta gama para el efecto Crossfade en Hero (Módulo 08)
  const heroImages = [
    {
      src: '/hero_chica_tratamiento_facial.png',
      badge: 'Tratamiento Facial Exclusivo',
      title: 'Limpieza Profunda & Luminosidad Dérmica',
      description: 'Atención personalizada con activos botánicos hidratantes y purificantes.'
    },
    {
      src: '/hero_chica_producto_serum.png',
      badge: 'Cosmética de Alta Gama',
      title: 'Sérum Revitalizante & Cuidado Diario',
      description: 'Productos certificados para potenciar la tersura y el brillo natural de tu piel.'
    },
    {
      src: '/hero_chica_mascarilla_spa.png',
      badge: 'Relax & Bienestar Spa',
      title: 'Baño de Luna & Mascarillas Nutritivas',
      description: 'Protocolos relajantes en un ambiente de calma, dignidad y renovación.'
    },
    {
      src: '/hero_chica_producto_crema.png',
      badge: 'Nutrición Dermo-Cosmética',
      title: 'Crema Hidratante & Cuidado Reafirmante',
      description: 'Fórmulas delicadas que cuidan tu piel reflejando la belleza desde el corazón.'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Versículos bíblicos (Módulo 08)
  const [verses, setVerses] = useState([]);
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);
  const [isVersePaused, setIsVersePaused] = useState(false);

  // Promociones (Módulo 12)
  const [promotions, setPromotions] = useState([]);
  const [promoFilterBranch, setPromoFilterBranch] = useState('ALL');

  // Categorías de servicios (Módulo 09)
  const [categories, setCategories] = useState([]);

  // Carga de datos dinámicos desde la API
  useEffect(() => {
    async function loadData() {
      try {
        const [versRes, catRes, promoRes] = await Promise.all([
          api.getVerses(),
          api.getCategories(),
          api.getPromotions()
        ]);

        if (versRes.success && versRes.data) {
          setVerses(versRes.data);
        }
        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        }
        if (promoRes.success && promoRes.data) {
          setPromotions(promoRes.data);
        }
      } catch (err) {
        console.warn('Error al cargar datos de inicio:', err);
      }
    }
    loadData();
  }, []);

  // Rotación suave del Crossfade Hero cada 4.5 segundos
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, heroImages.length]);

  // Rotación suave de los Versículos Bíblicos cada 7 segundos
  useEffect(() => {
    if (isVersePaused || verses.length === 0) return;
    const timer = setInterval(() => {
      setCurrentVerseIdx(prev => (prev + 1) % verses.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isVersePaused, verses.length]);

  // Filtrado de promociones por sucursal
  const filteredPromotions = promotions.filter(p => {
    if (promoFilterBranch === 'ALL') return true;
    return !p.branch_id || String(p.branch_id) === String(promoFilterBranch);
  });

  const activeVerse = verses[currentVerseIdx] || {
    reference: 'Salmos 139:14',
    version: 'RVR1960 [PROVISIONAL]',
    text: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
    reflection: 'Cada persona es una creación maravillosa y tiene un valor único ante Dios.'
  };

  const getWhatsAppLink = (branch, messagePrefix = 'Hola, quisiera consultar los servicios y horarios de la sucursal') => {
    const rawPhone = branch?.whatsapp ? branch.whatsapp.replace(/[^0-9]/g, '') : '62353452';
    const cleanPhone = rawPhone.startsWith('591') ? rawPhone : `591${rawPhone}`;
    const msg = encodeURIComponent(`${messagePrefix} ${branch?.name || 'Villa Fátima'} de Hermosa Talita Kumi.`);
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div style={{ minHeight: '100vh', color: '#333333' }}>
      
      {/* =====================================================================
          1. BIENVENIDA HERO EN DOS COLUMNAS CON FOTOGRAFÍAS DINÁMICAS (CROSSFADE)
             Y COMBINACIÓN DE FONDOS ROSA CON EL LOGO OFICIAL
         ===================================================================== */}
      <section className="bg-combined-hero" style={{
        position: 'relative',
        padding: '3.5rem 1.5rem',
        borderBottom: '1px solid rgba(215, 127, 161, 0.25)',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          alignItems: 'center',
          gap: '3rem'
        }}>
          {/* Columna Izquierda: Mensajes, Versículo y Botones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div className="logo-official-badge">
                <img 
                  src="/logo-talitakumi.png" 
                  alt="Logo Oficial Hermosa Talita Kumi" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/logo-talitakumi.jpg'; }}
                />
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1.5px solid #F6C6D3',
                padding: '0.45rem 1.1rem',
                borderRadius: '30px',
                color: '#C46A86',
                fontSize: '0.82rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 14px rgba(196, 106, 134, 0.12)'
              }}>
                <Sparkles size={16} color="#B8860B" />
                Belleza con Propósito y Cuidado Integral
              </div>
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)',
              fontWeight: '800',
              color: '#C46A86',
              lineHeight: 1.18,
              margin: '0 0 1rem 0'
            }}>
              Bienvenida a <br />
              <span style={{ color: '#B8860B' }}>HERMOSA TALITA KUMI</span>
            </h1>

            <p style={{
              fontSize: '1.18rem',
              color: '#4A3B43',
              lineHeight: 1.6,
              margin: '0 0 1.25rem 0',
              fontWeight: '600'
            }}>
              Un espacio para dedicarte tiempo, cuidar tu belleza y disfrutar de un momento para ti.
            </p>

            <p style={{
              fontSize: '0.98rem',
              color: '#6C5864',
              lineHeight: 1.55,
              margin: '0 0 1.75rem 0'
            }}>
              Cada momento dedicado a tu cuidado es una oportunidad para sentirte bien, renovar tu confianza y disfrutar de ti misma con la calidez, respeto y armonía que mereces.
            </p>

            {/* Microcard Bíblico en el Hero */}
            <div className="card-motion" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderLeft: '4px solid #B8860B',
              borderRight: '1px solid #F6C6D3',
              borderTop: '1px solid #F6C6D3',
              borderBottom: '1px solid #F6C6D3',
              padding: '0.95rem 1.35rem',
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 6px 20px rgba(196, 106, 134, 0.1)',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '0.92rem', fontStyle: 'italic', color: '#3E2A34', lineHeight: 1.5 }}>
                "{activeVerse.text}"
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#B8860B', marginTop: '0.4rem' }}>
                — {activeVerse.reference} ({activeVerse.version})
              </div>
            </div>

            {/* Botones de Acción (Solo dos oficiales: Agendar cita y Ver servicios - Módulo 08) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                onClick={() => onNavigate('booking')}
                className="btn-primary btn-motion"
                style={{
                  fontSize: '1rem',
                  padding: '0.9rem 1.85rem'
                }}
              >
                <Calendar size={18} />
                Agendar cita
              </button>

              <button
                onClick={() => onNavigate('services')}
                className="btn-secondary btn-motion"
                style={{
                  fontSize: '0.98rem',
                  padding: '0.85rem 1.6rem'
                }}
              >
                Ver servicios
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Escenario con Efecto Crossfade Dinámico y Fotos Sin Fondo */}
          <div className="bg-hero-stage">
            {heroImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: currentSlide === idx ? 1 : 0,
                  transition: 'opacity 1.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: currentSlide === idx ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  pointerEvents: currentSlide === idx ? 'auto' : 'none'
                }}
              >
                {/* Imagen Sin Fondo de Chica recibiendo tratamiento / mostrando producto */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: '40px'
                }}>
                  <img
                    src={img.src}
                    alt={img.title}
                    className="hero-cutout-img"
                    style={{
                      maxHeight: '94%',
                      maxWidth: '92%',
                      objectFit: 'contain'
                    }}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>

                {/* Micro-Badges Flotantes decorativos */}
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  color: '#C46A86',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '25px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  boxShadow: '0 4px 15px rgba(196, 106, 134, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '1px solid #F6C6D3'
                }}>
                  <Sparkles size={14} color="#B8860B" />
                  <span>{img.badge}</span>
                </div>

                {/* Barra Glassmorphic Inferior con Título y Descripción */}
                <div style={{
                  position: 'relative',
                  width: '92%',
                  marginBottom: '1rem',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '18px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 8px 30px rgba(196, 106, 134, 0.18)',
                  border: '1.5px solid #F6C6D3',
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#B8860B',
                    fontWeight: '800'
                  }}>
                    Centro Estético Hermosa Talita Kumi
                  </div>
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    color: '#C46A86',
                    marginTop: '2px',
                    fontFamily: "'Playfair Display', Georgia, serif"
                  }}>
                    {img.title}
                  </div>
                  <div style={{
                    fontSize: '0.82rem',
                    color: '#555555',
                    marginTop: '2px',
                    lineHeight: 1.35
                  }}>
                    {img.description}
                  </div>
                </div>
              </div>
            ))}

            {/* Selector de diapositivas en la parte superior derecha */}
            <div style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  style={{
                    width: currentSlide === i ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: currentSlide === i ? '#C46A86' : 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid #C46A86',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  title={`Foto ${i + 1}`}
                />
              ))}

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid #F6C6D3',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#C46A86',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                title={isPlaying ? 'Pausar transición' : 'Reanudar transición'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SECCIÓN: LA BELLEZA TAMBIÉN NACE DEL CORAZÓN (VERSÍCULOS MÓDULO 08)
         ===================================================================== */}
      <section className="bg-combined-scripture" style={{
        padding: '3.5rem 1.5rem',
        borderBottom: '1px solid #F6C6D3'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
            <Feather size={16} />
            Inspiración y Cuidado del Alma
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.1rem',
            color: '#C46A86',
            margin: '0 0 0.85rem 0'
          }}>
            La belleza también nace del corazón
          </h2>

          <p style={{ color: '#555555', fontSize: '1rem', maxWidth: '720px', margin: '0 auto 2rem auto', lineHeight: 1.55 }}>
            Creemos que cada persona tiene un valor especial y que cuidar de nosotros mismos también puede ser un momento de gratitud, amor y bienestar.
          </p>

          {/* Tarjeta del Versículo Rotativo con Movimiento */}
          <div className="card-motion" style={{
            backgroundColor: 'rgba(255, 248, 240, 0.95)',
            border: '2px solid #F6C6D3',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 12px 35px rgba(196, 106, 134, 0.12)',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '1.4rem',
              fontStyle: 'italic',
              color: '#333333',
              lineHeight: 1.6,
              fontFamily: "'Playfair Display', Georgia, serif",
              marginBottom: '1rem'
            }}>
              "{activeVerse.text}"
            </div>

            <div style={{
              fontSize: '1.05rem',
              fontWeight: '800',
              color: '#B8860B',
              letterSpacing: '0.5px'
            }}>
              — {activeVerse.reference} <span style={{ fontSize: '0.82rem', color: '#888888', fontWeight: '600' }}>({activeVerse.version})</span>
            </div>

            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px dashed #F6C6D3',
              fontSize: '0.94rem',
              color: '#C46A86',
              fontWeight: '600'
            }}>
              Reflexión: {activeVerse.reflection}
            </div>

            {/* Selectores de Versículos */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {verses.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentVerseIdx(i)}
                  className="btn-motion"
                  style={{
                    width: currentVerseIdx === i ? '26px' : '10px',
                    height: '10px',
                    borderRadius: '5px',
                    backgroundColor: currentVerseIdx === i ? '#C46A86' : '#E0D0D5',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title={`Versículo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SECCIÓN: PROMOCIONES ESPECIALES PARA TI (MÓDULO 12)
         ===================================================================== */}
      <section className="bg-combined-promos" style={{
        padding: '4rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Campañas y Descuentos Exclusivos
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '2.3rem',
                color: '#C46A86',
                margin: '0.25rem 0 0 0'
              }}>
                Promociones especiales para ti
              </h2>
            </div>
          </div>

          {/* Grilla de Promociones Globales (Sin filtro de sucursal - Módulo 12) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {promotions.map(promo => (
              <div
                key={promo.id}
                className="card-motion img-zoom-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(196, 106, 134, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1.5px solid #F6C6D3'
                }}
              >
                <div style={{ height: '210px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={promo.image || '/promo_bano_luna_facial.png'}
                    alt={promo.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/promo_bano_luna_facial.png'; }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: '#B8860B',
                    color: '#FFFFFF',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.25)'
                  }}>
                    {promo.badge || 'OFERTA ESPECIAL'}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#C46A86',
                    color: '#FFFFFF',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    boxShadow: '0 2px 10px rgba(196, 106, 134, 0.3)'
                  }}>
                    -{promo.discount_percent}%
                  </div>
                </div>

                <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#333333', margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {promo.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                      {promo.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#C46A86' }}>
                        Bs {parseFloat(promo.promo_price).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '1rem', color: '#999999', textDecoration: 'line-through' }}>
                        Bs {parseFloat(promo.regular_price).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate('booking', { serviceId: promo.service_id, promoId: promo.id })}
                      className="btn-primary btn-motion"
                      style={{
                        width: '100%',
                        fontSize: '0.96rem',
                        padding: '0.8rem'
                      }}
                    >
                      Reservar esta Promoción
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SECCIÓN: NUESTROS SERVICIOS (7 CATEGORÍAS OFICIALES MÓDULO 09)
         ===================================================================== */}
      <section className="bg-combined-services" style={{
        padding: '4rem 1.5rem',
        borderTop: '1px solid #F6C6D3'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Catálogo Especializado
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.3rem',
              color: '#C46A86',
              margin: '0.25rem 0 0.5rem 0'
            }}>
              NUESTROS SERVICIOS
            </h2>
            <p style={{ color: '#666666', fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto' }}>
              Selecciona cualquiera de nuestras 7 categorías para explorar todos los tratamientos y agendar tu sesión.
            </p>
          </div>

          {/* Grilla de las 7 Categorías con Movimiento */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem'
          }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => onNavigate('services', { categoryCode: cat.code })}
                className="card-motion img-zoom-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1.5px solid #F6C6D3',
                  boxShadow: '0 8px 24px rgba(196, 106, 134, 0.1)'
                }}
              >
                <div style={{ height: '175px', overflow: 'hidden' }}>
                  <img
                    src={cat.image || '/cat_facial.png'}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/cat_facial.png'; }}
                  />
                </div>
                <div style={{ padding: '1.35rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#C46A86', margin: '0 0 0.4rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {cat.name}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#666666', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    {cat.description}
                  </p>
                  <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Explorar tratamientos <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. SECCIÓN: NUESTRAS 4 SUCURSALES (MÓDULO 06)
         ===================================================================== */}
      <section className="bg-combined-hero" style={{
        padding: '4rem 1.5rem',
        borderTop: '1px solid #F6C6D3'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Atención Centralizada en La Paz y El Alto
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.3rem',
              color: '#C46A86',
              margin: '0.25rem 0 0.5rem 0'
            }}>
              Nuestras 4 Sucursales
            </h2>
            <p style={{ color: '#666666', fontSize: '0.98rem', maxWidth: '680px', margin: '0 auto' }}>
              Elige la sede más cercana a tu hogar o trabajo para agendar tu cita y consultar disponibilidad.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem'
          }}>
            {branches.map(b => (
              <div
                key={b.id}
                className="card-motion"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: selectedBranch?.id === b.id ? '2.5px solid #C46A86' : '1.5px solid #F6C6D3',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.07)',
                  padding: '1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{ backgroundColor: '#FDF1F4', color: '#C46A86', padding: '0.3rem 0.75rem', borderRadius: '15px', fontWeight: '800', fontSize: '0.78rem' }}>
                      {b.city}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#B8860B', fontWeight: '800' }}>
                      Agenda personalizada
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#333333', margin: '0 0 0.6rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {b.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#666666', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                    <MapPin size={16} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{b.address}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#666666', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                    <Clock size={16} color="#B8860B" />
                    <span>{b.opening_hours || 'Lunes a Sábado: 08:30 - 19:30'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#666666', fontSize: '0.88rem', marginBottom: '1.35rem' }}>
                    <Phone size={16} color="#B8860B" />
                    <span>WhatsApp: {b.whatsapp}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Botón Escribir por WhatsApp con Pulso y Movimiento */}
                  <a
                    href={getWhatsAppLink(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-pulse"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      padding: '0.75rem',
                      borderRadius: '25px',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <MessageCircle size={18} />
                    Escribir por WhatsApp
                  </a>

                  {/* Botón Ver Ubicación / Cómo llegar */}
                  <a
                    href={b.google_maps_url || 'https://maps.google.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-motion"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#C46A86',
                      border: '1.5px solid #C46A86',
                      padding: '0.7rem',
                      borderRadius: '25px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ExternalLink size={16} />
                    Ver Ubicación en Google Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. SECCIÓN: 8 RAZONES PARA ELEGIR HERMOSA TALITA KUMI (MÓDULO 08)
         ===================================================================== */}
      <section style={{
        padding: '4.5rem 1.5rem',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F6C6D3'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            {/* Texto y Presentación Inspiradora */}
            <div>
              <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                Excelencia & Vocación de Servicio
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '2.3rem',
                color: '#C46A86',
                margin: '0 0 1rem 0',
                lineHeight: 1.25
              }}>
                ¿Por qué elegir Hermosa Talita Kumi?
              </h2>
              <p style={{ color: '#555555', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Nos esforzamos por ofrecerte una atención cálida, profesional y con valores cristianos en cada visita.
                Cada sesión en nuestras 4 sucursales de La Paz y El Alto es un espacio diseñado para tu bienestar, 
                descanso y renovación integral.
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: 'rgba(253, 246, 248, 0.8)',
                padding: '0.6rem 1.2rem',
                borderRadius: '30px',
                border: '1px solid #F6C6D3',
                color: '#C46A86',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                <HeartHandshake size={18} color="#B8860B" />
                Atención personalizada con calidez y dignidad
              </div>
            </div>

            {/* Fotografía Libre (Módulo 08: sin marco, recuadro, borde ni sombra) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', border: 0, boxShadow: 'none' }}>
              <picture>
                <source srcSet="/elegirnos_spa_bienestar.webp" type="image/webp" />
                <img
                  src="/elegirnos_spa_bienestar.png"
                  alt="Bienestar y Cuidado en Hermosa Talita Kumi"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '360px',
                    objectFit: 'contain',
                    border: 'none',
                    boxShadow: 'none',
                    background: 'transparent'
                  }}
                  onError={(e) => { e.target.src = '/hero_chica_mascarilla_spa.png'; }}
                />
              </picture>
            </div>
          </div>

          {/* Grilla de las 8 Razones */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { title: '4 Sucursales Oficiales', desc: 'Presencia en Villa Fátima, UPEA – El Alto, Ceja – El Alto y Max Paredes.' },
              { title: 'Atención Dedicada', desc: 'Atención cercana y ambiente acogedor para tu bienestar y tranquilidad.' },
              { title: 'Servicios Especializados', desc: 'Tratamientos faciales, Baño de Luna, cuidado corporal y masajes.' },
              { title: 'Productos de Belleza', desc: 'Línea dermocosmética seleccionada para el cuidado continuo de tu piel.' },
              { title: 'Precios Claros en Bolivianos', desc: 'Tarifas transparentes en Bs sin cargos ocultos ni sorpresas.' },
              { title: 'Agendamiento por Franjas', desc: 'Consulta disponibilidad en vivo y agenda tu cita con facilidad.' },
              { title: 'Valores Cristianos y Respeto', desc: 'Un ambiente de paz, edificación y respeto para ti.' },
              { title: 'Atención y Consultas', desc: 'Asistencia informativa y contacto centralizado por WhatsApp.' }
            ].map((reason, i) => (
              <div 
                key={i}
                className="card-motion"
                style={{
                  backgroundColor: '#FFF8F0',
                  padding: '1.35rem',
                  borderRadius: '18px',
                  border: '1.5px solid #F6C6D3',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  boxShadow: '0 4px 15px rgba(196, 106, 134, 0.06)'
                }}
              >
                <CheckCircle2 size={24} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#C46A86', fontSize: '0.98rem', marginBottom: '3px' }}>
                    {reason.title}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#666666', lineHeight: 1.45 }}>
                    {reason.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
