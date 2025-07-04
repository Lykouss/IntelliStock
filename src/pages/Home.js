import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInvitesForUser, acceptInvite, rejectInvite } from '../services/userService';
import { getCompanyDetails } from '../services/companyService';
import { addDoc, collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

// --- Estilos ---
const pageStyles = {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
};

const headerStyles = {
    backgroundColor: 'white',
    padding: '15px 20px', // Padding ajustado para mobile
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const logoStyles = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
};

const userAreaStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px' // Gap ajustado
};

const logoutButtonStyles = {
    background: 'none',
    border: '1px solid #e74c3c',
    color: '#e74c3c',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
};

const mainContentStyles = {
    padding: '20px', // Padding ajustado para mobile
    maxWidth: '900px',
    margin: '20px auto'
};

const cardStyles = {
    padding: '20px', // Padding ajustado
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    marginBottom: '30px'
};

const companyListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
};

const companyCardStyles = {
    ...cardStyles,
    marginBottom: 0,
    textAlign: 'center',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
};

const buttonStyles = {
    width: '100%',
    padding: '14px',
    border: 'none',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
};

const actionButtonStyles = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
};

const inputStyles = {
    width: 'calc(100% - 24px)',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '15px'
};

export default function Home() {
    const { currentUser, refreshAuth, logout, switchActiveCompany } = useAuth();
    const navigate = useNavigate();

    const [userCompanies, setUserCompanies] = useState([]);
    const [invites, setInvites] = useState([]);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const pendingInvites = await getInvitesForUser(currentUser.email);
            setInvites(pendingInvites);
            
            if (currentUser.companyIds && currentUser.companyIds.length > 0) {
                const companiesPromises = currentUser.companyIds.map(id => getCompanyDetails(id));
                const companiesData = await Promise.all(companiesPromises);
                setUserCompanies(companiesData.filter(c => c));
            } else {
                setUserCompanies([]);
            }
        } catch (err) { console.error("Falha ao buscar dados da home:", err); setError("Não foi possível carregar os seus dados."); }
        setLoading(false);
    }, [currentUser]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateCompany = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const companyRef = await addDoc(collection(db, 'companies'), { name: companyName, cnpj, ownerId: currentUser.uid });
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                [`companies.${companyRef.id}`]: 'Dono',
                companyIds: arrayUnion(companyRef.id),
                activeCompanyId: companyRef.id
            });
            await refreshAuth();
            navigate('/app');
        } catch (err) { setError('Falha ao criar empresa.'); console.error(err); setLoading(false); }
    };

    const handleSwitchCompany = async (companyId) => {
        await switchActiveCompany(companyId);
        navigate('/app');
    };

    const handleAcceptInvite = async (inviteId) => {
        try {
            await acceptInvite(currentUser.uid, inviteId, currentUser);
            await refreshAuth();
        } catch (error) { 
            alert("Falha ao aceitar o convite."); 
            console.error(error);
        }
    };

    const handleRejectInvite = async (inviteId) => {
        try {
            await rejectInvite(inviteId);
            setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        } catch (error) { alert("Falha ao rejeitar o convite."); }
    };

    return (
        <div style={pageStyles}>
            <header style={headerStyles}>
                <div style={logoStyles}>IntelliStock</div>
                <div style={userAreaStyles}>
                    <span>Olá, <strong>{currentUser?.displayName}</strong></span>
                    <NotificationBell />
                    <button style={logoutButtonStyles} onMouseEnter={e => { e.target.style.backgroundColor = '#e74c3c'; e.target.style.color = 'white'; }} onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#e74c3c'; }} onClick={logout}>Sair</button>
                </div>
            </header>

            <main style={mainContentStyles}>
                {loading ? <p>A carregar dados...</p> : (
                    <>
                        <div style={cardStyles}>
                            <h2>Minhas Empresas</h2>
                            {userCompanies.length > 0 ? (
                                <div style={companyListStyles}>
                                    {userCompanies.map(company => (
                                        <div key={company.id} style={companyCardStyles} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';}} onMouseLeave={e => {e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';}}>
                                            <h3 style={{marginTop: 0, color: '#2c3e50'}}>{company.name}</h3>
                                            <p style={{color: '#7f8c8d', flexGrow: 1}}>Sua função: <strong>{currentUser.companies[company.id]}</strong></p>
                                            <button onClick={() => handleSwitchCompany(company.id)} style={{...buttonStyles, fontSize: '14px', padding: '12px'}}>Aceder ao Painel</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !isCreatingCompany && <p>Você ainda não faz parte de nenhuma empresa. Aceite um convite ou crie a sua abaixo.</p>
                            )}
                        </div>

                        {invites.length > 0 && invites.map(invite => (
                            <div key={invite.id} style={{...cardStyles, backgroundColor: '#e8f4fd', border: '1px solid #3498db'}}>
                                <h3>Você tem um convite pendente!</h3>
                                <p>A empresa <strong>{invite.companyName}</strong> convidou-o para se juntar como <strong>{invite.role}</strong>.</p>
                                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px'}}>
                                    <button onClick={() => handleAcceptInvite(invite.id)} style={{...actionButtonStyles, backgroundColor: '#2ecc71', color: 'white'}}>Aceitar</button>
                                    <button onClick={() => handleRejectInvite(invite.id)} style={{...actionButtonStyles, backgroundColor: '#bdc3c7', color: 'white'}}>Rejeitar</button>
                                </div>
                            </div>
                        ))}
                        
                        <div style={cardStyles}>
                            {isCreatingCompany ? (
                                <>
                                    <h2>Nova Empresa</h2>
                                    <p>Preencha os dados para começar a gerir um novo inventário.</p>
                                    <form onSubmit={handleCreateCompany} style={{marginTop: '20px'}}>
                                        <input style={inputStyles} type="text" placeholder="Nome da Sua Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                                        <input style={inputStyles} type="text" placeholder="CNPJ (opcional)" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                                        <button style={buttonStyles} type="submit" disabled={loading}>{loading ? 'A criar...' : 'Criar e Gerir'}</button>
                                    </form>
                                    {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
                                    <button onClick={() => setIsCreatingCompany(false)} style={{background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', marginTop: '15px'}}>Cancelar</button>
                                </>
                            ) : (
                                <div style={{textAlign: 'center'}}>
                                     <h2>Quer começar um novo negócio?</h2>
                                     <p>Clique no botão abaixo para criar a sua própria empresa no IntelliStock.</p>
                                     <button onClick={() => setIsCreatingCompany(true)} style={buttonStyles}>+ Criar Nova Empresa</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
