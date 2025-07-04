import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSuppliers } from '../services/supplierService';

export default function ProductFilters({ onFilterChange }) {
    const { currentUser } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        selectedSupplier: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    useEffect(() => {
        const fetchSuppliers = async () => {
            if (currentUser?.activeCompanyId) {
                const supplierList = await getSuppliers(currentUser.activeCompanyId);
                setSuppliers(supplierList);
            }
        };
        fetchSuppliers();
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    // CORREÇÃO: A div externa "table-container" foi removida,
    // deixando apenas "filter-container" como o container principal.
    return (
        <div className="filter-container">
            <div className="filter-group">
                <label htmlFor="search">Pesquisar por Nome ou SKU</label>
                <input
                    id="search"
                    type="search"
                    name="searchTerm"
                    placeholder="Digite para pesquisar..."
                    value={filters.searchTerm}
                    onChange={handleInputChange}
                />
            </div>
            <div className="filter-group">
                <label htmlFor="supplier">Filtrar por Fornecedor</label>
                <select
                    id="supplier"
                    name="selectedSupplier"
                    value={filters.selectedSupplier}
                    onChange={handleInputChange}
                >
                    <option value="">Todos os Fornecedores</option>
                    {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="sortBy">Ordenar por</label>
                <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleInputChange}
                >
                    <option value="createdAt">Data de Adição</option>
                    <option value="name">Nome (A-Z)</option>
                    <option value="sku">SKU</option>
                    <option value="quantity">Quantidade</option>
                </select>
            </div>
            <div className="filter-group">
                <label htmlFor="sortOrder">Ordem</label>
                <select
                    id="sortOrder"
                    name="sortOrder"
                    value={filters.sortOrder}
                    onChange={handleInputChange}
                >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                </select>
            </div>
        </div>
    );
}
