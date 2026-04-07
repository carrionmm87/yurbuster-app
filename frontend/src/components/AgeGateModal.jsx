import React from 'react';

const AgeGateModal = ({ onAccept }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content animate-scale-in" style={{ maxWidth: '450px', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(236, 72, 153, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid var(--accent)'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>18+</span>
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Verificación de Edad</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Este sitio web contiene material que puede no ser apropiado para menores de edad. 
          Para continuar, debes confirmar que eres mayor de 18 años.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={onAccept} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          >
            Soy mayor de 18 años - Entrar
          </button>
          <a 
            href="https://www.google.com" 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-block' }}
          >
            Salir
          </a>
        </div>
        
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(248, 250, 252, 0.4)' }}>
          Al entrar, aceptas nuestros términos de servicio y políticas de privacidad.
        </p>
      </div>
    </div>
  );
};

export default AgeGateModal;
