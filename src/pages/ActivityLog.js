import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streamLogs } from '../services/logService';
import { getAllUsersInCompany } from '../services/userService';

const ACTION_TYPES = [
    'CRIAR_PRODUTO', 'EDITAR_PRODUTO', 'APAGAR_PRODUTO', 'MOVIMENTAR_STOCK',
    'CRIAR_FORNECEDOR', 'EDITAR_FORNECEDOR', 'APAGAR_FORNECEDOR',
    'CRIAR_CONVITE', 'CANCELAR_CONVITE', 'ACEITAR_CONVITE', 'REMOVER_UTILIZADOR', 'SAIR_DA_EMPRESA',
    'EDITAR_FUNÇÃO'
];

export default function ActivityLog() {
    const { currentUser } = useAuth();
    const [allLogs, setAllLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ action: '', userId: '' });

    const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
    const canViewLogs = ['Dono', 'Administrador', 'Gerente'].includes(userRole);

    useEffect(() => {
        if (canViewLogs && currentUser.activeCompanyId) {
            setLoading(true);
            
            getAllUsersInCompany(currentUser.activeCompanyId).then(userData => {
                setUsers(userData);
            });

            const unsubscribe = streamLogs(currentUser.activeCompanyId, (logs) => {
                setAllLogs(logs);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [currentUser, canViewLogs]);

    const filteredLogs = useMemo(() => {
        let logs = [...allLogs];
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.userId) {
            logs = logs.filter(log => log.user.uid === filters.userId);
        }
        return logs;
    }, [allLogs, filters]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (!canViewLogs) return <div className="page-container"><p>Acesso negado.</p></div>;
    if (loading) return <div className="page-container">A carregar logs...</div>;

    return (
        <div className="page-container">
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Log de Atividades da Empresa</h2>
            
            <div className="filter-container">
                <div className="filter-group">
                    <label htmlFor="action-filter">Filtrar por Ação</label>
                    <select id="action-filter" name="action" value={filters.action} onChange={handleFilterChange}>
                        <option value="">Todas as Ações</option>
                        {ACTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="user-filter">Filtrar por Utilizador</label>
                    <select id="user-filter" name="userId" value={filters.userId} onChange={handleFilterChange}>
                        <option value="">Todos os Utilizadores</option>
                        {users.map(user => <option key={user.uid} value={user.uid}>{user.displayName}</option>)}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Utilizador</th>
                                <th>Ação</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td data-label="Data">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}</td>
                                    <td data-label="Utilizador">{log.user.displayName}</td>
                                    <td data-label="Ação">{log.action}</td>
                                    <td data-label="Detalhes">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && !loading && <p style={{textAlign: 'center', marginTop: '20px'}}>Nenhuma atividade corresponde aos filtros.</p>}
            </div>
        </div>
    );
}
