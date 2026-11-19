import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShoppingBag, Plus, Trash2, Edit2, CheckCircle, AlertCircle, X, UserPlus, Sparkles, Send } from 'lucide-react';

export default function AdminProductsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo', 'asignaciones', 'solicitudes'
  const [products, setProducts] = useState([]);
  const [clientProducts, setClientProducts] = useState([]);
  const [productRequests, setProductRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'Hidratación Facial',
    description: '',
    related_treatment: '',
    usage_instructions: '',
    frequency: 'Mañana y noche',
    status: 'ACTIVO',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'
  });

  const [assignForm, setAssignForm] = useState({
    client_id: '',
    product_id: '',
    start_date: new Date().toISOString().split('T')[0],
    usage_frequency: 'Mañana y noche diariamente',
    observations: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prodRes, clientProdRes, clientsRes, reqRes] = await Promise.all([
        api.getProducts(),
        api.getClientProducts(),
        api.getClients(),
        api.getAllProductRequests().catch(() => ({ requests: [] }))
      ]);
      setProducts(prodRes.products || []);
      setClientProducts(clientProdRes.clientProducts || []);
      setClients(clientsRes.clients || []);
      setProductRequests(reqRes.requests || []);

      if (clientsRes.clients && clientsRes.clients.length > 0 && prodRes.products && prodRes.products.length > 0) {
        setAssignForm(prev => ({
          ...prev,
          client_id: clientsRes.clients[0].client_id,
          product_id: prodRes.products[0].id
        }));
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductCreate = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: '',
      category: 'Hidratación Facial',
      description: '',
      related_treatment: '',
      usage_instructions: '',
      frequency: 'Mañana y noche',
      status: 'ACTIVO',
      price: 120.00,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'
    });
    setProductModalOpen(true);
  };

  const handleOpenProductEdit = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      description: prod.description || '',
      related_treatment: prod.related_treatment || '',
      usage_instructions: prod.usage_instructions || '',
      frequency: prod.frequency || '',
      status: prod.status,
      price: prod.price,
      image: prod.image || ''
    });
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
        setActionMsg({ type: 'success', text: 'Producto cosmético actualizado.' });
      } else {
        await api.createProduct(productForm);
        setActionMsg({ type: 'success', text: 'Producto registrado en catálogo.' });
      }
      setProductModalOpen(false);
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al guardar producto.' });
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('¿Deseas eliminar este producto del catálogo?')) return;
    try {
      await api.deleteProduct(id);
      setActionMsg({ type: 'success', text: 'Producto eliminado.' });
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al eliminar producto.' });
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.assignProductToClient(assignForm);
      setActionMsg({ type: 'success', text: 'Producto asignado a la rutina del cliente.' });
      setAssignModalOpen(false);
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al asignar producto.' });
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm('¿Deseas desvincular este producto del cliente?')) return;
    try {
      await api.removeClientProduct(id);
      setActionMsg({ type: 'success', text: 'Producto desvinculado de la rutina.' });
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al desvincular producto.' });
    }
  };

  const handleUpdateRequestStatus = async (id, status, deductStock = false) => {
    try {
      await api.updateProductRequestStatus(id, { status, deduct_stock: deductStock });
      setActionMsg({ type: 'success', text: `Solicitud #${id} actualizada a ${status}.` });
      loadAllData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message || 'Error al actualizar solicitud.' });
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => onNavigate('admin-dashboard')} style={{ fontSize: '0.85rem', color: 'var(--color-mauve)', fontWeight: '600', marginBottom: '0.4rem' }}>
            ← Volver al Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'serif', fontWeight: '800', color: 'var(--color-text-dark)' }}>
            Productos Cosmecéuticos y Fichas Domiciliarias
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Gestiona el catálogo de productos, prescribe rutinas personalizadas y controla las solicitudes de clientes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleOpenProductCreate} className="btn-secondary">
            <Plus size={16} /> Catálogo
          </button>
          <button onClick={() => setAssignModalOpen(true)} className="btn-primary">
            <UserPlus size={16} /> Asignar a Cliente
          </button>
        </div>
      </div>

      {actionMsg.text && (
        <div style={{
          backgroundColor: actionMsg.type === 'error' ? '#FFEBEE' : '#E8F5E9',
          color: actionMsg.type === 'error' ? '#C62828' : '#2E7D32',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          {actionMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('catalogo')}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: activeTab === 'catalogo' ? '700' : '500',
            backgroundColor: activeTab === 'catalogo' ? 'var(--color-mauve)' : '#FFFFFF',
            color: activeTab === 'catalogo' ? '#FFFFFF' : 'var(--color-text-dark)',
            border: '1px solid var(--color-border)'
          }}
        >
          Catálogo General ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('asignaciones')}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: activeTab === 'asignaciones' ? '700' : '500',
            backgroundColor: activeTab === 'asignaciones' ? 'var(--color-mauve)' : '#FFFFFF',
            color: activeTab === 'asignaciones' ? '#FFFFFF' : 'var(--color-text-dark)',
            border: '1px solid var(--color-border)'
          }}
        >
          Productos Asignados a Clientes ({clientProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          style={{
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: activeTab === 'solicitudes' ? '700' : '500',
            backgroundColor: activeTab === 'solicitudes' ? 'var(--color-mauve)' : '#FFFFFF',
            color: activeTab === 'solicitudes' ? '#FFFFFF' : 'var(--color-text-dark)',
            border: '1px solid var(--color-border)'
          }}
        >
          Solicitudes de Clientes ({productRequests.length})
        </button>
      </div>

      {/* TAB 1: CATÁLOGO */}
      {activeTab === 'catalogo' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Producto & Marca</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Categoría</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Tratamiento Asociado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Precio</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Frecuencia Indicada</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{p.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-dark)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{p.brand}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{p.category}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {p.related_treatment || 'General'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--color-mauve)' }}>
                    Bs {p.price}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem' }}>
                    {p.frequency}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenProductEdit(p)} style={{ color: 'var(--color-mauve)', padding: '0.3rem' }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleProductDelete(p.id)} style={{ color: '#C62828', padding: '0.3rem' }} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ASIGNACIONES DE CLIENTES */}
      {activeTab === 'asignaciones' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cliente Asignado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Producto Cosmético</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Fecha Inicio</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Frecuencia Prescrita</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Observaciones</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientProducts.map(cp => (
                <tr key={cp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{cp.id}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '700' }}>{cp.client_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{cp.client_email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: '600' }}>{cp.product_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{cp.product_brand}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>{cp.start_date}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: 'var(--color-mauve)' }}>
                    {cp.usage_frequency}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
                    {cp.observations || 'Sin notas'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveAssignment(cp.id)}
                      style={{ color: '#C62828', padding: '0.3rem' }}
                      title="Desvincular producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SOLICITUDES DE CLIENTES */}
      {activeTab === 'solicitudes' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FFFDF9', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: '#666' }}>
            ℹ️ Las solicitudes de producto no descuentan inventario automáticamente. Al confirmar la entrega física presencial, puedes pulsar <strong>"Entregar y Descontar Stock"</strong>.
          </div>
          {productRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              No hay solicitudes registradas de clientes.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-floral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>ID</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cliente</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Producto</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Sucursal Retiro</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Cantidad</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Total (Bs)</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700' }}>Estado</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '700', textAlign: 'right' }}>Gestionar Estado</th>
                </tr>
              </thead>
              <tbody>
                {productRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>#{req.id}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '700' }}>{req.client_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{req.client_phone || req.client_email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '600' }}>{req.product_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{req.product_brand}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>{req.branch_name}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>{req.quantity} ud(s)</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--color-mauve)' }}>
                      Bs {(parseFloat(req.product_price) * req.quantity).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge ${
                        req.status === 'ENTREGADA' ? 'badge-status-confirmada' :
                        req.status === 'LISTA_RECOJO' ? 'badge-gold' :
                        req.status === 'CONFIRMADA' ? 'badge-facial' :
                        req.status === 'CANCELADA' ? 'badge-status-cancelada' : 'badge-status-pendiente'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {req.status === 'RECIBIDA' && (
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, 'CONFIRMADA')}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Confirmar
                          </button>
                        )}
                        {req.status === 'CONFIRMADA' && (
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, 'LISTA_RECOJO')}
                            className="btn-gold"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Lista para Retiro
                          </button>
                        )}
                        {(req.status === 'CONFIRMADA' || req.status === 'LISTA_RECOJO') && (
                          <button
                            onClick={() => {
                              if (window.confirm('¿Confirmas que el cliente retiró físicamente el producto y abonó presencialmente en cabina? Se descontará del inventario de la sede.')) {
                                handleUpdateRequestStatus(req.id, 'ENTREGADA', true);
                              }
                            }}
                            className="btn-primary"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Entregar y Descontar
                          </button>
                        )}
                        {req.status !== 'ENTREGADA' && req.status !== 'CANCELADA' && (
                          <button
                            onClick={() => {
                              if (window.confirm('¿Deseas cancelar esta solicitud?')) {
                                handleUpdateRequestStatus(req.id, 'CANCELADA');
                              }
                            }}
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: '4px', background: '#FFEBEE' }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      {productModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto Cosmecéutico'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Marca Cosmética *</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio de Venta (Bs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows="2"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instrucciones de Uso Domiciliario</label>
                <textarea
                  value={productForm.usage_instructions}
                  onChange={(e) => setProductForm({ ...productForm, usage_instructions: e.target.value })}
                  rows="2"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setProductModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Producto a Cliente */}
      {assignModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'serif', color: 'var(--color-mauve)' }}>
                Prescribir Producto a Paciente
              </h3>
              <button onClick={() => setAssignModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Seleccionar Paciente *</label>
                <select
                  value={assignForm.client_id}
                  onChange={(e) => setAssignForm({ ...assignForm, client_id: e.target.value })}
                  className="form-control"
                  required
                >
                  {clients.map(c => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Producto a Asignar *</label>
                <select
                  value={assignForm.product_id}
                  onChange={(e) => setAssignForm({ ...assignForm, product_id: e.target.value })}
                  className="form-control"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={assignForm.start_date}
                    onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Frecuencia de Uso *</label>
                  <input
                    type="text"
                    value={assignForm.usage_frequency}
                    onChange={(e) => setAssignForm({ ...assignForm, usage_frequency: e.target.value })}
                    placeholder="Ej. Cada 4 horas en el día"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Indicaciones Especiales para el Paciente</label>
                <textarea
                  value={assignForm.observations}
                  onChange={(e) => setAssignForm({ ...assignForm, observations: e.target.value })}
                  rows="3"
                  className="form-control"
                  placeholder="Ej. Aplicar sobre piel húmeda tras la limpieza facial..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
