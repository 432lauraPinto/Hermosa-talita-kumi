import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { 
  Search, ShoppingBag, Filter, Sparkles, MapPin, CheckCircle, 
  AlertTriangle, XCircle, Info, Lock, Send, CheckCircle2, X 
} from 'lucide-react';

export default function ProductsPage({ onNavigate }) {
  const { user } = useAuth();
  const { branches, selectedBranch } = useBranch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [requestModalProduct, setRequestModalProduct] = useState(null);
  const [requestForm, setRequestForm] = useState({
    branch_id: selectedBranch?.id || 1,
    quantity: 1,
    notes: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestResult, setRequestResult] = useState(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = {};
        if (selectedBranch) params.branch_id = selectedBranch.id;
        if (typeFilter !== 'ALL') params.type = typeFilter;
        if (searchQuery) params.search = searchQuery;

        const res = await api.getProducts(params);
        if (res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Error al cargar productos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedBranch, typeFilter, searchQuery]);

  const handleOpenRequest = (prod) => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    setRequestModalProduct(prod);
    setRequestForm({
      branch_id: selectedBranch?.id || 1,
      quantity: 1,
      notes: ''
    });
    setRequestResult(null);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestModalProduct) return;

    try {
      setSubmittingRequest(true);
      const res = await api.createProductRequest({
        product_id: requestModalProduct.id,
        branch_id: requestForm.branch_id,
        quantity: requestForm.quantity,
        notes: requestForm.notes
      });

      if (res.success) {
        setRequestResult({
          type: 'success',
          requestId: res.requestId,
          message: res.message
        });
      }
    } catch (err) {
      setRequestResult({
        type: 'error',
        message: err.message || 'Error al enviar la solicitud.'
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="bg-combined-promos" style={{ minHeight: '100vh', padding: '3rem 1.5rem', color: '#333333' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Cabecera del Catálogo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: '#B8860B', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
            Cosmética y Cuidado Dermo-Estético
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.5rem',
            color: '#C46A86',
            margin: '0 0 0.5rem 0',
            fontWeight: '900'
          }}>
            NUESTROS PRODUCTOS
          </h1>
          <p style={{ color: '#666666', fontSize: '1rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
            Catálogo cosmecéutico para complementar tus sesiones en cabina con rutinas de cuidado domiciliario. Sin compras web: solicita el producto y retíralo personalmente en tu sede.
          </p>

          {/* Badge de Sucursal Activa */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #F6C6D3',
            padding: '0.45rem 1.1rem',
            borderRadius: '20px',
            marginTop: '1.25rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(196, 106, 134, 0.1)'
          }}>
            <MapPin size={15} color="#B8860B" />
            <span>Consultando existencias en: <strong>{selectedBranch?.name || 'Villa Fátima'}</strong></span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #F6C6D3',
          marginBottom: '2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
        }}>
          {/* Filtro por Tipo */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Todos los productos' },
              { id: 'FACIAL', label: 'Cuidado Facial' },
              { id: 'CORPORAL', label: 'Cuidado Corporal' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setTypeFilter(btn.id)}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '20px',
                  border: typeFilter === btn.id ? '2px solid #C46A86' : '1px solid #E0D0D5',
                  backgroundColor: typeFilter === btn.id ? '#C46A86' : '#FFFFFF',
                  color: typeFilter === btn.id ? '#FFFFFF' : '#555555',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={18} color="#C46A86" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: '25px',
                border: '1.5px solid #F6C6D3',
                fontSize: '0.88rem',
                outline: 'none',
                backgroundColor: '#FFF8F0'
              }}
            />
          </div>
        </div>

        {/* Lista de Productos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#C46A86', fontWeight: '700' }}>
            <Sparkles size={36} color="#C46A86" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
            Cargando catálogo cosmético...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F6C6D3' }}>
            <ShoppingBag size={48} color="#C46A86" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#333333' }}>No se encontraron productos</h3>
            <p style={{ color: '#777777', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Intenta cambiar el término de búsqueda o selecciona otra categoría.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '2rem'
          }}>
            {products.map(product => {
              const stock = product.stock !== undefined ? product.stock : 10;
              const isAvailable = stock > 0;

              return (
                <div
                  key={product.id}
                  className="card-motion img-zoom-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    border: '1.5px solid #F6C6D3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 28px rgba(196, 106, 134, 0.1)'
                  }}
                >
                  <div>
                    {/* Imagen del Producto */}
                    <div style={{ height: '220px', position: 'relative', overflow: 'hidden', backgroundColor: '#FFFDF9' }}>
                      <img
                        src={product.image || '/prod_serum_facial.png'}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = '/prod_serum_facial.png';
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: product.type === 'FACIAL' ? '#FDF1F4' : '#FFF8F0',
                        color: product.type === 'FACIAL' ? '#C46A86' : '#B8860B',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        border: '1px solid currentColor'
                      }}>
                        {product.type === 'FACIAL' ? 'Facial' : 'Corporal'}
                      </div>

                      {/* Badge de Stock en la Sucursal */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: isAvailable ? '#ECFDF5' : '#FEF2F2',
                        color: isAvailable ? '#059669' : '#DC2626',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        {isAvailable ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {isAvailable ? `Disponible (${stock})` : 'Agotado'}
                      </div>
                    </div>

                    {/* Contenido del Producto */}
                    <div style={{ padding: '1.4rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#B8860B', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>
                        {product.brand} • {product.category}
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2C1622', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                        {product.name}
                      </h3>

                      <p style={{ fontSize: '0.86rem', color: '#666666', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                        {product.description}
                      </p>

                      {product.related_treatment && (
                        <div style={{ fontSize: '0.78rem', color: '#888888', marginBottom: '0.85rem' }}>
                          Tratamiento asociado: <strong>{product.related_treatment}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Precio y Botones de Acción */}
                  <div style={{ padding: '0 1.4rem 1.4rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #F5F5DC',
                      paddingTop: '0.85rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ fontSize: '0.82rem', color: '#777777', fontWeight: '600' }}>Precio publicado:</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#C46A86' }}>
                        Bs {parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Botón Solicitar Producto (Sin cobro web) */}
                      <button
                        onClick={() => handleOpenRequest(product)}
                        className="btn-primary btn-motion"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '0.92rem'
                        }}
                      >
                        <Send size={15} />
                        Solicitar Producto
                      </button>

                      {/* Botón Ver Instrucciones */}
                      <button
                        onClick={() => setSelectedProductModal(product)}
                        className="btn-motion"
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#C46A86',
                          border: '1.5px solid #C46A86',
                          padding: '0.65rem',
                          borderRadius: '25px',
                          fontWeight: '700',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <Info size={15} />
                        Ver Instrucciones y Detalle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: SOLICITAR PRODUCTO (SIN PAGOS EN LÍNEA) */}
        {requestModalProduct && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 2500
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}>
              <button
                onClick={() => setRequestModalProduct(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', color: '#999', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>

              {requestResult?.type === 'success' ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle2 size={54} color="#059669" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2C1622', marginBottom: '0.5rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    ¡Solicitud #{requestResult.requestId} Registrada!
                  </h3>
                  <p style={{ color: '#555555', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                    {requestResult.message}
                  </p>
                  <button
                    onClick={() => {
                      setRequestModalProduct(null);
                      setRequestResult(null);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Entendido, Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <ShoppingBag size={22} color="#C46A86" />
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2C1622', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Solicitud de Producto
                    </h3>
                  </div>

                  <p style={{ color: '#666666', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
                    Registra tu solicitud para separar tu unidad y coordinar la entrega y el pago presencial en cabina.
                  </p>

                  {/* Resumen del Producto */}
                  <div style={{ backgroundColor: '#FFF8F0', padding: '1rem', borderRadius: '14px', border: '1px solid #F6C6D3', marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: '800', color: '#2C1622', fontSize: '1rem' }}>{requestModalProduct.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#B8860B' }}>{requestModalProduct.brand} • {requestModalProduct.type}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#C46A86', marginTop: '4px' }}>
                      Bs {parseFloat(requestModalProduct.price).toFixed(2)} por unidad
                    </div>
                  </div>

                  {requestResult?.type === 'error' && (
                    <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      {requestResult.message}
                    </div>
                  )}

                  {/* Sucursal de Retiro */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444444', display: 'block', marginBottom: '4px' }}>
                      Sucursal donde deseas retirar:
                    </label>
                    <select
                      value={requestForm.branch_id}
                      onChange={(e) => setRequestForm({ ...requestForm, branch_id: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #F6C6D3', fontSize: '0.9rem', outline: 'none' }}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.city} - {b.zone})</option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444444', display: 'block', marginBottom: '4px' }}>
                      Cantidad deseada:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={requestForm.quantity}
                      onChange={(e) => setRequestForm({ ...requestForm, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #F6C6D3', fontSize: '0.9rem', outline: 'none' }}
                      required
                    />
                  </div>

                  {/* Observaciones */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444444', display: 'block', marginBottom: '4px' }}>
                      Instrucciones o consulta para el personal (opcional):
                    </label>
                    <textarea
                      rows={2}
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                      placeholder="Ej. Deseo recogerlo junto con mi cita del viernes..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #D0D0D0', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#FDF1F4', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F6C6D3', fontSize: '0.78rem', color: '#666', marginBottom: '1.5rem' }}>
                    🔒 <strong>Aviso legal y transparencia:</strong> En Hermosa Talita Kumi no realizamos cobros en la web ni guardamos datos bancarios. El pago se efectúa presencialmente al momento de retirar tu producto en cabina.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setRequestModalProduct(null)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="btn-primary"
                    >
                      {submittingRequest ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL: PROMPT DE AUTENTICACIÓN PARA SOLICITAR PRODUCTO */}
        {authPromptOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 2600
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '2.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}>
              <Lock size={44} color="#C46A86" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2C1622', marginBottom: '0.5rem', fontFamily: "'Playfair Display', Georgia, serif" }}>
                Iniciar Sesión Requerido
              </h3>
              <p style={{ color: '#666666', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                Para registrar tu solicitud de producto y hacer el seguimiento desde tu cuenta, por favor inicia sesión o crea tu perfil.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setAuthPromptOpen(false);
                    onNavigate('login');
                  }}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setAuthPromptOpen(false);
                    onNavigate('register');
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Crear Cuenta Nueva
                </button>
                <button
                  onClick={() => setAuthPromptOpen(false)}
                  style={{ color: '#888888', fontSize: '0.85rem', marginTop: '0.4rem', cursor: 'pointer' }}
                >
                  Continuar explorando el catálogo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DETALLE E INSTRUCCIONES */}
        {selectedProductModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '550px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#C46A86', fontSize: '1.6rem', margin: '0 0 0.5rem 0' }}>
                {selectedProductModal.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#B8860B', fontWeight: '700', marginBottom: '1.25rem' }}>
                {selectedProductModal.brand} • {selectedProductModal.category}
              </div>

              <div style={{ fontSize: '0.92rem', color: '#555555', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                <strong>Finalidad cosmética:</strong> {selectedProductModal.description}
              </div>

              <div style={{ backgroundColor: '#FDF1F4', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #C46A86' }}>
                <div style={{ fontWeight: '800', color: '#C46A86', fontSize: '0.85rem', marginBottom: '4px' }}>
                  Instrucciones de uso verificadas:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#444444' }}>
                  {selectedProductModal.usage_instructions || 'No disponible para este producto.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#C46A86' }}>
                  Bs {parseFloat(selectedProductModal.price).toFixed(2)}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      const p = selectedProductModal;
                      setSelectedProductModal(null);
                      handleOpenRequest(p);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                  >
                    Solicitar Producto
                  </button>
                  <button
                    onClick={() => setSelectedProductModal(null)}
                    className="btn-secondary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
