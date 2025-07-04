import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Rota protegida mais inteligente.
 * @param {boolean} requireCompany - Se true, exige que o utilizador tenha uma empresa ativa.
 */
export default function ProtectedRoute({ children, requireCompany = false }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>A carregar...</div>;
  }

  // Se a rota exige login e não há utilizador, redireciona para login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Se a rota exige uma empresa e o utilizador não tem uma ativa, redireciona para a home.
  if (requireCompany && !currentUser.activeCompanyId) {
    return <Navigate to="/home" />;
  }
  
  // Se o utilizador está autenticado e cumpre os requisitos, renderiza a página.
  return children;
}
