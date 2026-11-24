import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useBranch } from '../context/BranchContext';
import { formatBs } from '../utils/format';
import { Clock, Search, Calendar, MapPin } from 'lucide-react';

export default function ServicesPage() {
  const { sucursalesActivas } = useBranch();
  const [servicios, setServicios] = useState([]);
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'servicios'), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.activo !== false)
        .sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nombre.localeCompare(b.nombre));
      setServicios(items);
    });
    return () => unsub();
  }, []);

  const categorias = useMemo(() => {
    return Array.from(new Set(servicios.map((s) => s.categoria).filter(Boolean)));
  }, [servicios]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return servicios.filter((s) => {
      if (sucursalFiltro !== 'todas') {
        if (Array.isArray(s.sucursales) && !s.sucursales.includes(sucursalFiltro)) return false;
      }
      if (categoriaFiltro !== 'todas' && s.categoria !== categoriaFiltro) return false;
      if (q && !`${s.nombre} ${s.descripcion} ${s.categoria}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [servicios, sucursalFiltro, categoriaFiltro, busqueda]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-gold">Precios oficiales en Bolivianos (Bs)</span>
        <h1 style={{ fontSize: '2.3rem', color: '#C46A86', marginTop: '0.5rem' }}>Servicios y Precios</h1>
        <p style={{ color: '#6C525F', maxWidth: '640px', margin: '0.4rem auto 0' }}>
          Filtra por sucursal o categoría para conocer la disponibilidad exacta, duración y tarifa de cada tratamiento.
        </p>
      </div>

      {/* Filtros */}
      <div
        className="card-elegant"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <MapPin size={14} style={{ verticalAlign: 'middle' }} /> Filtrar por sucursal
          </label>
          <select
            className="form-control"
            value={sucursalFiltro}
            onChange={(e) => setSucursalFiltro(e.target.value)}
          >
            <option value="todas">Todas las sucursales (4 sedes)</option>
            {sucursalesActivas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Categoría
          </label>
          <select
            className="form-control"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <Search size={14} style={{ verticalAlign: 'middle' }} /> Buscar tratamiento
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: limpieza, baño de luna, masaje..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Resultados */}
      <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#6C525F', fontWeight: 600 }}>
        Mostrando {filtrados.length} de {servicios.length} servicios activos
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filtrados.map((s) => (
          <div key={s.id} className="card-elegant img-zoom-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '165px', overflow: 'hidden' }}>
              <img
                src={s.imagen || '/trat_limpieza_facial.png'}
                alt={s.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-mauve" style={{ fontSize: '0.74rem', marginBottom: '0.45rem' }}>
                  {s.categoria}
                </span>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{s.nombre}</h3>
                <p style={{ fontSize: '0.88rem', color: '#6C525F', marginBottom: '0.9rem' }}>{s.descripcion}</p>
              </div>
              <div style={{ borderTop: '1px solid #FDF1F4', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C46A86' }}>{formatBs(s.precio)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6C525F', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {s.duracionMin} min
                  </div>
                </div>
                <Link
                  to={`/reservar?servicioId=${s.id}${sucursalFiltro !== 'todas' ? `&sucursalId=${sucursalFiltro}` : ''}`}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.05rem', fontSize: '0.86rem' }}
                >
                  <Calendar size={15} /> Reservar
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
