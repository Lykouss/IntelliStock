import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProduct } from '../services/firestoreService';
import { getSuppliers } from '../services/supplierService';

// Estilos
const modalOverlayStyles = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyles = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px' };
const buttonStyles = { padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

export default function EditProductModal({ product, onClose }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', sku: '', costPrice: '', supplierId: '' });
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
        if (currentUser?.activeCompanyId) {
            const supplierList = await getSuppliers(currentUser.activeCompanyId);
            setSuppliers(supplierList);
        }
    };
    fetchSuppliers();
  }, [currentUser]);
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '', sku: product.sku || '',
        costPrice: product.costPrice || '',
        supplierId: product.supplierId || '',
      });
    }
  }, [product]);

  if (!product) return null;

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    const updatedData = {
      name: formData.name, sku: formData.sku, costPrice: Number(formData.costPrice),
      supplierId: formData.supplierId,
      supplierName: selectedSupplier ? selectedSupplier.name : 'N/A'
    };
    try {
      // CORREÇÃO: Passa o objeto 'currentUser' para a função de update.
      await updateProduct(currentUser.activeCompanyId, product.id, updatedData, currentUser);
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      alert("Falha ao atualizar o produto.");
    }
  };

  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={e => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>Editar Detalhes do Produto</h2>
        <form onSubmit={handleSubmit}>
          <label>Nome</label><input style={inputStyles} type="text" name="name" value={formData.name} onChange={handleChange} required />
          <label>SKU</label><input style={inputStyles} type="text" name="sku" value={formData.sku} onChange={handleChange} required />
          <label>Custo (R$)</label><input style={inputStyles} type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleChange} required />
          <label>Fornecedor</label>
          <select style={{...inputStyles, width: '100%'}} name="supplierId" value={formData.supplierId} onChange={handleChange} required>
            <option value="">Selecione um fornecedor</option>
            {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <div>
            <button style={{...buttonStyles, backgroundColor: '#27ae60', color: 'white'}} type="submit">Salvar</button>
            <button style={{...buttonStyles, backgroundColor: '#ccc'}} type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
