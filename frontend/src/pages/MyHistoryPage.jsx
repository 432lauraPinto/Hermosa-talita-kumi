import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { formatBs, formatFecha, formatFechaHora } from '../utils/format';
import { CreditCard, FileText, CheckCircle2 } from 'lucide-react';

export default function MyHistoryPage() {
  const { user } = useAuth();
  const [tratamientos, setTratamientos] = useState([]);
  const [pagos, setPagos] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const u1 = onSnapshot(
      query(collection(db, 'tratamientos'), where('clienteId', '==', user.uid)),
      (snap) => {
        setTratamientos(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
        );
      }
    );
    const u2 = onSnapshot(
      query(collection(db, 'pagos'), where('clienteId', '==', user.uid)),
      (snap) => {
        setPagos(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.fechaStr || '').localeCompare(a.fechaStr || ''))
        );
      }
    );
    return () => {
      u1();
      u2();
    };
  }, [user?.uid]);

  const saldoTotal = tratamientos.reduce((acc, t) => acc + Number(t.saldo || 0), 0);
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.1rem', color: '#C46A86' }}>Mi Historial de Tratamientos y Pagos</h1>
        <p style={{ color: '#6C525F' }}>
          Consulta tus tratamientos realizados, el avance de tus cuotas y tu comprobante histórico de pagos.
        </p>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#6C525F', fontWeight: 700 }}>Tratamientos registrados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C46A86' }}>{tratamientos.length}</div>
        </div>
        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#6C525F', fontWeight: 700 }}>Total abonado</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#156E42' }}>{formatBs(totalPagado)}</div>
        </div>
        <div className="card-elegant" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: '#6C525F', fontWeight: 700 }}>Saldo pendiente</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: saldoTotal > 0 ? '#9E610A' : '#156E42' }}>
            {formatBs(saldoTotal)}
          </div>
        </div>
      </div>

      {/* Tratamientos y Cuotas */}
      <h2 style={{ fontSize: '1.45rem', color: '#C46A86', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={20} /> Tratamientos y plan de cuotas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {tratamientos.length === 0 ? (
          <div className="card-elegant" style={{ padding: '2rem', color: '#6C525F', textAlign: 'center' }}>
            Todavía no tienes tratamientos registrados en tu historial.
          </div>
        ) : (
          tratamientos.map((t) => (
            <div key={t.id} className="card-elegant" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <span className={t.saldo === 0 ? 'badge badge-success' : 'badge badge-warning'}>
                    {t.saldo === 0 ? 'Completado / Pagado' : 'Con saldo pendiente'}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', marginTop: '0.35rem' }}>{t.servicioNombre}</h3>
                  <div style={{ fontSize: '0.88rem', color: '#6C525F' }}>
                    {t.sucursalNombre} • Fecha: {formatFecha(t.fecha)}
                  </div>
                  {t.notas && <p style={{ fontSize: '0.86rem', color: '#4A3B43', marginTop: '0.35rem' }}>Notas: {t.notas}</p>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6C525F' }}>Total: <strong>{formatBs(t.total)}</strong></div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: t.saldo > 0 ? '#9E610A' : '#156E42' }}>
                    Saldo: {formatBs(t.saldo)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.65rem' }}>
                {(t.cuotas || []).map((c) => (
                  <div
                    key={c.numero}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid #F6C6D3',
                      backgroundColor: c.estado === 'pagada' ? '#E8F8F0' : c.estado === 'parcial' ? '#FFF8E6' : '#FFF9F6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.84rem' }}>
                      <span>Cuota #{c.numero}</span>
                      {c.estado === 'pagada' && <CheckCircle2 size={15} color="#156E42" />}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '0.2rem' }}>{formatBs(c.monto)}</div>
                    <div style={{ fontSize: '0.76rem', color: '#6C525F' }}>
                      Pagado: {formatBs(c.pagado)} | Saldo: {formatBs(c.saldo)}
                    </div>
                    {c.fechaVencimiento && (
                      <div style={{ fontSize: '0.72rem', color: '#9F3E5E', marginTop: '0.2rem' }}>
                        Vence: {formatFecha(c.fechaVencimiento)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historial de pagos */}
      <h2 style={{ fontSize: '1.45rem', color: '#C46A86', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CreditCard size={20} /> Pagos realizados
      </h2>

      <div className="card-elegant" style={{ overflowX: 'auto' }}>
        {pagos.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6C525F' }}>No hay pagos registrados aún.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Fecha</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tratamiento</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sucursal</th>
                <th style={{ padding: '0.85rem 1rem' }}>Cuota</th>
                <th style={{ padding: '0.85rem 1rem' }}>Método</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                  <td style={{ padding: '0.8rem 1rem' }}>{p.fecha ? formatFechaHora(p.fecha) : formatFecha(p.fechaStr)}</td>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{p.servicioNombre || p.tratamientoId}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>{p.sucursalNombre}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>#{p.numeroCuota || '—'}</td>
                  <td style={{ padding: '0.8rem 1rem', textTransform: 'capitalize' }}>{p.metodo}</td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 800, color: '#156E42' }}>
                    {formatBs(p.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
