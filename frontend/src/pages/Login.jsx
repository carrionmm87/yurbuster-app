import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h2 className="auth-title">Iniciar Sesión</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario, Email o Teléfono</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombre, correo@ejemplo.com o +56..."
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>Entrar</button>
        </form>
        <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--accent)' }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
