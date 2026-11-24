import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { callFn } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { extraerMensajeError } from '../utils/format';

const SUGERENCIAS = [
  '¿Qué precios tienen los tratamientos faciales?',
  '¿Dónde están las 4 sucursales y sus horarios?',
  '¿Cuáles son las promociones activas?',
  'Ver mis citas y mi saldo',
];

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      rol: 'asistente',
      texto:
        '¡Hola! Soy el asistente de HERMOSA TALITA KUMI. Pregúntame por precios en Bs, horarios de nuestras 4 sucursales, promociones o tus citas y saldo.',
      origen: 'bienvenida',
    },
  ]);

  const sessionId = useMemo(
    () => user?.uid || `web_${Math.random().toString(36).slice(2, 10)}`,
    [user?.uid]
  );

  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function enviarMensaje(textoOpcional) {
    const texto = String(textoOpcional ?? input).trim();
    if (!texto || sending) return;

    setMessages((prev) => [...prev, { rol: 'usuario', texto }]);
    setInput('');
    setSending(true);

    try {
      const res = await callFn('chatbotMensaje', { mensaje: texto, sessionId });
      setMessages((prev) => [
        ...prev,
        {
          rol: 'asistente',
          texto: res.respuesta || 'No pude generar una respuesta en este momento.',
          origen: res.origenRespuesta || 'fallback_local',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          rol: 'asistente',
          texto: `No se pudo contactar al asistente (${extraerMensajeError(err)}). Intenta nuevamente.`,
          origen: 'error',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '90px',
            width: 'min(390px, calc(100vw - 32px))',
            height: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            border: '2px solid #F6C6D3',
            boxShadow: '0 20px 55px rgba(44, 22, 34, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 950,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #B54E6F 0%, #C46A86 100%)',
              color: '#FFFFFF',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bot size={22} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Asistente Talita Kumi</div>
                <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>
                  {user ? `Sesión activa: ${user.nombre.split(' ')[0]}` : 'Consultas públicas • Inicia sesión para reservar'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ color: '#FFFFFF', padding: '4px' }}
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mensajes */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              backgroundColor: '#FFF9F6',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  backgroundColor: m.rol === 'usuario' ? '#C46A86' : '#FFFFFF',
                  color: m.rol === 'usuario' ? '#FFFFFF' : '#2C1622',
                  padding: '0.7rem 0.95rem',
                  borderRadius: m.rol === 'usuario' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  border: m.rol === 'usuario' ? 'none' : '1px solid #F6C6D3',
                  fontSize: '0.88rem',
                  whiteSpace: 'pre-line',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {m.texto}
                {m.origen && m.origen !== 'bienvenida' && m.rol === 'asistente' && (
                  <div style={{ fontSize: '0.68rem', color: '#9F3E5E', marginTop: '0.35rem', fontWeight: 700 }}>
                    {m.origen === 'n8n' ? 'Respondido vía n8n IA' : 'Respondido vía motor de respaldo local'}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div style={{ fontSize: '0.82rem', color: '#9F3E5E', fontStyle: 'italic' }}>
                Consultando catálogo oficial...
              </div>
            )}
          </div>

          {/* Chips rápidos */}
          <div
            style={{
              padding: '0.45rem 0.75rem',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              borderTop: '1px solid #F6C6D3',
              backgroundColor: '#FFFFFF',
            }}
          >
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviarMensaje(s)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.74rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  backgroundColor: '#FDF1F4',
                  color: '#9F3E5E',
                  border: '1px solid #F6C6D3',
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.7rem',
              borderTop: '1px solid #F6C6D3',
              backgroundColor: '#FFFFFF',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Escribe tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary"
              style={{ padding: '0.55rem 0.9rem', borderRadius: '14px' }}
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-primary animate-pulse-glow"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 950,
          borderRadius: '999px',
          padding: '0.85rem 1.25rem',
          boxShadow: '0 8px 25px rgba(181, 78, 111, 0.45)',
        }}
      >
        <Sparkles size={18} />
        <span>{open ? 'Cerrar asistente' : 'Asistente IA'}</span>
      </button>
    </>
  );
}
