import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addSupplier } from '../services/supplierService';

export default function AddSupplierForm({ onSupplierAdded }) {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isActionAllowed = !!currentUser?.activeCompanyId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!isActionAllowed || !currentUser) {
        setError('Ação não permitida ou utilizador não encontrado.');
        setLoading(false);
        return;
    }

    try {
      await addSupplier(currentUser.activeCompanyId, { name, contact, phone }, currentUser);
      setMessage('Fornecedor adicionado com sucesso!');
      setName('');
      setContact('');
      setPhone('');
      if (onSupplierAdded) onSupplierAdded();
    } catch (err) {
      setError('Ocorreu um erro ao adicionar o fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Adicionar Novo Fornecedor</h3>
      <form onSubmit={handleSubmit} className="filter-group" style={{gap: '16px'}}>
        <div>
          <label>Nome do Fornecedor</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Pessoa de Contato</label>
          <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div>
          <label>Telefone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        
        <button 
          type="submit" 
          disabled={!isActionAllowed || loading}
          style={{
            width: '100%', padding: '12px', border: 'none', 
            backgroundColor: !isActionAllowed || loading ? '#bdc3c7' : '#27ae60', 
            color: 'white', borderRadius: '8px', cursor: !isActionAllowed || loading ? 'not-allowed' : 'pointer', 
            fontSize: '16px', transition: 'background-color 0.2s'
          }}
        >
            {loading ? 'A adicionar...' : 'Adicionar Fornecedor'}
        </button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
