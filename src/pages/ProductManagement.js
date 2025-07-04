import React, { useState, useCallback } from 'react';
import AddProductForm from '../components/AddProductForm';
import ProductList from '../components/ProductList';
import ProductFilters from '../components/ProductFilters';
import { useAuth } from '../contexts/AuthContext';

export default function ProductManagement() {
  const { currentUser } = useAuth();
  const [listKey, setListKey] = useState(0);
  const [filters, setFilters] = useState({ searchTerm: '', selectedSupplier: '' });

  const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
  const canAddProducts = ['Dono', 'Administrador', 'Gerente', 'Operador'].includes(userRole);

  const handleProductChange = useCallback(() => {
    setListKey(prevKey => prevKey + 1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    // O container agora é mais simples, pois o layout principal é gerido pelo Dashboard.js
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>Gestão de Produtos</h2>
      
      {canAddProducts && (
        <AddProductForm onProductAdded={handleProductChange} />
      )}

      <ProductFilters onFilterChange={handleFilterChange} />
      
      <ProductList key={listKey} filters={filters} />
    </div>
  );
}
