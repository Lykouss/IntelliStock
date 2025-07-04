import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Estilos
const pageStyles = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' };
const cardStyles = { padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: '100%', maxWidth: '500px', marginBottom: '20px' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', marginBottom: '15px' };
const buttonStyles = { width: '100%', padding: '14px', border: 'none', backgroundColor: '#3498db', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

export default function CompanyLobby() {
    const { currentUser, refreshAuth, logout } = useAuth();
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const companyRef = await addDoc(collection(db, 'companies'), {
                name: companyName,
                cnpj: cnpj,
                ownerId: currentUser.uid,
            });

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                [`companies.${companyRef.id}`]: 'Dono',
                companyIds: [companyRef.id],
                activeCompanyId: companyRef.id
            });
            await refreshAuth();
            navigate('/');
        } catch (err) {
            setError('Falha ao criar empresa.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div style={pageStyles}>
            <div style={cardStyles}>
                <h2>Bem-vindo, {currentUser?.displayName}!</h2>
                <p>Você ainda não tem uma empresa. Crie a sua primeira para começar.</p>
                <form onSubmit={handleCreateCompany}>
                    <input style={inputStyles} type="text" placeholder="Nome da Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                    <input style={inputStyles} type="text" placeholder="CNPJ (opcional)" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    <button style={buttonStyles} type="submit" disabled={loading}>{loading ? 'A criar...' : 'Criar Empresa e Continuar'}</button>
                </form>
                {error && <p style={{color: 'red'}}>{error}</p>}
            </div>
             <button onClick={logout} style={{background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer'}}>Sair</button>
        </div>
    );
}
