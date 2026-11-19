import React, { useState, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { 
  Search, Clock, Calendar, Sparkles, ArrowLeft, ArrowRight, 
  MapPin, CheckCircle2, ChevronRight, Tag, Feather 
} from 'lucide-react';

export default function ServicesPage({ onNavigate, onSelectServiceForBooking, initialCategoryCode }) {
  const { selectedBranch, selectBranch, branches } = useBranch();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllBranches, setShowAllBranches] = useState(false);

  // Cargar categorías al inicio
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.categories) {
          setCategories(res.categories);
          if (initialCategoryCode) {
            const found = res.categories.find(c => c.code === initialCategoryCode);
            if (found) setSelectedCategory(found);
          }
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [initialCategoryCode]);

  // Cargar tratamientos de la categoría seleccionada
  useEffect(() => {
    if (!selectedCategory) return;

    async function loadTreatments() {
      setLoading(true);
      try {
        const params = {
          category_code: selectedCategory.code
        };
        if (selectedBranch && !showAllBranches) {
          params.branch_id = selectedBranch.id;
        }

        const res = await api.getServices(params);
        if (res.services) {
          setServices(res.services);
        }
      } catch (err) {
        console.error('Error al cargar tratamientos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTreatments();
  }, [selectedCategory, selectedBranch, showAllBranches]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleBook = (serviceId) => {
    if (onSelectServiceForBooking) {
      onSelectServiceForBooking(serviceId);
    }
    onNavigate('booking', { serviceId, branchId: selectedBranch?.id });
  };

  const filteredServices = services.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
           (s.description && s.description.toLowerCase().includes(q)) ||
           (s.cosmetic_benefits && s.cosmetic_benefits.toLowerCase().includes(q));
  });

  return (
    <div className="bg-combined-services" style={{ minHeight: '100vh', padding: '2.5rem 1.5rem', color: '#333333' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* =====================================================================
            1. BLOQUE INSPIRADOR SUPERIOR (MÓDULO 09)
               Versículo Bíblico, frase inspiradora y fotografía representativa
           ===================================================================== */}
        <div className="card-motion" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '2.5rem',
          border: '2px solid #F6C6D3',
          boxShadow: '0 12px 35px rgba(196, 106, 134, 0.12)',
          marginBottom: '2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
          gap: '2.5rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.65rem' }}>
              <Feather size={16} />
              Cuidado con Amor y Propósito
            </div>

            <div style={{
              backgroundColor: '#FFF8F0',
              borderLeft: '4px solid #B8860B',
              padding: '1rem 1.25rem',
              borderRadius: '0 14px 14px 0',
              marginBottom: '1.25rem'
            }}>
              <p style={{ color: '#333333', fontSize: '1.08rem', fontStyle: 'italic', lineHeight: 1.55, margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                "Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien."
              </p>
              <strong style={{ color: '#B8860B', fontSize: '0.88rem' }}>— Salmos 139:14 (RVR1960)</strong>
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.6rem',
              color: '#C46A86',
              margin: '0 0 0.75rem 0',
              letterSpacing: '-0.5px'
            }}>
              Conoce nuestros servicios
            </h1>

            <p style={{ color: '#555555', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
              Ofrecemos tratamientos faciales, Baño de Luna, cuidado corporal, masajes relajantes, depilación, pestañas y cejas, adaptados con dedicación a cada necesidad estética y bienestar personal.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', border: 0, boxShadow: 'none' }}>
            <img
              src="/hero_chica_mascarilla_spa.png"
              alt="Cuidado Estético Hermosa Talita Kumi"
              style={{
                width: '100%',
                maxHeight: '280px',
                objectFit: 'contain',
                background: 'transparent',
                border: 0,
                boxShadow: 'none',
                display: 'block'
              }}
            />
          </div>
        </div>

        {/* =====================================================================
            2. VISTA A: SI NO SE HA SELECCIONADO CATEGORÍA (MUESTRA LAS 7 TARJETAS)
           ===================================================================== */}
        {!selectedCategory ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.8rem',
                color: '#C46A86',
                margin: '0 0 0.5rem 0'
              }}>
                Explora nuestras 7 Categorías
              </h2>
              <p style={{ color: '#666666', fontSize: '0.95rem' }}>
                Haz clic sobre cualquiera de las tarjetas para ver todos sus tratamientos y reservar.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem'
            }}>
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSelectCategory(cat); }}
                  className="card-motion img-zoom-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    border: '1.5px solid #F6C6D3',
                    boxShadow: '0 8px 24px rgba(196, 106, 134, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ height: '190px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={cat.image || '/cat_facial.png'}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/cat_facial.png'; }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#C46A86',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                      Categoría 0{idx + 1}
                    </div>
                  </div>

                  <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.28rem', fontWeight: '800', color: '#C46A86', margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {cat.name}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                        {cat.description}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #FDF1F4',
                      paddingTop: '0.9rem',
                      color: '#B8860B',
                      fontWeight: '800',
                      fontSize: '0.9rem'
                    }}>
                      <span>Ver tratamientos</span>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =====================================================================
              3. VISTA B: TRATAMIENTOS DE LA CATEGORÍA SELECCIONADA (MÓDULO 09)
             ===================================================================== */
          <div>
            {/* Barra de Navegación y Volver */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  color: '#C46A86',
                  border: '1.5px solid #F6C6D3',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '25px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
                Volver a todas las Categorías
              </button>

              {/* Aviso de Sucursal Seleccionada (Módulo 09 Regla 2) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #F6C6D3',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.85rem'
              }}>
                <MapPin size={16} color="#B8860B" />
                <span>
                  Mostrando tratamientos disponibles en: <strong>{selectedBranch?.name || 'Villa Fátima'}</strong>
                </span>
                <button
                  onClick={() => setShowAllBranches(!showAllBranches)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C46A86',
                    textDecoration: 'underline',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.82rem'
                  }}
                >
                  {showAllBranches ? 'Filtrar por mi sede' : 'Ver todas las sedes'}
                </button>
              </div>
            </div>

            {/* Cabecera de la Categoría */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.5rem 2rem',
              border: '1px solid #F6C6D3',
              marginBottom: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.8rem',
                  color: '#C46A86',
                  margin: 0
                }}>
                  {selectedCategory.name}
                </h2>
                <p style={{ color: '#666666', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
                  {selectedCategory.description}
                </p>
              </div>

              {/* Buscador de Tratamientos */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="#999999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar tratamiento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                    borderRadius: '20px',
                    border: '1px solid #D0D0D0',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Grilla de Tratamientos */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#C46A86', fontWeight: '700' }}>
                Cargando tratamientos...
              </div>
            ) : filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: '18px' }}>
                No se encontraron tratamientos con esos criterios.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.75rem'
              }}>
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="card-motion img-zoom-card"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '22px',
                      overflow: 'hidden',
                      border: '1.5px solid #F6C6D3',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ height: '210px', overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={service.image || '/trat_limpieza_facial.png'}
                        alt={service.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/trat_limpieza_facial.png'; }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#FFFFFF',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        <Clock size={13} />
                        {service.duration} minutos aprox.
                      </div>
                    </div>

                    <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#333333', margin: '0 0 0.5rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                          {service.name}
                        </h3>

                        <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                          {service.description}
                        </p>

                        {service.cosmetic_benefits && (
                          <div style={{
                            backgroundColor: '#FDF1F4',
                            padding: '0.7rem 0.9rem',
                            borderRadius: '12px',
                            fontSize: '0.84rem',
                            color: '#C46A86',
                            marginBottom: '1.25rem',
                            lineHeight: 1.45,
                            borderLeft: '3px solid #C46A86'
                          }}>
                            <strong>Finalidad estética:</strong> {service.cosmetic_benefits}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid #F5F5DC',
                          paddingTop: '0.9rem',
                          marginBottom: '1rem'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#777777', fontWeight: '600' }}>Inversión:</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C46A86' }}>
                            Bs {parseFloat(service.price).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleBook(service.id)}
                          className="btn-primary btn-motion"
                          style={{
                            width: '100%',
                            fontSize: '0.96rem',
                            padding: '0.8rem'
                          }}
                        >
                          <Calendar size={16} />
                          Reservar cita
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
