import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

const ORDEN_SEDES = ['villa-fatima', 'upea', 'ceja', 'max-paredes'];

export function BranchProvider({ children }) {
  const { user, isEncargado } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [sucursalActivaId, setSucursalActivaId] = useState('villa-fatima');
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'sucursales'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ia = ORDEN_SEDES.indexOf(a.id);
            const ib = ORDEN_SEDES.indexOf(b.id);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          });
        setSucursales(list);
        setLoadingBranches(false);
      },
      (err) => {
        console.warn('[BranchContext] Error cargando sucursales:', err.message);
        setLoadingBranches(false);
      }
    );
    return () => unsub();
  }, []);

  const sucursalesActivas = useMemo(
    () => sucursales.filter((s) => s.activa !== false),
    [sucursales]
  );

  const sucursalesStaff = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return sucursales;
    if (isEncargado) {
      return sucursales.filter((s) => user.sucursales.includes(s.id));
    }
    return [];
  }, [user, isEncargado, sucursales]);

  useEffect(() => {
    if (isEncargado && sucursalesStaff.length > 0) {
      if (!sucursalesStaff.some((s) => s.id === sucursalActivaId)) {
        setSucursalActivaId(sucursalesStaff[0].id);
      }
    } else if (sucursalesActivas.length > 0 && !sucursalesActivas.some((s) => s.id === sucursalActivaId)) {
      setSucursalActivaId(sucursalesActivas[0].id);
    }
  }, [isEncargado, sucursalesStaff, sucursalesActivas, sucursalActivaId]);

  const sucursalActiva = useMemo(
    () => sucursales.find((s) => s.id === sucursalActivaId) || sucursales[0] || null,
    [sucursales, sucursalActivaId]
  );

  return (
    <BranchContext.Provider
      value={{
        sucursales,
        sucursalesActivas,
        sucursalesStaff,
        sucursalActiva,
        sucursalActivaId,
        setSucursalActivaId,
        loadingBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch debe usarse dentro de BranchProvider');
  return ctx;
}
