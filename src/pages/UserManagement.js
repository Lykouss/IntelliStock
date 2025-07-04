import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streamUsersInCompany, createInvite, updateUserProfile, streamPendingInvites, deleteInvite, removeUserFromCompany } from '../services/userService';
import { getCompanyDetails } from '../services/companyService';
import UserFilters from '../components/UserFilters';

const MoreIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const RoleSelector = ({ user, companyId, onRoleChange }) => {
    const { currentUser } = useAuth();
    const currentUserRole = currentUser.companies[companyId];
    const [role, setRole] = useState(user.companies[companyId]);
    const handleRoleChange = async (e) => {
        const newRole = e.target.value; setRole(newRole);
        try {
            await updateUserProfile(user.uid, { [`companies.${companyId}`]: newRole }, currentUser);
            onRoleChange(user.uid, newRole);
        } catch (error) { alert("Falha ao atualizar a função."); setRole(user.companies[companyId]); }
    };
    const isOwner = user.companies[companyId] === 'Dono';
    const isSelf = user.uid === currentUser.uid;
    const isDisabled = isOwner || isSelf;
    return (
        <select value={role} onChange={handleRoleChange} disabled={isDisabled} title={isDisabled ? "Não pode alterar a função do Dono ou a sua própria." : ""} className="filter-group-select">
            <option value="Operador">Operador</option>
            <option value="Gerente">Gerente</option>
            {currentUserRole === 'Dono' && <option value="Administrador">Administrador</option>}
            {isOwner && <option value="Dono">Dono</option>}
        </select>
    );
};

export default function UserManagement() {
    const { currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('Operador');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [filters, setFilters] = useState({ searchTerm: '', sortBy: 'displayName', sortOrder: 'asc' });
    
    const [openUserMenu, setOpenUserMenu] = useState(null);
    const [openInviteMenu, setOpenInviteMenu] = useState(null);
    const userMenuRef = useRef(null);
    const inviteMenuRef = useRef(null);

    const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
    const canManageUsers = ['Dono', 'Administrador'].includes(userRole);
    
    useEffect(() => {
        if (canManageUsers && currentUser.activeCompanyId) {
            setLoading(true);
            getCompanyDetails(currentUser.activeCompanyId).then(details => setCompanyName(details?.name || ''));
            const unsubUsers = streamUsersInCompany(currentUser.activeCompanyId, (users) => {
                setAllUsers(users);
                setLoading(false);
            });
            const unsubInvites = streamPendingInvites(currentUser.activeCompanyId, (invites) => setPendingInvites(invites));
            return () => { unsubUsers(); unsubInvites(); };
        } else { setLoading(false); }
    }, [currentUser, canManageUsers]);

    // Efeito para fechar os menus
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setOpenUserMenu(null);
            if (inviteMenuRef.current && !inviteMenuRef.current.contains(event.target)) setOpenInviteMenu(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFilterChange = useCallback((newFilters) => setFilters(newFilters), []);

    const processedUsers = useMemo(() => {
        let users = [...allUsers];
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            users = users.filter(u => u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
        }
        users.sort((a, b) => (a[filters.sortBy]?.toLowerCase() || '').localeCompare(b[filters.sortBy]?.toLowerCase() || ''));
        if (filters.sortOrder === 'desc') users.reverse();
        return users;
    }, [allUsers, filters]);

    const handleCreateInvite = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        if (allUsers.find(usr => usr.email.toLowerCase() === newUserEmail.toLowerCase())) {
            setError("Este utilizador já é membro da sua empresa."); return;
        }
        try {
            await createInvite(currentUser.activeCompanyId, companyName, newUserEmail, newUserName, newUserRole, currentUser);
            setMessage(`Convite pendente criado para ${newUserEmail}.`);
            setNewUserEmail(''); setNewUserName('');
        } catch (err) { setError(err.message || 'Erro ao criar convite.'); }
    };

    const handleDeleteInvite = async (invite) => {
        setOpenInviteMenu(null);
        if (window.confirm(`Tem a certeza que deseja cancelar este convite?`)) {
            try { await deleteInvite(currentUser.activeCompanyId, invite, currentUser); } 
            catch (err) { alert("Falha ao apagar o convite."); }
        }
    };

    const handleRemoveUser = async (userToRemove) => {
        setOpenUserMenu(null);
        if (userToRemove.companies[currentUser.activeCompanyId] === 'Dono') { alert("Não pode remover o Dono."); return; }
        if (window.confirm(`Tem a certeza que deseja remover ${userToRemove.displayName} desta empresa?`)) {
            try { await removeUserFromCompany(currentUser.activeCompanyId, userToRemove, currentUser); } 
            catch (error) { alert("Falha ao remover o funcionário."); }
        }
    };

    const handleRoleChangeInList = (userId, newRole) => {
        setAllUsers(prev => prev.map(user =>
            user.uid === userId ? { ...user, companies: { ...user.companies, [currentUser.activeCompanyId]: newRole } } : user
        ));
    };

    if (!canManageUsers) return <div className="page-container"><p>Acesso negado.</p></div>;
    if (loading) return <div className="page-container">A carregar...</div>;

    return (
        <div className="page-container">
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Gestão de Utilizadores</h2>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Convidar Novo Funcionário</h3>
                <form onSubmit={handleCreateInvite} className="filter-container">
                    <div className="filter-group"><label>Nome Completo</label><input type="text" placeholder="Nome do funcionário" value={newUserName} onChange={e => setNewUserName(e.target.value)} required /></div>
                    <div className="filter-group"><label>Email</label><input type="email" placeholder="Email do funcionário" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required /></div>
                    <div className="filter-group"><label>Função</label><select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}><option value="Operador">Operador</option><option value="Gerente">Gerente</option>{userRole === 'Dono' && <option value="Administrador">Administrador</option>}</select></div>
                    <div className="filter-group" style={{justifyContent: 'flex-end'}}><button type="submit" disabled={!canManageUsers} style={{width:'100%', padding:'10px', border:'none', backgroundColor: canManageUsers ? '#3498db' : '#bdc3c7', color:'white', borderRadius:'8px', cursor: canManageUsers ? 'pointer' : 'not-allowed'}}>Criar Convite</button></div>
                </form>
                {message && <p style={{ color: 'green' }}>{message}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            
            <div className="table-container">
                <h3>Funcionários Registados</h3>
                <UserFilters onFilterChange={handleFilterChange} />
                <div className="table-wrapper" style={{marginTop: '20px'}}>
                    <table className="data-table">
                        <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Ações</th></tr></thead>
                        <tbody>
                            {processedUsers.map(user => (<tr key={user.uid}>
                                <td data-label="Nome">{user.displayName}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Função"><RoleSelector user={user} companyId={currentUser.activeCompanyId} onRoleChange={handleRoleChangeInList} /></td>
                                <td data-label="Ações">
                                    <div className="actions-cell" ref={openUserMenu === user.uid ? userMenuRef : null}>
                                        <button className="action-menu-button" onClick={() => setOpenUserMenu(openUserMenu === user.uid ? null : user.uid)}><MoreIcon /></button>
                                        {openUserMenu === user.uid && user.uid !== currentUser.uid && userRole === 'Dono' && (
                                            <div className="action-menu">
                                                <button onClick={() => handleRemoveUser(user)}>Remover</button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="table-container">
                <h3>Convites Pendentes</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Email</th><th>Nome</th><th>Função</th><th>Ações</th></tr></thead>
                        <tbody>
                            {pendingInvites.map(invite => (<tr key={invite.id}>
                                <td data-label="Email">{invite.email}</td>
                                <td data-label="Nome">{invite.displayName}</td>
                                <td data-label="Função">{invite.role}</td>
                                <td data-label="Ações">
                                    <div className="actions-cell" ref={openInviteMenu === invite.id ? inviteMenuRef : null}>
                                        <button className="action-menu-button" onClick={() => setOpenInviteMenu(openInviteMenu === invite.id ? null : invite.id)}><MoreIcon /></button>
                                        {openInviteMenu === invite.id && (
                                            <div className="action-menu">
                                                <button onClick={() => handleDeleteInvite(invite)}>Cancelar Convite</button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
