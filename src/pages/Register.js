import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- Estilos ---
const pageStyles = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '1rem' };
const cardStyles = { padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: '100%', maxWidth: '400px', textAlign: 'center' };
const logoStyles = { fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' };
const subtitleStyles = { color: '#7f8c8d', marginBottom: '30px' };
const formGroupStyles = { marginBottom: '20px', textAlign: 'left' };
const labelStyles = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' };
const inputStyles = { width: 'calc(100% - 22px)', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' };
const buttonStyles = { width: '100%', padding: '14px', border: 'none', backgroundColor: '#27ae60', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };
const errorStyles = { backgroundColor: '#fbe9e7', color: '#c62828', padding: '12px', borderRadius: '8px', marginTop: '20px' };
const linkStyles = { marginTop: '20px', display: 'block', color: '#3498db' };

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('As palavras-passe não correspondem.');
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/'); 
    } catch (err) {
      setError('Falha ao criar a conta. O email pode já estar em uso.');
    }
    setLoading(false);
  };

  return (
    <div style={pageStyles}>
      <div style={cardStyles}>
        <h1 style={logoStyles}>IntelliStock</h1>
        <p style={subtitleStyles}>Criar a sua Conta</p>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyles}>
            <label style={labelStyles}>Nome Completo</label>
            <input style={inputStyles} type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Seu Nome"/>
          </div>

          <div style={formGroupStyles}>
            <label style={labelStyles}>Email</label>
            <input style={inputStyles} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com"/>
          </div>
          
          <div style={formGroupStyles}>
            <label style={labelStyles}>Palavra-passe</label>
            <input style={inputStyles} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"/>
          </div>

          <div style={formGroupStyles}>
            <label style={labelStyles}>Confirmar Palavra-passe</label>
            <input style={inputStyles} type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required placeholder="••••••••"/>
          </div>

          {error && (
            <div style={errorStyles}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={buttonStyles}
          >
            {loading ? 'A registar...' : 'Registar'}
          </button>
        </form>
        
        <p style={{marginTop: '20px'}}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{...linkStyles, marginTop: 0, display: 'inline-block'}}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
