import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

// Estilos principais do layout
const layoutStyles = {
  display: 'flex',
  height: '100vh',
  backgroundColor: '#f4f6f8'
};

// Estilos para o container do conteúdo principal
const mainContainerStyles = {
  flex: 1, // Garante que este container ocupe todo o espaço restante
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden' // Impede barras de scroll duplas
};

// Estilos para a área de conteúdo onde as páginas são renderizadas
const contentWrapperStyles = {
  flex: 1,
  overflowY: 'auto', // Permite scroll apenas nesta área
  padding: '20px'
};

export default function DashboardLayout() {
  return (
    <div style={layoutStyles}>
      <Sidebar />
      {/* Este container agora se ajusta automaticamente ao lado da sidebar */}
      <div style={mainContainerStyles}>
        <Header />
        <main style={contentWrapperStyles}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
