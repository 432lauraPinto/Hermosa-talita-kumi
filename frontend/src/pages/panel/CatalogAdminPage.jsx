import React, { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { extraerMensajeError, formatBs } from '../../utils/format';
import { Save, Plus } from 'lucide-react';

export default function CatalogAdminPage() {
  const [tab, setTab] = useState('servicios');
  const [servicios, setServicios] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [nuevoServ, setNuevoServ] = useState({ nombre: '', categoria: 'Tratamientos faciales', precio: 150, duracionMin: 60, descripcion: '' });
  const [nuevaPromo, setNuevaPromo] = useState({ titulo: '', descripcion: '', descuento: '15% OFF', vigencia: '31/12/2026', precioPromo: 120, precioRegular: 150 });
  const [nuevoProd, setNuevoProd] = useState({ nombre: '', categoria: 'Facial', precio: 100, stockMinimo: 3 });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'servicios'), (s) => setServicios(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'promociones'), (s) => setPromociones(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, 'productos'), (s) => setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(collection(db, 'sucursales'), (s) => setSucursales(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  async function guardarDoc(col, id, payload, okMsg) {
    setError('');
    setMsg('');
    try {
      await updateDoc(doc(db, col, id), payload);
      setMsg(okMsg);
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function crearServicio(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await addDoc(collection(db, 'servicios'), {
        ...nuevoServ,
        precio: Number(nuevoServ.precio),
        duracionMin: Number(nuevoServ.duracionMin),
        sucursales: sucursales.map((s) => s.id),
        imagen: '/trat_limpieza_facial.png',
        activo: true,
        destacado: false,
      });
      setNuevoServ({ nombre: '', categoria: 'Tratamientos faciales', precio: 150, duracionMin: 60, descripcion: '' });
      setMsg('Servicio agregado al catálogo.');
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function crearPromocion(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await addDoc(collection(db, 'promociones'), {
        ...nuevaPromo,
        precioPromo: Number(nuevaPromo.precioPromo),
        precioRegular: Number(nuevaPromo.precioRegular),
        sucursales: sucursales.map((s) => s.id),
        imagen: '/promo_bano_luna_facial.png',
        activa: true,
      });
      setNuevaPromo({ titulo: '', descripcion: '', descuento: '15% OFF', vigencia: '31/12/2026', precioPromo: 120, precioRegular: 150 });
      setMsg('Promoción creada.');
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function crearProducto(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await addDoc(collection(db, 'productos'), {
        ...nuevoProd,
        precio: Number(nuevoProd.precio),
        stockMinimo: Number(nuevoProd.stockMinimo),
        imagen: '/prod_serum_facial.png',
        activo: true,
      });
      setNuevoProd({ nombre: '', categoria: 'Facial', precio: 100, stockMinimo: 3 });
      setMsg('Producto agregado al catálogo.');
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['servicios', 'promociones', 'productos', 'horarios'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.86rem', textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{msg}</div>}

      {/* SERVICIOS */}
      {tab === 'servicios' && (
        <>
          <form onSubmit={crearServicio} className="card-elegant" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ color: '#C46A86' }}><Plus size={16} style={{ verticalAlign: 'middle' }} /> Nuevo servicio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
              <input required className="form-control" placeholder="Nombre del servicio" value={nuevoServ.nombre} onChange={(e) => setNuevoServ({ ...nuevoServ, nombre: e.target.value })} />
              <input required className="form-control" placeholder="Categoría" value={nuevoServ.categoria} onChange={(e) => setNuevoServ({ ...nuevoServ, categoria: e.target.value })} />
              <input required type="number" step="0.01" className="form-control" placeholder="Precio Bs" value={nuevoServ.precio} onChange={(e) => setNuevoServ({ ...nuevoServ, precio: e.target.value })} />
              <input required type="number" className="form-control" placeholder="Duración min" value={nuevoServ.duracionMin} onChange={(e) => setNuevoServ({ ...nuevoServ, duracionMin: e.target.value })} />
            </div>
            <input className="form-control" placeholder="Descripción breve" value={nuevoServ.descripcion} onChange={(e) => setNuevoServ({ ...nuevoServ, descripcion: e.target.value })} />
            <div><button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>Agregar servicio</button></div>
          </form>

          <div className="card-elegant" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
                  <th style={{ padding: '0.7rem' }}>Servicio</th>
                  <th style={{ padding: '0.7rem' }}>Categoría</th>
                  <th style={{ padding: '0.7rem' }}>Precio (Bs)</th>
                  <th style={{ padding: '0.7rem' }}>Duración (min)</th>
                  <th style={{ padding: '0.7rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                    <td style={{ padding: '0.7rem', fontWeight: 700 }}>{s.nombre}</td>
                    <td style={{ padding: '0.7rem' }}>{s.categoria}</td>
                    <td style={{ padding: '0.7rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={s.precio}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v !== s.precio) guardarDoc('servicios', s.id, { precio: v }, `Precio de ${s.nombre} actualizado a ${formatBs(v)}.`);
                        }}
                        className="form-control"
                        style={{ width: '110px', padding: '0.35rem 0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.7rem' }}>{s.duracionMin} min</td>
                    <td style={{ padding: '0.7rem' }}>
                      <button
                        type="button"
                        onClick={() => guardarDoc('servicios', s.id, { activo: !s.activo }, `Estado de ${s.nombre} actualizado.`)}
                        className={s.activo !== false ? 'badge badge-success' : 'badge badge-danger'}
                        style={{ cursor: 'pointer' }}
                      >
                        {s.activo !== false ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PROMOCIONES */}
      {tab === 'promociones' && (
        <>
          <form onSubmit={crearPromocion} className="card-elegant" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ color: '#C46A86' }}>Nueva promoción</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
              <input required className="form-control" placeholder="Título" value={nuevaPromo.titulo} onChange={(e) => setNuevaPromo({ ...nuevaPromo, titulo: e.target.value })} />
              <input required className="form-control" placeholder="Etiqueta descuento (ej: 20% OFF)" value={nuevaPromo.descuento} onChange={(e) => setNuevaPromo({ ...nuevaPromo, descuento: e.target.value })} />
              <input required className="form-control" placeholder="Vigencia" value={nuevaPromo.vigencia} onChange={(e) => setNuevaPromo({ ...nuevaPromo, vigencia: e.target.value })} />
              <input required type="number" step="0.01" className="form-control" placeholder="Precio promo Bs" value={nuevaPromo.precioPromo} onChange={(e) => setNuevaPromo({ ...nuevaPromo, precioPromo: e.target.value })} />
            </div>
            <input required className="form-control" placeholder="Descripción" value={nuevaPromo.descripcion} onChange={(e) => setNuevaPromo({ ...nuevaPromo, descripcion: e.target.value })} />
            <div><button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>Crear promoción</button></div>
          </form>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {promociones.map((p) => (
              <div key={p.id} className="card-elegant" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.titulo} <span className="badge badge-gold">{p.descuento}</span></div>
                  <div style={{ fontSize: '0.86rem', color: '#6C525F' }}>{p.descripcion} — {p.vigencia}</div>
                </div>
                <button
                  type="button"
                  onClick={() => guardarDoc('promociones', p.id, { activa: p.activa === false }, `Promoción ${p.titulo} actualizada.`)}
                  className={p.activa !== false ? 'badge badge-success' : 'badge badge-danger'}
                >
                  {p.activa !== false ? 'Activa' : 'Pausada'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PRODUCTOS */}
      {tab === 'productos' && (
        <>
          <form onSubmit={crearProducto} className="card-elegant" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ color: '#C46A86' }}>Nuevo producto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
              <input required className="form-control" placeholder="Nombre del producto" value={nuevoProd.nombre} onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })} />
              <input required className="form-control" placeholder="Categoría" value={nuevoProd.categoria} onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })} />
              <input required type="number" step="0.01" className="form-control" placeholder="Precio Bs" value={nuevoProd.precio} onChange={(e) => setNuevoProd({ ...nuevoProd, precio: e.target.value })} />
              <input required type="number" className="form-control" placeholder="Stock mínimo" value={nuevoProd.stockMinimo} onChange={(e) => setNuevoProd({ ...nuevoProd, stockMinimo: e.target.value })} />
            </div>
            <div><button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>Agregar producto</button></div>
          </form>

          <div className="card-elegant" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
                  <th style={{ padding: '0.7rem' }}>Producto</th>
                  <th style={{ padding: '0.7rem' }}>Precio (Bs)</th>
                  <th style={{ padding: '0.7rem' }}>Stock mínimo</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F6C6D3' }}>
                    <td style={{ padding: '0.7rem', fontWeight: 700 }}>{p.nombre}</td>
                    <td style={{ padding: '0.7rem' }}>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={p.precio}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v !== p.precio) guardarDoc('productos', p.id, { precio: v }, `Precio de ${p.nombre} actualizado.`);
                        }}
                        className="form-control"
                        style={{ width: '110px', padding: '0.35rem 0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.7rem' }}>
                      <input
                        type="number"
                        min={0}
                        defaultValue={p.stockMinimo}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isInteger(v) && v !== p.stockMinimo) guardarDoc('productos', p.id, { stockMinimo: v }, `Stock mínimo de ${p.nombre} actualizado.`);
                        }}
                        className="form-control"
                        style={{ width: '90px', padding: '0.35rem 0.5rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* HORARIOS DE SUCURSALES */}
      {tab === 'horarios' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem' }}>
          {sucursales.map((s) => (
            <SucursalHorarioCard key={s.id} sucursal={s} onSave={(payload) => guardarDoc('sucursales', s.id, payload, `Horario de ${s.nombre} guardado.`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SucursalHorarioCard({ sucursal, onSave }) {
  const [apertura, setApertura] = useState(sucursal.horario?.apertura || '08:30');
  const [cierre, setCierre] = useState(sucursal.horario?.cierre || '19:30');
  const [slotMin, setSlotMin] = useState(sucursal.horario?.slotMin || 30);
  const [capacidad, setCapacidad] = useState(sucursal.capacidad || 2);

  return (
    <div className="card-elegant" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
      <h3 style={{ color: '#C46A86' }}>{sucursal.nombre} ({sucursal.ciudad})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Apertura</label>
          <input type="time" className="form-control" value={apertura} onChange={(e) => setApertura(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Cierre</label>
          <input type="time" className="form-control" value={cierre} onChange={(e) => setCierre(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Slot (min)</label>
          <input type="number" min={15} step={15} className="form-control" value={slotMin} onChange={(e) => setSlotMin(Number(e.target.value))} />
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Capacidad</label>
          <input type="number" min={1} max={10} className="form-control" value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} />
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          onSave({
            capacidad: Number(capacidad),
            horario: {
              ...(sucursal.horario || {}),
              apertura,
              cierre,
              slotMin: Number(slotMin),
            },
          })
        }
        className="btn-secondary"
        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
      >
        <Save size={15} /> Guardar horario
      </button>
    </div>
  );
}
