const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('estetica_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth & 2FA
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  verifyMFALogin: (data) => request('/auth/verify-mfa', { method: 'POST', body: JSON.stringify(data) }),
  setupMFA: () => request('/auth/mfa/setup', { method: 'POST' }),
  enableMFA: (data) => request('/auth/mfa/enable', { method: 'POST', body: JSON.stringify(data) }),
  disableMFA: (data) => request('/auth/mfa/disable', { method: 'POST', body: JSON.stringify(data) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/me', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Sucursales (Las 4 Sedes Oficiales)
  getBranches: () => request('/branches'),
  getBranchById: (id) => request(`/branches/${id}`),
  createBranch: (data) => request('/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id, data) => request(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id) => request(`/branches/${id}`, { method: 'DELETE' }),

  // Categorías y Servicios
  getCategories: () => request('/services/categories'),
  getServices: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/services${q ? `?${q}` : ''}`);
  },
  getServiceById: (id) => request(`/services/${id}`),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // Promociones Especiales
  getPromotions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/promotions${q ? `?${q}` : ''}`);
  },
  getPromotionById: (id) => request(`/promotions/${id}`),
  createPromotion: (data) => request('/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updatePromotion: (id, data) => request(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Contenido de Portada y Versículos
  getVerses: () => request('/content/verses'),
  getHeroSlides: () => request('/content/hero'),
  updateVerse: (id, data) => request(`/content/verses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Citas / Reservas y Calendario
  getAvailableSlots: (date, branchId = 1, serviceId = null) => {
    const q = new URLSearchParams({
      date,
      branch_id: branchId,
      ...(serviceId ? { service_id: serviceId } : {})
    }).toString();
    return request(`/appointments/available-slots?${q}`);
  },
  holdSlot: (data) => request('/appointments/hold', { method: 'POST', body: JSON.stringify(data) }),
  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/appointments${q ? `?${q}` : ''}`);
  },
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelAppointment: (id, reason) => request(`/appointments/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),

  // Notificaciones
  getNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/notifications${q ? `?${q}` : ''}`);
  },
  markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsAsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Tratamientos y Reglas
  getTreatments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/treatments${q ? `?${q}` : ''}`);
  },
  createTreatment: (data) => request('/treatments', { method: 'POST', body: JSON.stringify(data) }),
  getTreatmentHistory: (clientId) => request(`/treatments/history/${clientId}`),
  recordTreatmentSession: (data) => request('/treatments/record-session', { method: 'POST', body: JSON.stringify(data) }),
  getRules: () => request('/rules'),
  createRule: (data) => request('/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) => request(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id) => request(`/rules/${id}`, { method: 'DELETE' }),

  // Productos e Inventario por Sucursal
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getInventory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/inventory${q ? `?${q}` : ''}`);
  },
  registerInventoryMovement: (data) => request('/inventory/movement', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryMovements: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/inventory/movements${q ? `?${q}` : ''}`);
  },

  // Solicitudes de Productos (sin cobro web)
  createProductRequest: (data) => request('/product-requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyProductRequests: () => request('/product-requests/my'),
  getAllProductRequests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/product-requests${q ? `?${q}` : ''}`);
  },
  updateProductRequestStatus: (id, data) => request(`/product-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Pagos
  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/payments${q ? `?${q}` : ''}`);
  },
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Clientes y Dashboard
  getClients: () => request('/clients'),
  getClientDetails: (id) => request(`/clients/${id}`),
  getMyFollowUp: () => request('/follow-up/my-status'),
  getClientFollowUp: (id) => request(`/follow-up/client/${id}`),
  getDashboardStats: (branchId) => request(`/dashboard/stats${branchId ? `?branch_id=${branchId}` : ''}`),

  // Chatbot / Agente de IA
  sendChatMessage: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Conexión en Tiempo Real (SSE) para calendarios y notificaciones
  subscribeToEvents: (onMessage, onError) => {
    try {
      const eventSource = new EventSource(`${API_BASE_URL}/appointments/events`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage && onMessage(data);
        } catch (e) {
          console.warn('Error parseando evento SSE:', e);
        }
      };
      eventSource.onerror = (err) => {
        console.warn('Conexión SSE reconectando o fallida:', err);
        onError && onError(err);
      };
      return () => {
        eventSource.close();
      };
    } catch (e) {
      console.warn('No se pudo inicializar EventSource:', e);
      return () => {};
    }
  }
};
