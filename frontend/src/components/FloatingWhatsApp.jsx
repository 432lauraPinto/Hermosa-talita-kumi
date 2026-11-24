import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { whatsappUrl } from '../utils/format';

export default function FloatingWhatsApp() {
  const { sucursalActiva } = useBranch();
  const phone = sucursalActiva?.whatsapp || '+591 77197857';
  const branchName = sucursalActiva?.nombre || 'Villa Fátima';

  return (
    <a
      href={whatsappUrl(phone, `Hola, quisiera información sobre la sucursal ${branchName} de HERMOSA TALITA KUMI.`)}
      target="_blank"
      rel="noreferrer"
      className="btn-whatsapp-pulse"
      title={`WhatsApp ${branchName}: ${phone}`}
      style={{
        position: 'fixed',
        bottom: '92px',
        right: '24px',
        zIndex: 900,
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)',
      }}
    >
      <MessageCircle size={26} />
    </a>
  );
}
