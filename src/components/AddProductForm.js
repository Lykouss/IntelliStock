import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addProduct } from '../services/firestoreService';
import { getSuppliers } from '../services/supplierService';

export default function AddProductForm({ onProductAdded }) {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [supplierId, setSupplierId] = useState(''); 
  const [suppliers, setSuppliers] = useState([]); 
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
        if (currentUser?.activeCompanyId) {
            const supplierList = await getSuppliers(currentUser.activeCompanyId);
            setSuppliers(supplierList);
        }
    };
    fetchSuppliers();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!supplierId) {
        setError('Por favor, selecione um fornecedor.');
        return;
    }
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    const productData = {
      name, sku, quantity: 0, costPrice: Number(costPrice),
      supplierId: supplierId,
      supplierName: selectedSupplier ? selectedSupplier.name : 'N/A'
    };
    try {
      await addProduct(currentUser.activeCompanyId, productData, currentUser);
      setMessage('Produto adicionado! Use os botões de ação para adicionar stock.');
      setName(''); setSku(''); setCostPrice(''); setSupplierId('');
      onProductAdded();
    } catch (err) {
      setError('Erro ao adicionar produto.');
      console.error(err);
    }
  };

  return (
    <div className="table-container">
      <h3>Adicionar Novo Produto</h3>
      <form onSubmit={handleSubmit}>
        <div className="filter-group">
          <label>Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="filter-group">
          <label>SKU</label>
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div className="filter-group">
          <label>Custo (R$)</label>
          <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
        </div>
        <div className="filter-group">
          <label>Fornecedor</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
            <option value="">Selecione um fornecedor</option>
            {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
          </select>
        </div>
        <button 
          type="submit" 
          style={{
            width: '100%', 
            padding: '12px', 
            border: 'none', 
            backgroundColor: '#27ae60', 
            color: 'white', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '16px',
            marginTop: '15px'
          }}
        >
          Adicionar Produto
        </button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
