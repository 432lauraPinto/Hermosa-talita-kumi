const { dispatchChat } = require('../services/n8nService');
const { tools } = require('../services/aiAgentService');

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    const user = req.user; // Puede ser null si es visitante no autenticado

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El mensaje no puede estar vacío.'
      });
    }

    const response = await dispatchChat({
      message: message.trim(),
      user
    });

    return res.json({
      success: true,
      ...response
    });
  } catch (err) {
    console.error('Error en handleChat:', err);
    return res.status(500).json({
      success: false,
      error: 'Lo sentimos, ocurrió un inconveniente temporal al procesar tu consulta. Por favor intenta nuevamente.'
    });
  }
}

// Endpoint directo para que n8n u otros clientes invoquen una herramienta específica del agente
async function executeToolDirectly(req, res) {
  try {
    const { toolName, params } = req.body;
    const user = req.user;

    if (!toolName || !tools[toolName]) {
      return res.status(400).json({
        success: false,
        error: `Herramienta desconocida: ${toolName}`
      });
    }

    // Si es herramienta de cliente, forzar el clientId autenticado (Seguridad Sección 26)
    const clientTools = [
      'consultar_perfil_cliente',
      'consultar_historial_tratamientos',
      'consultar_productos_cliente',
      'consultar_reservas_cliente',
      'consultar_pagos_cliente',
      'consultar_proxima_sesion'
    ];

    let result;
    if (clientTools.includes(toolName)) {
      if (!user || user.role !== 'CLIENTE' || !user.client_id) {
        return res.status(403).json({
          success: false,
          error: 'Operación no autorizada: requiere sesión activa de cliente.'
        });
      }
      result = await tools[toolName](user.client_id);
    } else if (toolName === 'crear_reserva' || toolName === 'cancelar_reserva') {
      if (!user || user.role !== 'CLIENTE' || !user.client_id) {
        return res.status(403).json({
          success: false,
          error: 'Operación no autorizada: requiere sesión activa de cliente.'
        });
      }
      result = await tools[toolName]({ ...params, clientId: user.client_id });
    } else {
      result = await tools[toolName](params || {});
    }

    return res.json({
      success: true,
      tool: toolName,
      data: result
    });
  } catch (err) {
    console.error('Error en executeToolDirectly:', err);
    return res.status(500).json({
      success: false,
      error: 'Error al ejecutar herramienta de IA.'
    });
  }
}

module.exports = {
  handleChat,
  executeToolDirectly
};
