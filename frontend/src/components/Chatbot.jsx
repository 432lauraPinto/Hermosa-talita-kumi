import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { api } from '../services/api';
import { MessageCircle, X, Send, Sparkles, User, Bot, Trash2, Calendar, Phone, ArrowRight } from 'lucide-react';

export default function Chatbot({ onNavigate }) {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const welcomeMessage = {
    id: 'welcome',
    sender: 'bot',
    text: '¡Hola y la paz del Señor sea contigo! Bienvenida a Hermosa Talita Kumi, centro estético facial y corporal cristiano. Puedo informarte sobre nuestros tratamientos en las 7 categorías, precios en Bolivianos (Bs), nuestras 4 sucursales (Villa Fátima, UPEA, Ceja y Max Paredes) o consultar la disponibilidad de turnos. ¿En qué podemos orientarte hoy?',
    quickReplies: ['¿Dónde están las 4 sucursales?', 'Ver precios y servicios', 'Promociones especiales', 'Hablar por WhatsApp', 'Agendar cita']
  };

  const [messages, setMessages] = useState([welcomeMessage]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage(query);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.reply || 'He recibido tu mensaje. ¿Deseas consultar sobre algún tratamiento en especial?',
        quickReplies: response.quickReplies || ['Ver servicios', 'Sucursales', 'Agendar cita']
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Disculpa, ocurrió una dificultad de conexión. Puedes escribirnos directamente a nuestro WhatsApp o intentar en unos instantes.',
          quickReplies: ['Escribir por WhatsApp', 'Ver sucursales']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([welcomeMessage]);
  };

  const handleQuickReply = (reply) => {
    if (reply === 'Agendar cita') {
      setIsOpen(false);
      onNavigate('booking');
      return;
    }
    if (reply === 'Ver servicios' || reply === 'Ver precios y servicios') {
      setIsOpen(false);
      onNavigate('services');
      return;
    }
    if (reply === 'Promociones especiales') {
      setIsOpen(false);
      onNavigate('promotions');
      return;
    }
    if (reply === 'Hablar por WhatsApp' || reply === 'Escribir por WhatsApp') {
      const phone = selectedBranch?.whatsapp ? selectedBranch.whatsapp.replace(/[^0-9]/g, '') : '62353452';
      const cleanPhone = phone.startsWith('591') ? phone : `591${phone}`;
      const msg = encodeURIComponent(`Hola, quiero hacer una consulta sobre la sucursal ${selectedBranch?.name || 'Villa Fátima'} de Hermosa Talita Kumi`);
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
      return;
    }
    handleSend(reply);
  };

  return (
    <>
      {/* Botón Flotante con Movimiento y Pulso */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-pulse btn-motion"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #C46A86 0%, #D77FA1 100%)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '58px',
            height: '58px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(196, 106, 134, 0.5)',
            border: '2.5px solid #FFFFFF',
            cursor: 'pointer'
          }}
          title="Abrir Asistente Virtual Hermosa Talita Kumi"
        >
          <Sparkles size={26} />
        </button>
      )}

      {/* Ventana de Chatbot */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '360px',
          maxWidth: 'calc(100vw - 32px)',
          height: '520px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 16px 45px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          border: '1.5px solid #F6C6D3',
          overflow: 'hidden'
        }}>
          {/* Header de Chatbot */}
          <div style={{
            backgroundColor: '#C46A86',
            color: '#FFFFFF',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#FFF8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src="/logo-talitakumi.png"
                  alt="Logo Talita Kumi"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/logo-talitakumi.jpg'; }}
                />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Asistente Talita Kumi</div>
                <div style={{ fontSize: '0.72rem', color: '#F7DFA8' }}>En línea • 4 Sucursales</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleClearHistory}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
                title="Borrar conversación"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
                title="Cerrar chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Cuerpo de Mensajes */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            backgroundColor: '#FFF8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.sender === 'user' ? '#C46A86' : '#FFFFFF',
                  color: msg.sender === 'user' ? '#FFFFFF' : '#333333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>

                {/* Respuestas Rápidas */}
                {msg.quickReplies && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem', maxWidth: '90%' }}>
                    {msg.quickReplies.map((qr, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickReply(qr)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#C46A86',
                          border: '1px solid #F6C6D3',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '15px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF', padding: '0.5rem 0.85rem', borderRadius: '15px', fontSize: '0.8rem', color: '#888888' }}>
                Consultando disponibilidad y servicios...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '0.75rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #F6C6D3',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              placeholder="Haz tu consulta aquí..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                borderRadius: '20px',
                border: '1px solid #D0D0D0',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                backgroundColor: inputMessage.trim() ? '#C46A86' : '#E0E0E0',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMessage.trim() ? 'pointer' : 'default'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
