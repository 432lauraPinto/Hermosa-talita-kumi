import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useBranch } from '../context/BranchContext';

export default function FloatingWhatsApp() {
  const { selectedBranch } = useBranch();

  const getWhatsAppHref = () => {
    const rawNumber = '59162353452';
    const branchName = selectedBranch?.name || 'Villa Fátima';
    const msg = encodeURIComponent(
      `Hola, quisiera consultar los servicios y horarios de atención de Hermosa Talita Kumi.`
    );
    return `https://wa.me/${rawNumber}?text=${msg}`;
  };

  return (
    <a
      href={getWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="btn-pulse"
      style={{
        position: 'fixed',
        bottom: '92px',
        right: '24px',
        zIndex: 999,
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        borderRadius: '50%',
        width: '54px',
        height: '54px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)',
        border: '2.5px solid #FFFFFF',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      title="Escribir por WhatsApp a Hermosa Talita Kumi (+591 62353452)"
    >
      <MessageCircle size={28} />
    </a>
  );
}
