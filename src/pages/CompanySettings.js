import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCompanyDetails, updateCompanyDetails, transferCompanyOwnership, deleteCompany } from '../services/companyService';
import { getAllUsersInCompany, removeUserFromCompany } from '../services/userService';
import { useNavigate } from 'react-router-dom';

// Estilos
const pageStyles = { flexGrow: 1, padding: '20px', backgroundColor: '#f4f6f8', overflowY: 'auto' };
const containerStyles = { maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' };
const cardStyles = { padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
const formGroupStyles = { marginBottom: '20px' };
const labelStyles = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' };
const buttonStyles = { padding: '12px 20px', border: 'none', backgroundColor: '#3498db', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };
const dangerButtonStyles = { ...buttonStyles, backgroundColor: '#e74c3c' };
const disabledButtonStyles = { ...dangerButtonStyles, backgroundColor: '#c0392b', cursor: 'not-allowed' };


export default function CompanySettings() {
    const { currentUser, logout, refreshAuth } = useAuth();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [formData, setFormData] = useState({ name: '', cnpj: '' });
    const [usersInCompany, setUsersInCompany] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const activeCompanyId = currentUser?.activeCompanyId;
    const userRole = activeCompanyId ? currentUser?.companies?.[activeCompanyId] : null;

    const fetchData = useCallback(async () => {
        if (activeCompanyId) {
            setLoading(true);
            try {
                const details = await getCompanyDetails(activeCompanyId);
                const users = await getAllUsersInCompany(activeCompanyId);
                setCompany(details);
                setUsersInCompany(users);
                setFormData({ name: details?.name || '', cnpj: details?.cnpj || '' });
                if (userRole === 'Dono') {
                    setAdmins(users.filter(u => u.companies[activeCompanyId] === 'Administrador'));
                }
            } catch (err) { setError("Falha ao carregar dados."); }
            setLoading(false);
        } else { setLoading(false); }
    }, [activeCompanyId, userRole]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdate = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try { await updateCompanyDetails(activeCompanyId, formData); setMessage("Dados da empresa atualizados!"); } 
        catch (err) { setError("Ocorreu um erro ao salvar."); }
    };

    const handleTransfer = async () => {
        if (!selectedAdmin) { setError("Selecione um administrador para transferir a propriedade."); return; }
        const selectedAdminName = admins.find(a => a.uid === selectedAdmin)?.displayName || 'utilizador';
        if (window.confirm(`Tem a certeza ABSOLUTA que deseja transferir a propriedade para ${selectedAdminName}? ESTA AÇÃO É IRREVERSÍVEL.`)) {
            try {
                await transferCompanyOwnership(activeCompanyId, currentUser.uid, selectedAdmin);
                alert("Propriedade transferida com sucesso. A sua sessão será terminada.");
                await logout();
                navigate('/login');
            } catch (err) { setError("Ocorreu uma falha grave durante a transferência."); console.error(err); }
        }
    };
    
    const handleLeaveCompany = async () => {
        if(userRole === 'Dono') { alert("O Dono não pode sair da empresa. Transfira a propriedade primeiro."); return; }
        if (window.confirm("Tem a certeza que deseja sair desta empresa? Você perderá o acesso a todos os seus dados.")) {
            try {
                // CORREÇÃO: Passa o utilizador a ser removido (ele mesmo) e o ator (ele mesmo) para o log.
                await removeUserFromCompany(activeCompanyId, currentUser, currentUser);
                await refreshAuth();
                navigate('/home');
            } catch (err) { alert("Falha ao sair da empresa."); }
        }
    };

    const handleDeleteCompany = async () => {
        if (prompt("Esta ação é irreversível e irá apagar todos os dados da empresa. Para confirmar, digite o nome da empresa:") === company.name) {
            try {
                await deleteCompany(activeCompanyId, usersInCompany);
                await refreshAuth();
                navigate('/home');
            } catch (err) { setError("Falha ao apagar a empresa."); console.error(err); }
        } else { alert("O nome não corresponde. Ação cancelada."); }
    };
    
    if (loading) return <div style={pageStyles}>A carregar...</div>;

    return (
        <div style={pageStyles}>
            <div style={containerStyles}>
                <div style={cardStyles}>
                    <h2 style={{ marginTop: 0 }}>Configurações da Empresa</h2>
                    <form onSubmit={handleUpdate}>
                        <div style={formGroupStyles}><label style={labelStyles}>Nome da Empresa</label><input style={inputStyles} type="text" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required disabled={userRole !== 'Dono'} /></div>
                        <div style={formGroupStyles}><label style={labelStyles}>CNPJ</label><input style={inputStyles} type="text" name="cnpj" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} disabled={userRole !== 'Dono'} /></div>
                        {userRole === 'Dono' && <button style={buttonStyles} type="submit">Salvar Alterações</button>}
                    </form>
                    {message && <p style={{ color: 'green' }}>{message}</p>}
                </div>

                <div style={{...cardStyles, border: '2px solid #e74c3c'}}>
                    <h2 style={{ marginTop: 0, color: '#e74c3c' }}>Área de Perigo</h2>
                    
                    {userRole === 'Dono' && ( <>
                        <div style={formGroupStyles}>
                            <label style={labelStyles}>Transferir Propriedade da Empresa</label>
                            <p>Esta ação é irreversível. Você se tornará um Administrador.</p>
                            <select style={{...inputStyles, width: '100%', marginBottom: '10px'}} value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}>
                                <option value="">Selecione um Administrador...</option>
                                {admins.map(admin => <option key={admin.uid} value={admin.uid}>{admin.displayName} ({admin.email})</option>)}
                            </select>
                            <button style={!selectedAdmin ? disabledButtonStyles : dangerButtonStyles} onClick={handleTransfer} disabled={!selectedAdmin}>Transferir Propriedade</button>
                        </div>
                        <hr style={{margin: '20px 0'}} />
                        <div style={formGroupStyles}>
                            <label style={labelStyles}>Apagar Empresa</label>
                            <p>Esta ação não pode ser desfeita e irá remover permanentemente todos os dados e acesso de todos os funcionários.</p>
                            <button style={dangerButtonStyles} onClick={handleDeleteCompany}>Apagar Empresa Permanentemente</button>
                        </div>
                    </>)}
                    
                    {userRole !== 'Dono' && (
                        <div style={formGroupStyles}>
                            <label style={labelStyles}>Sair da Empresa</label>
                            <p>Você irá perder o acesso a todos os seus dados. Esta ação não pode ser desfeita.</p>
                            <button style={dangerButtonStyles} onClick={handleLeaveCompany}>Sair desta Empresa</button>
                        </div>
                    )}

                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
}
