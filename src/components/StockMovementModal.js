import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addStockMovement } from '../services/firestoreService';

// Estilos
const modalOverlayStyles = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyles = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px', fontSize: '16px' };
const buttonStyles = { padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', fontWeight: 'bold' };
const disabledButtonStyles = { ...buttonStyles, backgroundColor: '#bdc3c7', cursor: 'not-allowed' };
const infoBoxStyles = { backgroundColor: '#f4f6f8', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', marginTop: '15px' };
const confirmationBoxStyles = { ...infoBoxStyles, borderColor: '#f0ad4e', backgroundColor: '#fcf8e3'};

export default function StockMovementModal({ product, movementType, onClose }) {
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  React.useEffect(() => {
    setQuantity('');
    setError('');
    setIsConfirming(false);
  }, [product]);

  const { newQuantity, newValue } = useMemo(() => {
    const movedQty = Number(quantity);
    if (!product || isNaN(movedQty) || movedQty <= 0) {
      return { newQuantity: null, newValue: null };
    }
    const currentQty = Number(product.quantity);
    const finalQty = movementType === 'entrada' ? currentQty + movedQty : currentQty - movedQty;
    const totalValue = finalQty * (product.costPrice || 0);
    return { newQuantity: finalQty, newValue: totalValue };
  }, [quantity, product, movementType]);

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (newQuantity < 0) {
        setError("Stock insuficiente para dar baixa.");
        return;
    }
    setError('');
    setIsConfirming(true);
  };
  
  const handleFinalSubmit = async () => {
    try {
      // CORREÇÃO: A chamada da função agora inclui o 'currentUser' para o registo de log.
      await addStockMovement(currentUser.activeCompanyId, product.id, movementType, quantity, currentUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      setIsConfirming(false);
    }
  };

  if (!product) return null;

  const title = movementType === 'entrada' ? 'Adicionar Stock' : 'Dar Baixa de Stock';
  const isActionAllowed = !!currentUser?.activeCompanyId;

  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={e => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>{title}</h2>
        <p>Produto: <strong>{product.name}</strong> (Custo Unit.: {product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</p>
        <p>Quantidade Atual: <strong>{product.quantity}</strong></p>
        
        <form onSubmit={handleInitialSubmit}>
          <label>Quantidade a ser movimentada:</label>
          <input 
            style={inputStyles} 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            autoFocus 
            required 
            disabled={isConfirming}
          />
          
          {newQuantity !== null && (
            <div style={infoBoxStyles}>
              <p style={{margin: '5px 0'}}>Nova Quantidade em Stock: <strong>{newQuantity}</strong></p>
              <p style={{margin: '5px 0'}}>Novo Valor Total do Stock: <strong>{newValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
            </div>
          )}

          {error && <p style={{color: 'red'}}>{error}</p>}
          
          {!isConfirming ? (
            <div>
              <button 
                  style={isActionAllowed ? {...buttonStyles, backgroundColor: '#3498db', color: 'white'} : disabledButtonStyles} 
                  type="submit"
                  disabled={!isActionAllowed || newQuantity === null || newQuantity < 0}
              >
                  Revisar Movimentação
              </button>
              <button style={{...buttonStyles, backgroundColor: '#ccc'}} type="button" onClick={onClose}>Cancelar</button>
            </div>
          ) : (
            <div style={confirmationBoxStyles}>
                <p><strong>Por favor, confirme a ação:</strong></p>
                <p>
                    {movementType === 'entrada' ? 'Adicionar' : 'Dar baixa de'} <strong>{quantity}</strong> unidades.
                    A quantidade final será <strong>{newQuantity}</strong>.
                </p>
                <div>
                    <button 
                        style={{...buttonStyles, backgroundColor: '#27ae60', color: 'white'}} 
                        type="button"
                        onClick={handleFinalSubmit}
                    >
                        Confirmar
                    </button>
                    <button style={{...buttonStyles, backgroundColor: '#7f8c8d', color: 'white'}} type="button" onClick={() => setIsConfirming(false)}>Editar</button>
                </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
