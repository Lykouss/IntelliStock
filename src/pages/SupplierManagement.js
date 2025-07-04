import React, { useState, useCallback } from 'react';
import AddSupplierForm from '../components/AddSupplierForm';
import SupplierList from '../components/SupplierList';
import SupplierFilters from '../components/SupplierFilters';
import { useAuth } from '../contexts/AuthContext';

export default function SupplierManagement() {
  const { currentUser } = useAuth();
  const [listKey, setListKey] = useState(0);
  const [filters, setFilters] = useState({
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
  const canManage = ['Dono', 'Administrador', 'Gerente'].includes(userRole);

  const handleSupplierChange = useCallback(() => {
    setListKey(prevKey => prevKey + 1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="page-container">
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>Gestão de Fornecedores</h2>
      
      <div className="responsive-layout">
        <div className="responsive-sidebar">
          {canManage && (
            <AddSupplierForm onSupplierAdded={handleSupplierChange} />
          )}
        </div>
        
        <div className="responsive-main" style={{ marginTop: '20px' }}>
          <SupplierFilters onFilterChange={handleFilterChange} />
          <div style={{ marginTop: '20px' }}>
            <SupplierList key={listKey} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
