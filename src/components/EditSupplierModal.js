import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateSupplier } from '../services/supplierService';

// Estilos
const modalOverlayStyles = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyles = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px' };
const buttonStyles = { padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

export default function EditSupplierModal({ supplier, onClose }) {
  const { currentUser } = useAuth(); // Obter o utilizador atual
  const [formData, setFormData] = useState({ name: '', contact: '', phone: '' });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact: supplier.contact || '',
        phone: supplier.phone || '',
      });
    }
  }, [supplier]);

  if (!supplier) return null;

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CORREÇÃO: Passa o objeto 'currentUser' para a função de update para o log.
      await updateSupplier(currentUser.activeCompanyId, supplier.id, formData, currentUser);
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      alert("Falha ao atualizar o fornecedor.");
    }
  };

  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={e => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>Editar Fornecedor</h2>
        <form onSubmit={handleSubmit}>
          <label>Nome</label>
          <input style={inputStyles} type="text" name="name" value={formData.name} onChange={handleChange} required />
          
          <label>Contato</label>
          <input style={inputStyles} type="text" name="contact" value={formData.contact} onChange={handleChange} />

          <label>Telefone</label>
          <input style={inputStyles} type="text" name="phone" value={formData.phone} onChange={handleChange} />
          
          <div>
            <button style={{...buttonStyles, backgroundColor: '#27ae60', color: 'white'}} type="submit">Salvar Alterações</button>
            <button style={{...buttonStyles, backgroundColor: '#ccc'}} type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
