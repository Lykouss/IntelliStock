import React, { useState, useEffect } from 'react';

export default function SupplierFilters({ onFilterChange }) {
    const [filters, setFilters] = useState({
        searchTerm: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

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

    return (
        <div className="filter-container">
            <div className="filter-group">
                <label htmlFor="search">Pesquisar por Nome ou Contato</label>
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
                <label htmlFor="sortBy">Ordenar por</label>
                <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleInputChange}
                >
                    <option value="createdAt">Data de Adição</option>
                    <option value="name">Nome (A-Z)</option>
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
