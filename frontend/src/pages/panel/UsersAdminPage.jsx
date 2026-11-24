import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, callFn } from '../../firebase';
import { useBranch } from '../../context/BranchContext';
import { extraerMensajeError } from '../../utils/format';
import { UserPlus } from 'lucide-react';

export default function UsersAdminPage() {
  const { sucursales } = useBranch();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '+591 ',
    role: 'encargado',
    sucursales: ['villa-fatima'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsuarios(
        snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .sort((a, b) => (a.role || '').localeCompare(b.role || '') || (a.nombre || '').localeCompare(b.nombre || ''))
      );
    });
    return () => unsub();
  }, []);

  function toggleSucursalForm(id) {
    setForm((f) => ({
      ...f,
      sucursales: f.sucursales.includes(id)
        ? f.sucursales.filter((x) => x !== id)
        : [...f.sucursales, id],
    }));
  }

  async function handleCrearStaff(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await callFn('crearStaff', form);
      setMsg(`Usuario ${form.email} creado con rol "${form.role}" y claims sincronizados.`);
      setForm({ nombre: '', email: '', password: '', telefono: '+591 ', role: 'encargado', sucursales: ['villa-fatima'] });
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function cambiarRol(u, nuevoRol, nuevasSucursales, activo) {
    setError('');
    setMsg('');
    try {
      await callFn('asignarRol', {
        targetUid: u.uid,
        role: nuevoRol,
        sucursales: nuevasSucursales,
        activo,
      });
      setMsg(`Permisos de ${u.nombre} actualizados.`);
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <div className="badge badge-danger" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{error}</div>}
      {msg && <div className="badge badge-success" style={{ display: 'block', padding: '0.8rem 1rem', borderRadius: '12px' }}>{msg}</div>}

      {/* Crear encargado / admin */}
      <form onSubmit={handleCrearStaff} className="card-elegant" style={{ padding: '1.4rem', display: 'grid', gap: '0.9rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <UserPlus size={18} /> Crear nuevo encargado o administrador
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <input required className="form-control" placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input required type="email" className="form-control" placeholder="Correo electrónico" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" minLength={6} className="form-control" placeholder="Contraseña (mín. 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="form-control" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="encargado">Encargado de sucursal</option>
            <option value="admin">Administrador general</option>
          </select>
        </div>

        {form.role === 'encargado' && (
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.4rem' }}>Sucursales asignadas:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {sucursales.map((s) => (
                <label key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '999px', border: '1px solid #F6C6D3', backgroundColor: '#FFF9F6', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={form.sucursales.includes(s.id)}
                    onChange={() => toggleSucursalForm(s.id)}
                  />
                  {s.nombre}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creando...' : 'Crear personal'}
          </button>
        </div>
      </form>

      {/* Tabla de usuarios */}
      <div className="card-elegant" style={{ overflowX: 'auto', padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#C46A86', marginBottom: '0.9rem' }}>
          Usuarios registrados ({usuarios.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#FDF1F4', textAlign: 'left' }}>
              <th style={{ padding: '0.7rem' }}>Usuario</th>
              <th style={{ padding: '0.7rem' }}>Rol</th>
              <th style={{ padding: '0.7rem' }}>Sucursales</th>
              <th style={{ padding: '0.7rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.uid} style={{ borderTop: '1px solid #F6C6D3' }}>
                <td style={{ padding: '0.7rem' }}>
                  <div style={{ fontWeight: 700 }}>{u.nombre}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6C525F' }}>{u.email} • {u.telefono}</div>
                </td>
                <td style={{ padding: '0.7rem' }}>
                  <select
                    className="form-control"
                    style={{ width: '140px', padding: '0.35rem 0.5rem' }}
                    value={u.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      const sucs = r === 'encargado' ? (u.sucursales?.length ? u.sucursales : ['villa-fatima']) : [];
                      cambiarRol(u, r, sucs, u.activo !== false);
                    }}
                  >
                    <option value="cliente">cliente</option>
                    <option value="encargado">encargado</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={{ padding: '0.7rem' }}>
                  {u.role === 'encargado' ? (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {sucursales.map((s) => {
                        const checked = (u.sucursales || []).includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              const next = checked
                                ? (u.sucursales || []).filter((x) => x !== s.id)
                                : [...(u.sucursales || []), s.id];
                              cambiarRol(u, 'encargado', next, u.activo !== false);
                            }}
                            className={checked ? 'badge badge-mauve' : 'badge'}
                            style={{ cursor: 'pointer', border: '1px solid #E5B9C7' }}
                          >
                            {s.nombre}
                          </button>
                        );
                      })}
                    </div>
                  ) : u.role === 'admin' ? (
                    <span className="badge badge-gold">Todas (4 sedes)</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '0.7rem' }}>
                  <button
                    type="button"
                    onClick={() => cambiarRol(u, u.role, u.sucursales || [], u.activo === false)}
                    className={u.activo !== false ? 'badge badge-success' : 'badge badge-danger'}
                    style={{ cursor: 'pointer' }}
                  >
                    {u.activo !== false ? 'Activo' : 'Desactivado'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
