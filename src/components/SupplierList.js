import React, { useState, useEffect, useMemo, useRef } from 'react';
import { streamSuppliers, deleteSupplier } from '../services/supplierService';
import { useAuth } from '../contexts/AuthContext';
import EditSupplierModal from './EditSupplierModal';

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);

export default function SupplierList({ filters }) {
  const { currentUser } = useAuth();
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const menuRef = useRef(null);

  const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
  const canManage = ['Dono', 'Administrador', 'Gerente'].includes(userRole);

  useEffect(() => {
    if (currentUser?.activeCompanyId) {
      setLoading(true);
      const unsubscribe = streamSuppliers(currentUser.activeCompanyId, (suppliers) => {
        setAllSuppliers(suppliers);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAllSuppliers([]);
      setLoading(false);
    }
  }, [currentUser?.activeCompanyId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processedSuppliers = useMemo(() => {
    let suppliers = [...allSuppliers];
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        suppliers = suppliers.filter(s => s.name.toLowerCase().includes(term) || (s.contact && s.contact.toLowerCase().includes(term)));
    }
    const { sortBy, sortOrder } = filters;
    suppliers.sort((a, b) => {
        switch (sortBy) {
            case 'name': return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            case 'createdAt': default: return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        }
    });
    if (sortOrder === 'desc') suppliers.reverse();
    return suppliers;
  }, [allSuppliers, filters]);

  const handleDelete = async (supplier) => {
    setOpenActionMenu(null);
    if (window.confirm("Tem a certeza que deseja excluir este fornecedor?")) {
      try {
        await deleteSupplier(currentUser.activeCompanyId, supplier, currentUser);
      } catch(err) {
        alert("Falha ao excluir fornecedor.");
      }
    }
  };
  
  if (loading) return <div className="table-container">A carregar fornecedores...</div>

  return (
    <>
      <EditSupplierModal 
        supplier={editingSupplier} 
        onClose={() => setEditingSupplier(null)} 
      />

      <div className="table-container">
        <h3>{processedSuppliers.length} Fornecedores Encontrados</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Telefone</th>
                {canManage && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {processedSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td data-label="Nome">{supplier.name}</td>
                  <td data-label="Contato">{supplier.contact || 'N/A'}</td>
                  <td data-label="Telefone">{supplier.phone || 'N/A'}</td>
                  {canManage && (
                    <td data-label="Ações">
                      <div className="actions-cell">
                        <button 
                          className="action-menu-button"
                          onClick={() => setOpenActionMenu(openActionMenu === supplier.id ? null : supplier.id)}
                        >
                          <MoreIcon />
                        </button>
                        {openActionMenu === supplier.id && (
                          <div className="action-menu" ref={menuRef}>
                            <button onClick={() => { setEditingSupplier(supplier); setOpenActionMenu(null); }}>Editar</button>
                            <button onClick={() => handleDelete(supplier)}>Excluir</button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processedSuppliers.length === 0 && !loading && <p>Nenhum fornecedor corresponde aos filtros selecionados.</p>}
      </div>
    </>
  );
}
