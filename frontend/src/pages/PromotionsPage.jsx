import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag, Sparkles, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PromotionsPage({ onNavigate }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromoModal, setSelectedPromoModal] = useState(null);

  useEffect(() => {
    async function loadPromos() {
      setLoading(true);
      try {
        const res = await api.getPromotions();
        if (res.data) {
          setPromotions(res.data);
        }
      } catch (err) {
        console.error('Error al cargar promociones:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPromos();
  }, []);

  const handleBookPromo = (promo) => {
    // Al pulsar "Reservar ahora", se abre el flujo único "Agendar cita" (Módulo 11) con servicio y promoción preseleccionados
    onNavigate('booking', {
      serviceId: promo.service_id,
      promoId: promo.id
    });
  };

  return (
    <div style={{ backgroundColor: '#FFF8F0', minHeight: '100vh', padding: '3.5rem 1.5rem', color: '#333333' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Encabezado General Único (Módulo 12) */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#B8860B',
            fontWeight: '800',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
            backgroundColor: '#FDF1F4',
            padding: '0.35rem 0.95rem',
            borderRadius: '20px'
          }}>
            <Sparkles size={16} /> Campañas Especiales
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.5rem',
            color: '#C46A86',
            margin: '0.3rem 0 0.6rem 0',
            fontWeight: '900'
          }}>
            Promociones vigentes para todos nuestros clientes
          </h1>
          <p style={{ color: '#666666', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Tratamientos seleccionados con descuentos exclusivos en Bolivianos (Bs). Válidas en cualquiera de nuestras sucursales donde el servicio esté disponible.
          </p>
        </div>

        {/* Listado de Promociones Globales */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#C46A86', fontWeight: '700' }}>
            Consultando promociones vigentes...
          </div>
        ) : promotions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #F6C6D3',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <Tag size={44} color="#B8860B" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#C46A86', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Próximamente nuevas promociones
            </h3>
            <p style={{ color: '#666666', fontSize: '0.95rem', lineHeight: 1.5 }}>
              En este momento no hay promociones activas. Te invitamos a consultar periódicamente para aprovechar nuestras campañas especiales.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {promotions.map((promo, idx) => {
              const discountPercent = promo.discount_percent || Math.round(((promo.regular_price - promo.promo_price) / promo.regular_price) * 100);

              return (
                <div
                  key={promo.id || idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    border: '1.5px solid #F6C6D3',
                    boxShadow: '0 10px 30px rgba(196, 106, 134, 0.08)',
                    padding: '2.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2.5rem',
                    alignItems: 'center'
                  }}
                >
                  {/* Fotografía Libre (Sin marcos, recuadros, bordes ni sombras - Módulo 08 y 12) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 0,
                    boxShadow: 'none'
                  }}>
                    <img
                      src={promo.image || '/hero_chica_tratamiento_facial.png'}
                      alt={promo.title}
                      style={{
                        background: 'transparent',
                        border: 0,
                        boxShadow: 'none',
                        objectFit: 'contain',
                        maxWidth: '100%',
                        maxHeight: '340px',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.src = '/hero_chica_tratamiento_facial.png';
                      }}
                    />
                  </div>

                  {/* Información de la Promoción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        backgroundColor: '#C46A86',
                        color: '#FFFFFF',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        letterSpacing: '0.5px'
                      }}>
                        {promo.badge || 'OFERTA ESPECIAL'}
                      </span>
                      <span style={{
                        backgroundColor: '#FFF8F0',
                        color: '#B8860B',
                        border: '1px solid #F7DFA8',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.8rem'
                      }}>
                        {discountPercent}% DESCUENTO
                      </span>
                    </div>

                    <h2 style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.9rem',
                      color: '#C46A86',
                      margin: '0.2rem 0',
                      fontWeight: '800'
                    }}>
                      {promo.title}
                    </h2>

                    <p style={{ color: '#555555', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                      {promo.description}
                    </p>

                    {/* Precios en Bolivianos (Calculados por el servidor) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '1.2rem',
                      marginTop: '0.5rem',
                      padding: '0.85rem 1.25rem',
                      backgroundColor: '#FFF8F0',
                      borderRadius: '16px',
                      borderLeft: '4px solid #B8860B'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', fontWeight: '700' }}>
                          Precio Habitual
                        </div>
                        <div style={{ fontSize: '1.15rem', color: '#888888', textDecoration: 'line-through', fontWeight: '600' }}>
                          Bs {parseFloat(promo.regular_price || 0).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#B8860B', textTransform: 'uppercase', fontWeight: '800' }}>
                          Precio Promocional
                        </div>
                        <div style={{ fontSize: '2rem', color: '#C46A86', fontWeight: '900' }}>
                          Bs {parseFloat(promo.promo_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Vigencia y Condiciones */}
                    <div style={{ fontSize: '0.85rem', color: '#777777', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={15} color="#B8860B" />
                        <span><strong>Vigencia:</strong> Hasta el {promo.end_date || '31/12/2026'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={15} color="#C46A86" />
                        <span><strong>Condición:</strong> Aplica a una reserva por cliente. No acumulable con otros descuentos.</span>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleBookPromo(promo)}
                        style={{
                          background: 'linear-gradient(135deg, #C46A86 0%, #D77FA1 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.75rem 1.6rem',
                          borderRadius: '30px',
                          fontWeight: '800',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(196, 106, 134, 0.35)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Reservar ahora
                        <ArrowRight size={16} />
                      </button>

                      <button
                        onClick={() => setSelectedPromoModal(promo)}
                        style={{
                          background: '#FFFFFF',
                          color: '#B8860B',
                          border: '1.5px solid #F7DFA8',
                          padding: '0.75rem 1.4rem',
                          borderRadius: '30px',
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Ver detalles
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Detalles de la Promoción */}
        {selectedPromoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              border: '2px solid #F6C6D3',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)'
            }}>
              <h3 style={{ color: '#C46A86', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.6rem', marginTop: 0 }}>
                {selectedPromoModal.title}
              </h3>
              <p style={{ color: '#555555', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {selectedPromoModal.description}
              </p>

              <div style={{
                backgroundColor: '#FFF8F0',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #F7DFA8',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontWeight: '800', color: '#B8860B', marginBottom: '0.4rem' }}>
                  Condiciones Generales:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666666', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  <li>Promoción global válida para todo el centro estético Hermosa Talita Kumi.</li>
                  <li>La cita se agenda en la sucursal de tu preferencia donde el servicio esté activo.</li>
                  <li>El precio promocional (Bs {parseFloat(selectedPromoModal.promo_price || 0).toFixed(2)}) es validado y calculado directamente por el servidor.</li>
                  <li>Cupos sujetos a disponibilidad del calendario oficial.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedPromoModal(null)}
                  style={{
                    background: '#F5F5DC',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '20px',
                    fontWeight: '700',
                    color: '#666666',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const p = selectedPromoModal;
                    setSelectedPromoModal(null);
                    handleBookPromo(p);
                  }}
                  style={{
                    background: '#C46A86',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '20px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Ir a Agendar Cita
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
