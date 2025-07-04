import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- Ícones SVG embutidos como componentes ---
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const DashboardIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const ProductsIcon = () => <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />;
const SuppliersIcon = () => <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />;
const UsersIcon = () => <Icon path="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" />;
const LogIcon = () => <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
const SettingsIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
const ChevronDoubleLeftIcon = ({ className }) => <Icon className={className} path="M11 19l-7-7 7-7m8 14l-7-7 7-7" />;
const ChevronDoubleRightIcon = ({ className }) => <Icon className={className} path="M13 5l7 7-7 7M5 5l7 7-7 7" />;

const NavItem = ({ to, icon: Icon, text }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon />
      <span className="nav-text">{text}</span>
    </Link>
  );
};

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { currentUser } = useAuth();
  
  const userRole = currentUser?.companies?.[currentUser.activeCompanyId];
  const canManageSuppliers = ['Dono', 'Administrador', 'Gerente'].includes(userRole);
  const canManageUsers = ['Dono', 'Administrador'].includes(userRole);
  const canViewLogs = ['Dono', 'Administrador', 'Gerente'].includes(userRole);
  
  return (
    <aside className={`sidebar ${isExpanded ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <Link to="/home" className="logo-link">
            <h1 className="logo-text">IntelliStock</h1>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/app" icon={DashboardIcon} text="Dashboard" />
        <NavItem to="/app/products" icon={ProductsIcon} text="Produtos" />
        {canManageSuppliers && <NavItem to="/app/suppliers" icon={SuppliersIcon} text="Fornecedores" />}
        {canManageUsers && <NavItem to="/app/users" icon={UsersIcon} text="Utilizadores" />}
        {canViewLogs && <NavItem to="/app/logs" icon={LogIcon} text="Log de Atividades" />}
      </nav>

      <div className="sidebar-footer">
        <NavItem to="/app/company-settings" icon={SettingsIcon} text="Configurações" />
      </div>

      {/* Wrapper separado para o botão, garantindo posicionamento correto */}
      <div className="sidebar-toggle-wrapper">
        <button className="collapse-button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDoubleLeftIcon className="w-6 h-6" /> : <ChevronDoubleRightIcon className="w-6 h-6" />}
        </button>
      </div>
    </aside>
  );
}
