import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('viewer');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Corriente');
  const [accountNumber, setAccountNumber] = useState('');
  const [payoutEmail, setPayoutEmail] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankRut, setBankRut] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formatRut = (value) => {
    let text = value.replace(/[^0-9kK]/g, '');
    if (!text) return '';
    if (text.length <= 1) return text;
    const result = text.slice(-1).toLowerCase();
    const textWithoutDigit = text.slice(0, -1);
    const withDots = textWithoutDigit.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withDots}-${result}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Phone format validation (+569XXXXXXXX)
    const phoneRegex = /^\+569\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('El teléfono debe tener el formato +56912345678');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('password', password);
      formData.append('role', role);
      
      if (role === 'creator') {
        formData.append('bank_name', bankName);
        formData.append('account_type', accountType);
        formData.append('account_number', accountNumber);
        formData.append('payout_email', payoutEmail);
        formData.append('bank_holder_name', bankHolderName);
        formData.append('bank_holder_rut', bankRut);
        if (idDocument) {
          formData.append('id_document', idDocument);
        } else {
          setError('Debes subir una foto de tu Carnet de Identidad o Pasaporte para ser creador.');
          return;
        }
      }

      await axios.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const res = await axios.post('/api/auth/login', { username, password });
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al registrar';
      setError(errorMessage);
      alert('⚠️ ATENCIÓN: ' + errorMessage); // Alerta ruidosa ("Pop-up")
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h2 className="auth-title">Crear Cuenta</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de Usuario</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input 
                type="tel" 
                className="form-control" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9..."
              />
            </div>
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
          <div className="form-group">
            <label className="form-label">Tipo de Usuario</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="viewer" 
                  checked={role === 'viewer'} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={{ marginRight: '0.5rem' }}
                />
                Espectador
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="creator" 
                  checked={role === 'creator'} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={{ marginRight: '0.5rem' }}
                />
                Creador
              </label>
            </div>
          </div>

          {role === 'creator' && (
            <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Verificación e Información para Pagos</h3>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Verificación de Identidad (+18)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  className="form-control"
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setIdDocument(e.target.files[0])}
                  required={role === 'creator'}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                  * Sube foto frontal de tu Cédula de Identidad o Pasaporte para verificar mayoría de edad.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Banco</label>
                  <select 
                    className="form-control" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required={role === 'creator'}
                  >
                    <option value="">Seleccione Banco</option>
                    <option value="Banco Estado">Banco Estado</option>
                    <option value="Santander">Santander</option>
                    <option value="Banco de Chile">Banco de Chile</option>
                    <option value="BCI">BCI</option>
                    <option value="Itaú">Itaú</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco Falabella">Banco Falabella</option>
                    <option value="Banco Ripley">Banco Ripley</option>
                    <option value="Tenpo">Tenpo / Prepago</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Cuenta</label>
                  <select 
                    className="form-control" 
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    required={role === 'creator'}
                  >
                    <option value="Corriente">Cuenta Corriente</option>
                    <option value="Vista">Cuenta Vista / RUT</option>
                    <option value="Ahorro">Cuenta de Ahorro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre del Titular</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Nombre completo"
                    required={role === 'creator'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RUT del Titular</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={bankRut}
                    onChange={(e) => setBankRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    maxLength={12}
                    required={role === 'creator'}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Cuenta</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Sin guiones ni puntos"
                  required={role === 'creator'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email de Pago (Opcional)</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                  placeholder="Donde te notificaremos"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                * Tus ganancias se liquidarán semanalmente (90% para ti).
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>Registrarse</button>
        </form>
        <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
