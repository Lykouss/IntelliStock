import React from 'react';

// Estilos para o modal e seus componentes internos
const modalOverlayStyles = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000 // Z-index alto para ficar sobre tudo
};

const modalContentStyles = {
    backgroundColor: 'white', padding: '30px', borderRadius: '12px',
    width: '100%', maxWidth: '800px', // Mais largo para tabelas
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column'
};

const modalHeaderStyles = {
    borderBottom: '1px solid #dee2e6', paddingBottom: '15px',
    marginBottom: '20px'
};

const modalTitleStyles = {
    margin: 0, fontSize: '22px', color: '#343a40'
};

const modalBodyStyles = {
    overflowY: 'auto' // Scroll se a tabela for muito grande
};

const tableStyles = {
    width: '100%', borderCollapse: 'collapse', fontSize: '14px'
};

const thStyles = {
    borderBottom: '2px solid #dee2e6', padding: '12px 15px',
    textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: '600'
};

const tdStyles = {
    borderBottom: '1px solid #e9ecef', padding: '12px 15px',
    textAlign: 'left'
};

const closeButtonStyles = {
    padding: '12px 25px', border: 'none', backgroundColor: '#6c757d',
    color: 'white', borderRadius: '8px', cursor: 'pointer',
    fontSize: '16px', marginTop: '25px', alignSelf: 'flex-end'
};

/**
 * Um modal genérico para exibir dados de gráficos em formato de tabela.
 * @param {boolean} isOpen - Controla a visibilidade do modal.
 * @param {function} onClose - Função para fechar o modal.
 * @param {string} title - O título a ser exibido no cabeçalho do modal.
 * @param {Array} data - O array de objetos de dados para a tabela.
 * @param {Array} columns - A configuração das colunas da tabela.
 * Ex: [{ header: 'Nome', accessor: 'name' }]
 */
export default function ChartDetailModal({ isOpen, onClose, title, data, columns }) {
  if (!isOpen) return null;

  // Função para obter o valor de uma célula, lidando com acessores de função
  const getCellValue = (item, column) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor];
  };

  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyles}>
          <h2 style={modalTitleStyles}>{title}</h2>
        </div>
        
        <div style={modalBodyStyles}>
          <table style={tableStyles}>
            <thead>
              <tr>
                {columns.map(col => <th key={col.header} style={thStyles}>{col.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {columns.map(col => <td key={col.header} style={tdStyles}>{getCellValue(item, col)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button style={closeButtonStyles} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
