const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { db } = require('../lib/firebase');
const { ahoraBolivia, sumarDias } = require('../lib/time');
const { aCentavos, deCentavos } = require('../lib/money');
const { consultarDisponibilidad, crearCitaCore, cancelarCitaCore } = require('./citasService');

function validarApiKey(req, res, next) {
  const esperada = process.env.N8N_API_KEY || '';
  const recibida = String(req.header('x-api-key') || '');

  if (!esperada || !recibida) {
    return res.status(401).json({ ok: false, error: 'Cabecera x-api-key requerida.' });
  }

  const bufA = Buffer.from(esperada);
  const bufB = Buffer.from(recibida);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return res.status(401).json({ ok: false, error: 'x-api-key inválida.' });
  }

  return next();
}

function mapHttpsErrorStatus(err) {
  const code = err?.code || '';
  if (code === 'invalid-argument') return 400;
  if (code === 'unauthenticated') return 401;
  if (code === 'permission-denied') return 403;
  if (code === 'not-found') return 404;
  if (code === 'already-exists' || code === 'resource-exhausted' || code === 'failed-precondition') return 409;
  return 500;
}

function crearN8nApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use(validarApiKey);

  // GET /servicios (?sucursalId opcional)
  app.get('/servicios', async (req, res) => {
    try {
      const { sucursalId } = req.query;
      const snap = await db.collection('servicios').where('activo', '==', true).get();
      let servicios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (sucursalId) {
        servicios = servicios.filter(
          (s) => !Array.isArray(s.sucursales) || s.sucursales.includes(String(sucursalId))
        );
      }
      res.json({ ok: true, servicios });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /sucursales
  app.get('/sucursales', async (_req, res) => {
    try {
      const snap = await db.collection('sucursales').where('activa', '==', true).get();
      const sucursales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ ok: true, sucursales });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /promociones
  app.get('/promociones', async (_req, res) => {
    try {
      const snap = await db.collection('promociones').get();
      const promociones = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.activa !== false);
      res.json({ ok: true, promociones });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /disponibilidad?sucursalId&servicioId&fecha
  app.get('/disponibilidad', async (req, res) => {
    try {
      const { sucursalId, servicioId, fecha } = req.query;
      const data = await consultarDisponibilidad({
        sucursalId: String(sucursalId || ''),
        servicioId: String(servicioId || ''),
        fecha: String(fecha || ''),
      });
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(mapHttpsErrorStatus(err)).json({ ok: false, error: err.message });
    }
  });

  // GET /citas?clienteId=...
  app.get('/citas', async (req, res) => {
    try {
      const clienteId = String(req.query.clienteId || '').trim();
      if (!clienteId) {
        return res.status(400).json({ ok: false, error: 'El parámetro clienteId es obligatorio.' });
      }
      const snap = await db.collection('citas').where('clienteId', '==', clienteId).get();
      const citas = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
      res.json({ ok: true, citas });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // POST /citas (pasa por la misma función del núcleo `crearCitaCore`)
  app.post('/citas', async (req, res) => {
    try {
      const { clienteId, sucursalId, servicioId, fecha, hora, notas } = req.body || {};
      if (!clienteId) {
        return res.status(401).json({
          ok: false,
          error: 'Debes iniciar sesión para reservar una cita.',
        });
      }
      const cita = await crearCitaCore({
        actor: { uid: String(clienteId), role: 'n8n', email: null },
        clienteId: String(clienteId),
        sucursalId,
        servicioId,
        fecha,
        hora,
        canal: 'chatbot',
        notas: notas || 'Reservada mediante asistente virtual n8n',
      });
      res.status(201).json({ ok: true, cita });
    } catch (err) {
      res.status(mapHttpsErrorStatus(err)).json({ ok: false, error: err.message });
    }
  });

  // POST /citas/cancelar (pasa por la misma función del núcleo `cancelarCitaCore`)
  app.post('/citas/cancelar', async (req, res) => {
    try {
      const { clienteId, citaId, motivo } = req.body || {};
      if (!clienteId) {
        return res.status(401).json({
          ok: false,
          error: 'Debes iniciar sesión para cancelar una cita.',
        });
      }
      const resultado = await cancelarCitaCore({
        actor: { uid: String(clienteId), role: 'n8n', email: null },
        citaId,
        motivo: motivo || 'Cancelada vía asistente virtual n8n',
      });
      res.json({ ok: true, ...resultado });
    } catch (err) {
      res.status(mapHttpsErrorStatus(err)).json({ ok: false, error: err.message });
    }
  });

  // GET /saldo?clienteId=...
  app.get('/saldo', async (req, res) => {
    try {
      const clienteId = String(req.query.clienteId || '').trim();
      if (!clienteId) {
        return res.status(400).json({ ok: false, error: 'El parámetro clienteId es obligatorio.' });
      }
      const snap = await db.collection('tratamientos').where('clienteId', '==', clienteId).get();
      const tratamientos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const saldoTotalC = tratamientos.reduce((acc, t) => acc + aCentavos(t.saldo || 0), 0);
      res.json({
        ok: true,
        clienteId,
        saldoTotal: deCentavos(saldoTotalC),
        tratamientos,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /citas-manana (para recordatorios diarios a las 18:00 America/La_Paz)
  app.get('/citas-manana', async (_req, res) => {
    try {
      const hoy = ahoraBolivia().fecha;
      const manana = sumarDias(hoy, 1);

      const [citasSnap, sucSnap] = await Promise.all([
        db.collection('citas').where('fecha', '==', manana).get(),
        db.collection('sucursales').get(),
      ]);
      const sucMap = new Map(sucSnap.docs.map((d) => [d.id, d.data()]));

      const citas = citasSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => ['pendiente', 'confirmada'].includes(c.estado))
        .map((c) => ({
          ...c,
          sucursalWhatsapp: sucMap.get(c.sucursalId)?.whatsapp || '',
          sucursalDireccion: sucMap.get(c.sucursalId)?.direccion || '',
        }));

      res.json({ ok: true, fecha: manana, total: citas.length, citas });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /stock-bajo (flujo opcional de alertas de stock bajo al admin)
  app.get('/stock-bajo', async (_req, res) => {
    try {
      const [invSnap, prodSnap, sucSnap] = await Promise.all([
        db.collection('inventario').get(),
        db.collection('productos').get(),
        db.collection('sucursales').get(),
      ]);
      const prodMap = new Map(prodSnap.docs.map((d) => [d.id, d.data()]));
      const sucMap = new Map(sucSnap.docs.map((d) => [d.id, d.data()]));

      const alertas = [];
      for (const doc of invSnap.docs) {
        const inv = doc.data();
        const prod = prodMap.get(inv.productoId);
        const minimo = Number(inv.stockMinimo ?? prod?.stockMinimo ?? 2);
        const stock = Number(inv.stock || 0);
        if (stock <= minimo) {
          alertas.push({
            id: doc.id,
            sucursalId: inv.sucursalId,
            sucursalNombre: sucMap.get(inv.sucursalId)?.nombre || inv.sucursalId,
            productoId: inv.productoId,
            productoNombre: prod?.nombre || inv.productoId,
            stock,
            stockMinimo: minimo,
          });
        }
      }

      res.json({ ok: true, total: alertas.length, alertas });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return app;
}

/**
 * Envía eventos de alta, confirmación o cancelación de citas a N8N_EVENTOS_WEBHOOK_URL.
 * No lanza excepción si n8n está apagado para no interferir con la operación local.
 */
async function notificarEventoCita(event) {
  const webhookUrl = process.env.N8N_EVENTOS_WEBHOOK_URL;
  if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) return;

  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  if (!after) return;

  let tipoEvento = null;
  if (!before) {
    tipoEvento = 'cita_creada';
  } else if (before.estado !== 'confirmada' && after.estado === 'confirmada') {
    tipoEvento = 'cita_confirmada';
  } else if (before.estado !== 'cancelada' && after.estado === 'cancelada') {
    tipoEvento = 'cita_cancelada';
  }

  if (!tipoEvento) return;

  const sucSnap = await db.collection('sucursales').doc(after.sucursalId).get();
  const sucursal = sucSnap.exists ? sucSnap.data() : {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_API_KEY || '',
      },
      body: JSON.stringify({
        tipoEvento,
        citaId: event.params.citaId,
        cita: {
          clienteId: after.clienteId,
          clienteNombre: after.clienteNombre,
          clienteTelefono: after.clienteTelefono,
          sucursalId: after.sucursalId,
          sucursalNombre: after.sucursalNombre || sucursal.nombre || '',
          sucursalWhatsapp: sucursal.whatsapp || '',
          servicioNombre: after.servicioNombre || '',
          fecha: after.fecha,
          hora: after.hora,
          estado: after.estado,
          canal: after.canal,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    console.warn(`[onCitaEvento] n8n no disponible (${tipoEvento}): ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  crearN8nApp,
  notificarEventoCita,
};
