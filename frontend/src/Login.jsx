import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api, { storage } from '../api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      storage.set('token', res.data.token);
      if (res.data.user) storage.set('user', JSON.stringify(res.data.user));
      onLogin(res.data.user, res.data.token);
      const redirectId = storage.get('redirectVideoId');
      if (redirectId) {
        storage.remove('redirectVideoId');
        navigate(`/?video=${redirectId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h2 className="auth-title">Iniciar Sesión</h2>
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.5)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario, Email o Teléfono</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nombre, correo@ejemplo.com o +56..." required disabled={loading} autoComplete="username" inputMode="text" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="password-input-wrapper">
              <input type={showPassword ? 'text' : 'password'} className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '3rem' }} disabled={loading} autoComplete="current-password" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--accent)' }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
