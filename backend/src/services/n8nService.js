const http = require('http');
const https = require('https');
const { processChatMessage } = require('./aiAgentService');

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/agente-ia';

/**
 * Envía un payload a un webhook de n8n con timeout controlado
 */
async function sendToN8n(webhookPath, payload) {
  const fullUrl = N8N_WEBHOOK_URL.includes('/webhook/') 
    ? N8N_WEBHOOK_URL.replace(/\/webhook\/.*$/, `/webhook/${webhookPath}`) 
    : `${N8N_WEBHOOK_URL}/${webhookPath}`;

  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(fullUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const bodyData = JSON.stringify(payload);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData),
          'X-Source': 'Estetica-Backend'
        },
        timeout: 3000 // 3 segundos de tolerancia antes del fallback
      };

      const req = client.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(responseBody);
              resolve({ success: true, data: json });
            } catch (e) {
              resolve({ success: true, text: responseBody });
            }
          } else {
            reject(new Error(`n8n respondió con estado HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de conexión con n8n'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(bodyData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Procesa el mensaje del chat a través de n8n si está activo,
 * o a través del motor interno de IA para garantizar disponibilidad continua.
 */
async function dispatchChat({ message, user }) {
  try {
    if (process.env.ENABLE_N8N_DIRECT === 'true') {
      const n8nResult = await sendToN8n('agente-ia', {
        message,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.client_id
        } : null
      });

      if (n8nResult && n8nResult.data && n8nResult.data.reply) {
        return {
          ...n8nResult.data,
          source: 'n8n_workflow'
        };
      }
    }
  } catch (err) {
    console.warn(`[n8n-Aviso] Webhook n8n no disponible (${err.message}). Utilizando agente de ejecución directa.`);
  }

  // Fallback / Motor interno garantizado
  const localResult = await processChatMessage({ message, user });
  return {
    ...localResult,
    source: 'internal_ai_agent'
  };
}

module.exports = {
  sendToN8n,
  dispatchChat
};
