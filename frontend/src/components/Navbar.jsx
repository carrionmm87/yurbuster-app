import React from 'react';
import { Link } from 'react-router-dom';
import { Video, LogOut, Upload, Library } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        YurBuster
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-link" style={{ marginRight: '1rem' }}>Hola, <strong style={{ color: 'var(--text-main)' }}>{user.username}</strong> ({user.role})</span>
            {(user.role === 'admin' || user.username === 'admin') && (
              <Link to="/admin" className="btn btn-secondary">Admin Panel</Link>
            )}
            {user.role === 'creator' && (
              <>
                <Link to="/creator" className="btn btn-secondary">Dashboard</Link>
                <Link to="/upload" className="btn btn-secondary"><Upload size={18} /> Subir Video</Link>
              </>
            )}
            <Link to="/my-rentals" className="btn btn-primary"><Library size={18} /> Mis Arriendos</Link>
            <button onClick={onLogout} className="btn btn-secondary" title="Cerrar Sesión" style={{ border: 'none' }}><LogOut size={18} /></button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            <Link to="/register" className="btn btn-primary">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
