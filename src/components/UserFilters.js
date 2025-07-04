import React, { useState, useEffect } from 'react';

export default function UserFilters({ onFilterChange }) {
    const [filters, setFilters] = useState({
        searchTerm: '',
        sortBy: 'displayName',
        sortOrder: 'asc'
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
                <label htmlFor="search">Pesquisar por Nome ou Email</label>
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
                    <option value="displayName">Nome (A-Z)</option>
                    <option value="email">Email (A-Z)</option>
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
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                </select>
            </div>
        </div>
    );
}
