import React from 'react';

// Estilos
const modalOverlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyles = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const detailRowStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
};

const labelStyles = {
    fontWeight: 'bold',
    color: '#555'
};

const valueStyles = {
    color: '#333',
    textAlign: 'right'
};

const closeButtonStyles = {
    width: '100%',
    padding: '12px',
    border: 'none',
    backgroundColor: '#7f8c8d',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px'
};

export default function ProductDetailsModal({ product, onClose }) {
  if (!product) return null;

  // Função para formatar o timestamp do Firebase para uma data legível
  const formatTimestamp = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'N/A';
  };

  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '15px' }}>Detalhes do Produto</h2>
        
        <div style={detailRowStyles}>
          <span style={labelStyles}>Nome do Produto:</span>
          <span style={valueStyles}>{product.name}</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>SKU (Cód. de Referência):</span>
          <span style={valueStyles}>{product.sku}</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>Quantidade em Stock:</span>
          <span style={valueStyles}>{product.quantity || 0} unidades</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>Custo por Unidade:</span>
          <span style={valueStyles}>{(product.costPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
         <div style={detailRowStyles}>
          <span style={labelStyles}>Valor Total em Stock:</span>
          <span style={valueStyles}>{((product.costPrice || 0) * (product.quantity || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>Fornecedor:</span>
          <span style={valueStyles}>{product.supplierName || 'Não especificado'}</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>ID do Fornecedor:</span>
          <span style={valueStyles}>{product.supplierId}</span>
        </div>
        <div style={detailRowStyles}>
          <span style={labelStyles}>Data de Criação no Sistema:</span>
          <span style={valueStyles}>{formatTimestamp(product.createdAt)}</span>
        </div>
        
        <button style={closeButtonStyles} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
