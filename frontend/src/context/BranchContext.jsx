import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await api.getBranches();
        if (res.success && res.branches && res.branches.length > 0) {
          setBranches(res.branches);

          // Recuperar selección previa o usar Villa Fátima por defecto
          const savedId = localStorage.getItem('htk_selected_branch_id');
          const found = res.branches.find(b => String(b.id) === String(savedId));
          const defaultBranch = found || res.branches[0];

          setSelectedBranch(defaultBranch);
        }
      } catch (err) {
        console.error('Error al cargar sucursales en BranchContext:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  const selectBranch = (branchOrId) => {
    let branch = null;
    if (typeof branchOrId === 'object' && branchOrId !== null) {
      branch = branchOrId;
    } else {
      branch = branches.find(b => String(b.id) === String(branchOrId));
    }

    if (branch) {
      setSelectedBranch(branch);
      localStorage.setItem('htk_selected_branch_id', branch.id);
    }
  };

  return (
    <BranchContext.Provider value={{
      branches,
      selectedBranch,
      selectBranch,
      loading,
      isBranchModalOpen,
      setIsBranchModalOpen
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch debe ser utilizado dentro de un BranchProvider');
  }
  return context;
}
