import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

// Estilos
const headerStyles = { padding: '10px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };
const userMenuContainerStyles = { display: 'flex', alignItems: 'center' };
const userMenuStyles = { position: 'relative', cursor: 'pointer' };
const userInfoStyles = { color: '#555', userSelect: 'none' };
const dropdownStyles = {
    position: 'absolute', top: '140%', right: 0, backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, width: '200px',
    overflow: 'hidden', padding: '8px 0'
};
const dropdownButtonStyles = {
    padding: '12px 16px', color: '#333', display: 'block', border: 'none',
    background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer'
};

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Falha ao fazer logout.');
    }
  };

  const goToProfile = () => {
    navigate('/app/profile');
    setDropdownOpen(false);
  };

  const goToHome = () => {
    navigate('/home');
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header style={headerStyles}>
      <div style={userMenuContainerStyles}>
        <NotificationBell />
        <div ref={dropdownRef} style={userMenuStyles} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <span style={userInfoStyles}>
            Olá, <strong>{currentUser?.displayName || 'Utilizador'}</strong>
          </span>
          {dropdownOpen && (
            <div style={dropdownStyles}>
              <button onClick={goToHome} style={dropdownButtonStyles} onMouseEnter={e => e.target.style.backgroundColor='#f9f9f9'} onMouseLeave={e => e.target.style.backgroundColor='white'}>Minhas Empresas</button>
              <button onClick={goToProfile} style={dropdownButtonStyles} onMouseEnter={e => e.target.style.backgroundColor='#f9f9f9'} onMouseLeave={e => e.target.style.backgroundColor='white'}>Meu Perfil</button>
              <button onClick={handleLogout} style={{...dropdownButtonStyles, borderTop: '1px solid #f0f0f0'}} onMouseEnter={e => e.target.style.backgroundColor='#f9f9f9'} onMouseLeave={e => e.target.style.backgroundColor='white'}>Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
