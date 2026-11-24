const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

const { requireAuth, requireAdmin, requireStaff } = require('./src/lib/auth');
const {
  consultarDisponibilidad,
  crearCitaCore,
  modificarCitaCore,
  cancelarCitaCore,
  cambiarEstadoCitaCore,
} = require('./src/services/citasService');
const {
  registrarMovimientoCore,
  transferirProductoCore,
  auditarInventarioCore,
} = require('./src/services/inventarioService');
const { registrarTratamientoCore, registrarPagoCore } = require('./src/services/tratamientosService');
const { crearPerfilCore, crearStaffCore, asignarRolCore } = require('./src/services/usuariosService');
const { resumenGeneralCore } = require('./src/services/panelService');
const { chatbotMensajeCore } = require('./src/services/chatbotService');
const { crearN8nApp, notificarEventoCita } = require('./src/services/n8nService');

// Configuración global: región southamerica-east1 (Sao Paulo, óptima para Bolivia)
setGlobalOptions({
  region: 'southamerica-east1',
  maxInstances: 10,
});

// =============================================================================
// 1. MÓDULO DE CITAS Y DISPONIBILIDAD
// =============================================================================
exports.disponibilidad = onCall(async (request) => {
  return await consultarDisponibilidad(request.data || {});
});

exports.crearCita = onCall(async (request) => {
  const actor = await requireAuth(request);
  return await crearCitaCore({ actor, ...(request.data || {}) });
});

exports.modificarCita = onCall(async (request) => {
  const actor = await requireAuth(request);
  return await modificarCitaCore({ actor, ...(request.data || {}) });
});

exports.cancelarCita = onCall(async (request) => {
  const actor = await requireAuth(request);
  return await cancelarCitaCore({ actor, ...(request.data || {}) });
});

exports.cambiarEstadoCita = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await cambiarEstadoCitaCore({ actor, ...(request.data || {}) });
});

// =============================================================================
// 2. MÓDULO DE INVENTARIO
// =============================================================================
exports.registrarMovimiento = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await registrarMovimientoCore({ actor, ...(request.data || {}) });
});

exports.transferirProducto = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await transferirProductoCore({ actor, ...(request.data || {}) });
});

exports.auditarInventario = onCall(async (request) => {
  const actor = await requireAdmin(request);
  return await auditarInventarioCore({ actor });
});

// =============================================================================
// 3. MÓDULO DE TRATAMIENTOS Y PAGOS
// =============================================================================
exports.registrarTratamiento = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await registrarTratamientoCore({ actor, ...(request.data || {}) });
});

exports.registrarPago = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await registrarPagoCore({ actor, ...(request.data || {}) });
});

// =============================================================================
// 4. USUARIOS Y ROLES
// =============================================================================
exports.crearPerfil = onCall(async (request) => {
  return await crearPerfilCore({
    authContext: request.auth,
    ...(request.data || {}),
  });
});

exports.crearStaff = onCall(async (request) => {
  const actor = await requireAdmin(request);
  return await crearStaffCore({ actor, ...(request.data || {}) });
});

exports.asignarRol = onCall(async (request) => {
  const actor = await requireAdmin(request);
  return await asignarRolCore({ actor, ...(request.data || {}) });
});

// =============================================================================
// 5. PANEL CONSOLIDADO
// =============================================================================
exports.resumenGeneral = onCall(async (request) => {
  const actor = await requireStaff(request);
  return await resumenGeneralCore({ actor, ...(request.data || {}) });
});

// =============================================================================
// 6. CHATBOT E INTEGRACIÓN CON N8N
// =============================================================================
exports.chatbotMensaje = onCall(async (request) => {
  const uid = request.auth?.uid || null;
  const { mensaje, sessionId } = request.data || {};
  return await chatbotMensajeCore({ uid, mensaje, sessionId });
});

exports.n8nApi = onRequest(crearN8nApp());

exports.onCitaEvento = onDocumentWritten('citas/{citaId}', notificarEventoCita);
