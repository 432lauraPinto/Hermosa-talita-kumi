const { HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../lib/firebase');
const { formatearBs, aCentavos, deCentavos } = require('../lib/money');
const { formatearFechaBO, ahoraBolivia } = require('../lib/time');

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de reglas local de respaldo cuando n8n no está encendido o no responde.
 * Usa directamente las colecciones `faq`, `servicios`, `promociones` y `sucursales` de Firestore.
 */
async function responderLocalFallback({ mensaje, uid = null }) {
  const norm = normalizarTexto(mensaje);

  const [faqSnap, servSnap, sucSnap, promoSnap] = await Promise.all([
    db.collection('faq').get(),
    db.collection('servicios').where('activo', '==', true).get(),
    db.collection('sucursales').where('activa', '==', true).get(),
    db.collection('promociones').get(),
  ]);

  const faqs = faqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const servicios = servSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const sucursales = sucSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const promociones = promoSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.activa !== false);

  // 1. Consultas personales: mis citas / mi saldo / cuotas
  if (/(mis citas|mi cita|mi reserva|reservas|cancelar cita)/.test(norm)) {
    if (!uid) {
      return 'Para consultar, reservar o cancelar tus citas personales, por favor inicia sesión primero en tu cuenta de HERMOSA TALITA KUMI.';
    }
    const hoy = ahoraBolivia().fecha;
    const citasSnap = await db.collection('citas').where('clienteId', '==', uid).get();
    const futuras = citasSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => c.fecha >= hoy && ['pendiente', 'confirmada'].includes(c.estado))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

    if (futuras.length === 0) {
      return 'No tienes citas próximas registradas en este momento. Puedes agendar una nueva desde la sección "Reservar".';
    }
    const lista = futuras
      .slice(0, 5)
      .map(
        (c) =>
          `• ${c.servicioNombre || c.servicioId} en ${c.sucursalNombre || c.sucursalId}: ${formatearFechaBO(
            c.fecha
          )} a las ${c.hora} (${c.estado})`
      )
      .join('\n');
    return `Estas son tus próximas citas activas:\n${lista}\n\nPuedes reprogramar o cancelar (con al menos 2 horas de anticipación) desde "Mis citas".`;
  }

  if (/(saldo|debo|cuota|cuotas|pagos|historial)/.test(norm)) {
    if (!uid) {
      return 'Para revisar tu saldo, historial de tratamientos o cuotas pendientes, por favor inicia sesión en tu cuenta.';
    }
    const tratSnap = await db.collection('tratamientos').where('clienteId', '==', uid).get();
    const trats = tratSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (trats.length === 0) {
      return 'Aún no tienes tratamientos con plan de pagos registrados en tu historial.';
    }
    const saldoTotalC = trats.reduce((acc, t) => acc + aCentavos(t.saldo || 0), 0);
    const detalle = trats
      .slice(0, 4)
      .map(
        (t) =>
          `• ${t.servicioNombre || t.servicioId} (${formatearFechaBO(t.fecha)}): Total ${formatearBs(
            t.total
          )}, Saldo ${formatearBs(t.saldo)}`
      )
      .join('\n');
    return `Tu saldo pendiente total es ${formatearBs(deCentavos(saldoTotalC))}.\n${detalle}`;
  }

  // 2. Sucursales, ubicaciones, horarios o WhatsApp
  if (/(sucursal|sede|ubicacion|direccion|donde|horario|whatsapp|telefono|villa fatima|upea|ceja|max paredes)/.test(norm)) {
    const coincidenciaSucursal = sucursales.find((s) =>
      norm.includes(normalizarTexto(s.nombre).split(' ')[0]) || norm.includes(s.id.replace('-', ' '))
    );
    const objetivo = coincidenciaSucursal ? [coincidenciaSucursal] : sucursales;
    const texto = objetivo
      .map(
        (s) =>
          `• ${s.nombre} (${s.ciudad}): ${s.direccion}. Horario: ${s.horario?.apertura || '08:30'} a ${
            s.horario?.cierre || '19:30'
          } (Lun-Sáb). WhatsApp: ${s.whatsapp}`
      )
      .join('\n');
    return `Nuestras sedes oficiales de HERMOSA TALITA KUMI:\n${texto}`;
  }

  // 3. Promociones
  if (/(promo|promocion|descuento|oferta)/.test(norm)) {
    if (promociones.length === 0) {
      return 'Por el momento no tenemos promociones activas publicadas, pero puedes ver nuestro catálogo completo de servicios y precios.';
    }
    const texto = promociones
      .map((p) => `• ${p.titulo}: ${p.descripcion} (${p.descuento}) — Vigencia: ${p.vigencia}`)
      .join('\n');
    return `Estas son nuestras promociones vigentes:\n${texto}`;
  }

  // 4. Coincidencia específica de un servicio o pregunta de precios
  const serviciosCoincidentes = servicios.filter((s) => {
    const palabras = normalizarTexto(s.nombre)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    const catNorm = normalizarTexto(s.categoria);
    return (
      (catNorm && norm.includes(catNorm)) ||
      palabras.some((w) => norm.includes(w))
    );
  });

  if (serviciosCoincidentes.length > 0) {
    const lista = serviciosCoincidentes
      .slice(0, 6)
      .map((s) => `• ${s.nombre}: ${formatearBs(s.precio)} (${s.duracionMin} min)`)
      .join('\n');
    return `Encontré estos servicios en nuestro catálogo oficial:\n${lista}\n\nSi deseas agendar, puedes usar la opción "Reservar" o indicarnos la sucursal y fecha.`;
  }

  if (/(precio|costo|cuanto|tarifa|servicio|tratamiento|catalogo)/.test(norm)) {
    const destacados = servicios
      .slice(0, 6)
      .map((s) => `• ${s.nombre}: ${formatearBs(s.precio)} (${s.duracionMin} min)`)
      .join('\n');
    return `Algunos de nuestros servicios más solicitados son:\n${destacados}\n\nPuedes explorar todos los servicios y filtrar por sucursal en la sección "Servicios".`;
  }

  // 5. Coincidencia con preguntas frecuentes (`faq`)
  let mejorFaq = null;
  let mejorPuntaje = 0;
  for (const item of faqs) {
    const tokens = [
      ...(Array.isArray(item.palabrasClave) ? item.palabrasClave : []),
      ...normalizarTexto(item.pregunta).split(/\s+/),
    ]
      .map(normalizarTexto)
      .filter((t) => t.length >= 3);

    const puntaje = tokens.reduce((acc, tok) => (norm.includes(tok) ? acc + 1 : acc), 0);
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorFaq = item;
    }
  }
  if (mejorFaq && mejorPuntaje >= 1) {
    return mejorFaq.respuesta;
  }

  // 6. Saludo o respuesta guiada por defecto
  if (/(hola|buen|buenas|saludos|gracias)/.test(norm)) {
    return '¡Hola! Bienvenida a HERMOSA TALITA KUMI. Puedo ayudarte con precios de servicios, horarios y direcciones de nuestras 4 sucursales, promociones vigentes, o consultar tus citas y saldos si iniciaste sesión. ¿En qué te ayudo hoy?';
  }

  return 'Con gusto te ayudo. Puedes preguntarme sobre nuestros servicios y precios en Bs, promociones activas, direcciones y horarios de nuestras 4 sucursales (Villa Fátima, UPEA, Ceja y Max Paredes), o consultar tus citas y saldo si iniciaste sesión.';
}

async function chatbotMensajeCore({ uid = null, mensaje, sessionId = null }) {
  const texto = String(mensaje || '').trim();
  if (!texto) {
    throw new HttpsError('invalid-argument', 'Escribe un mensaje para el asistente.');
  }
  if (texto.length > 600) {
    throw new HttpsError('invalid-argument', 'El mensaje no puede superar los 600 caracteres.');
  }

  const sid = String(sessionId || uid || `anon_${Date.now()}`).slice(0, 80);
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  let respuesta = '';
  let origenRespuesta = 'fallback_local';

  if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          mensaje: texto,
          uid: uid || null,
          sessionId: sid,
          origen: 'web',
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const payload = await res.json().catch(() => null);
        const candidata =
          payload?.respuesta || payload?.output || payload?.text || payload?.message || '';
        if (typeof candidata === 'string' && candidata.trim().length > 0) {
          respuesta = candidata.trim();
          origenRespuesta = 'n8n';
        }
      }
    } catch (_err) {
      // Silencioso: cae al motor de reglas local
    } finally {
      clearTimeout(timer);
    }
  }

  if (!respuesta) {
    respuesta = await responderLocalFallback({ mensaje: texto, uid });
    origenRespuesta = 'fallback_local';
  }

  // Persistir historial de chat (solo lectura admin según firestore.rules)
  const chatRef = db.collection('chats').doc(sid);
  await chatRef.set(
    {
      sessionId: sid,
      uid: uid || null,
      ultimoOrigen: origenRespuesta,
      actualizadoEn: FieldValue.serverTimestamp(),
      mensajes: FieldValue.arrayUnion(
        { rol: 'usuario', texto, fechaIso: new Date().toISOString() },
        { rol: 'asistente', texto: respuesta, origen: origenRespuesta, fechaIso: new Date().toISOString() }
      ),
    },
    { merge: true }
  );

  return {
    respuesta,
    origenRespuesta,
    sessionId: sid,
  };
}

module.exports = {
  responderLocalFallback,
  chatbotMensajeCore,
};
