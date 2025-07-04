import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';

// Estilos
const pageStyles = { flexGrow: 1, padding: '20px', backgroundColor: '#f4f6f8', overflowY: 'auto' };
const profileContainerStyles = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};
const formGroupStyles = { marginBottom: '20px' };
const labelStyles = { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' };
const buttonStyles = { padding: '12px 20px', border: 'none', backgroundColor: '#3498db', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };
const infoStyles = { padding: '10px', backgroundColor: '#ecf0f1', borderRadius: '4px', color: '#7f8c8d', marginBottom: '20px' };


export default function Profile() {
  const { currentUser, refreshAuth } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // CORREÇÃO: Busca a função (role) do utilizador na empresa ATIVA.
  const activeCompanyId = currentUser?.activeCompanyId;
  const userRole = activeCompanyId ? currentUser?.companies?.[activeCompanyId] : 'Nenhuma empresa ativa';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (displayName.trim() === '') {
        setError('O nome não pode estar vazio.');
        return;
    }

    try {
        await updateUserProfile(currentUser.uid, { displayName });
        setMessage('Perfil atualizado com sucesso!');
        await refreshAuth();
    } catch (err) {
        setError('Ocorreu um erro ao atualizar o perfil.');
        console.error(err);
    }
  };

  return (
    <div style={pageStyles}>
      <div style={profileContainerStyles}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #f4f6f8', paddingBottom: '15px' }}>Meu Perfil</h2>
        <div style={formGroupStyles}>
            <label style={labelStyles}>Email</label>
            <p style={infoStyles}>{currentUser?.email}</p>
        </div>
        <div style={formGroupStyles}>
            <label style={labelStyles}>Minha Função na Empresa Atual</label>
            <p style={infoStyles}>{userRole}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyles}>
            <label style={labelStyles}>Nome de Exibição</label>
            <input 
              style={inputStyles} 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              required 
            />
          </div>
          <button style={buttonStyles} type="submit">Salvar Alterações</button>
        </form>
        {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );
}
