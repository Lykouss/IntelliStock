import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streamProducts, streamMovements } from '../services/firestoreService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartDetailModal from '../components/ChartDetailModal';

export default function BIDashboard() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalInfo, setDetailModalInfo] = useState({ isOpen: false, title: '', data: [], columns: [] });

  useEffect(() => {
    if (currentUser?.activeCompanyId) {
      setLoading(true);
      const unsubProducts = streamProducts(currentUser.activeCompanyId, (productsData) => {
        setProducts(productsData);
        setLoading(false);
      });
      const unsubMovements = streamMovements(currentUser.activeCompanyId, setMovements);
      return () => {
        unsubProducts();
        unsubMovements();
      };
    } else {
      setLoading(false);
    }
  }, [currentUser?.activeCompanyId]);

  const biData = useMemo(() => {
    if (loading) return null;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const uniqueProductsCount = products.length;
    const lowStockThreshold = 10;
    const lowStockProductsCount = products.filter(p => p.quantity < lowStockThreshold && p.quantity > 0).length;
    const outOfStockProductsCount = products.filter(p => p.quantity === 0).length;
    const movementByDay = movements.reduce((acc, mov) => {
        const date = mov.date?.toDate().toISOString().split('T')[0];
        if (!date) return acc;
        if (!acc[date]) acc[date] = { date, entradas: 0, saidas: 0 };
        if (mov.type === 'entrada') acc[date].entradas += mov.quantityMoved;
        else acc[date].saidas += mov.quantityMoved;
        return acc;
    }, {});
    const movementChartData = Object.values(movementByDay).sort((a,b) => new Date(a.date) - new Date(b.date));
    const valueBySupplier = products.reduce((acc, prod) => {
        const supplierName = prod.supplierName || 'Sem Fornecedor';
        const value = prod.quantity * prod.costPrice;
        if (!acc[supplierName]) acc[supplierName] = 0;
        acc[supplierName] += value;
        return acc;
    }, {});
    const supplierChartData = Object.entries(valueBySupplier).map(([name, value]) => ({ name, value })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    const lowStockProductsList = products.filter(p => p.quantity < lowStockThreshold && p.quantity > 0).sort((a, b) => a.quantity - b.quantity);
    const topProductsByValue = [...products].map(p => ({ ...p, totalValue: p.quantity * p.costPrice })).sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);
    return { totalInventoryValue, uniqueProductsCount, lowStockProductsCount, outOfStockProductsCount, movementChartData, supplierChartData, lowStockProductsList, topProductsByValue };
  }, [products, movements, loading]);

  const handleSupplierPieClick = (data) => {
    const supplierName = data.name;
    const productsFromSupplier = products.filter(p => (p.supplierName || 'Sem Fornecedor') === supplierName).sort((a,b) => (b.quantity * b.costPrice) - (a.quantity * a.costPrice));
    setDetailModalInfo({
        isOpen: true,
        title: `Produtos do Fornecedor: ${supplierName}`,
        data: productsFromSupplier,
        columns: [
            { header: 'Produto', accessor: 'name' },
            { header: 'SKU', accessor: 'sku' },
            { header: 'Quantidade', accessor: 'quantity' },
            { header: 'Valor em Stock', accessor: (item) => (item.quantity * item.costPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
        ]
    });
  };

  const handleProductBarClick = (data) => {
    const { id: productId, name: productName } = data;
    const movementsForProduct = movements.filter(m => m.productId === productId).map(m => ({...m, dateF: m.date?.toDate().toLocaleString('pt-BR') || 'N/A', typeF: m.type === 'entrada' ? '✅ Entrada' : '❌ Saída'})).sort((a, b) => b.date.seconds - a.date.seconds);
    setDetailModalInfo({
        isOpen: true,
        title: `Movimentações Recentes: ${productName}`,
        data: movementsForProduct,
        columns: [
            { header: 'Data', accessor: 'dateF' },
            { header: 'Tipo', accessor: 'typeF' },
            { header: 'Quantidade', accessor: 'quantityMoved' },
            { header: 'Utilizador', accessor: (item) => item.user?.displayName || 'N/A' }
        ]
    });
  };

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

  if (loading || !biData) return <div className="page-container">A carregar dashboard...</div>;

  return (
    <>
      <ChartDetailModal isOpen={detailModalInfo.isOpen} onClose={() => setDetailModalInfo({ ...detailModalInfo, isOpen: false })} title={detailModalInfo.title} data={detailModalInfo.data} columns={detailModalInfo.columns} />
      
      <div className="page-container">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Dashboard de Business Intelligence</h2>
        
        <div className="dashboard-grid">
            <div className="kpi-card">
              <h3 className="kpi-title">Valor Total do Inventário</h3>
              <p className="kpi-value">{biData.totalInventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="kpi-card">
              <h3 className="kpi-title">Produtos Únicos (SKUs)</h3>
              <p className="kpi-value">{biData.uniqueProductsCount}</p>
            </div>
            <div className="kpi-card">
              <h3 className="kpi-title">Produtos com Stock Baixo</h3>
              <p className="kpi-value">{biData.lowStockProductsCount}</p>
            </div>
            <div className="kpi-card">
              <h3 className="kpi-title">Produtos Esgotados</h3>
              <p className="kpi-value">{biData.outOfStockProductsCount}</p>
            </div>

            <div className="chart-card">
              <h3 className="kpi-title">Movimentações de Stock</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={biData.movementChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#28a745" strokeWidth={2} />
                  <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#dc3545" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3 className="kpi-title">Top 5 Produtos por Valor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biData.topProductsByValue} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  <Legend />
                  <Bar dataKey="totalValue" name="Valor Total" fill="#3b82f6" onClick={handleProductBarClick} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card full-width-card">
              <h3 className="kpi-title">Valor por Fornecedor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={biData.supplierChartData} cx="50%" cy="50%" labelLine={false} outerRadius={'80%'} fill="#8884d8" dataKey="value" nameKey="name" onClick={handleSupplierPieClick} style={{ cursor: 'pointer' }}>
                    {biData.supplierChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {biData.lowStockProductsList.length > 0 && (
              <div className="table-container full-width-card">
                <h3 className="kpi-title">Produtos com Baixo Stock</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Produto</th><th>SKU</th><th>Fornecedor</th><th>Qtd. Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biData.lowStockProductsList.map(product => (
                        <tr key={product.id}>
                          <td data-label="Produto">{product.name}</td>
                          <td data-label="SKU">{product.sku}</td>
                          <td data-label="Fornecedor">{product.supplierName || 'N/A'}</td>
                          <td data-label="Qtd. Restante" style={{color: '#dc3545', fontWeight: 'bold'}}>{product.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
