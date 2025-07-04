import React, { useState, useEffect, useMemo, useRef } from 'react';
import { streamProducts, deleteProduct } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import EditProductModal from './EditProductModal';
import StockMovementModal from './StockMovementModal';
import ProductDetailsModal from './ProductDetailsModal';

// --- Ícone para o menu de ações ---
const MoreIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);

export default function ProductList({ filters }) {
  const { currentUser } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [movingProduct, setMovingProduct] = useState(null);
  const [movementType, setMovementType] = useState('entrada');
  const [viewingProduct, setViewingProduct] = useState(null);
  
  // Estado para controlar qual menu de ações está aberto
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const menuRef = useRef(null);

  const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
  const canEditProducts = ['Dono', 'Administrador', 'Gerente'].includes(userRole);
  const canDeleteProducts = ['Dono', 'Administrador'].includes(userRole);

  useEffect(() => {
    if (currentUser?.activeCompanyId) {
      setLoading(true);
      const unsubscribe = streamProducts(currentUser.activeCompanyId, (products) => {
        setAllProducts(products);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAllProducts([]);
      setLoading(false);
    }
  }, [currentUser?.activeCompanyId]);

  // Efeito para fechar o menu de ações se o utilizador clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processedProducts = useMemo(() => {
    let products = [...allProducts];
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    }
    if (filters.selectedSupplier) {
        products = products.filter(p => p.supplierId === filters.selectedSupplier);
    }
    const { sortBy, sortOrder } = filters;
    products.sort((a, b) => {
        let valA, valB;
        switch (sortBy) {
            case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); return valA.localeCompare(valB);
            case 'sku': valA = a.sku.toLowerCase(); valB = b.sku.toLowerCase(); return valA.localeCompare(valB);
            case 'quantity': return a.quantity - b.quantity;
            case 'createdAt': default: return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        }
    });
    if (sortOrder === 'desc') products.reverse();
    return products;
  }, [allProducts, filters]);
  
  const handleDelete = async (product) => {
    setOpenActionMenu(null); // Fecha o menu
    if (window.confirm("Tem a certeza que deseja excluir este produto?")) {
      try {
        await deleteProduct(currentUser.activeCompanyId, product, currentUser);
      } catch (error) { alert("Falha ao excluir o produto."); }
    }
  };

  const handleOpenMovementModal = (product, type) => {
    setOpenActionMenu(null); // Fecha o menu
    setMovementType(type);
    setMovingProduct(product);
  };
  
  if (loading) return <div className="table-container">A carregar produtos...</div>;

  return (
    <>
      <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />
      <StockMovementModal product={movingProduct} movementType={movementType} onClose={() => setMovingProduct(null)} />
      <ProductDetailsModal product={viewingProduct} onClose={() => setViewingProduct(null)} />

      <div className="table-container">
        <h3>{processedProducts.length} Produtos Encontrados</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornecedor</th>
                <th>SKU</th>
                <th>Quantidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {processedProducts.map(product => (
                <tr key={product.id}>
                  <td data-label="Nome">{product.name}</td>
                  <td data-label="Fornecedor">{product.supplierName || 'N/A'}</td>
                  <td data-label="SKU">{product.sku}</td>
                  <td data-label="Quantidade">{product.quantity}</td>
                  <td data-label="Ações">
                    <div className="actions-cell">
                      <button 
                        className="action-menu-button"
                        onClick={() => setOpenActionMenu(openActionMenu === product.id ? null : product.id)}
                      >
                        <MoreIcon />
                      </button>
                      {openActionMenu === product.id && (
                        <div className="action-menu" ref={menuRef}>
                          <button onClick={() => { setViewingProduct(product); setOpenActionMenu(null); }}>Detalhes</button>
                          <button onClick={() => handleOpenMovementModal(product, 'entrada')}>Adicionar Stock</button>
                          <button onClick={() => handleOpenMovementModal(product, 'saida')}>Dar Baixa</button>
                          {canEditProducts && <button onClick={() => { setEditingProduct(product); setOpenActionMenu(null); }}>Editar</button>}
                          {canDeleteProducts && <button onClick={() => handleDelete(product)}>Excluir</button>}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processedProducts.length === 0 && !loading && <p>Nenhum produto corresponde aos filtros selecionados.</p>}
      </div>
    </>
  );
}
