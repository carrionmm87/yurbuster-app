import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, HelpCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer animate-fade-in">
      <div className="footer-content">
        <div className="footer-section">
          <h4>YurBuster</h4>
          <p className="text-muted text-sm">
            La plataforma líder de contenido exclusivo para adultos bajo demanda.
          </p>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><Link to="/terms">Términos del Servicio</Link></li>
            <li><Link to="/privacy">Privacidad</Link></li>
            <li><Link to="/refunds">Reembolsos</Link></li>
            <li><Link to="/terms">Cumplimiento 18 U.S.C. 2257</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Ayuda</h4>
          <ul className="footer-links">
            <li><Link to="/contact"><HelpCircle size={14} /> Soporte Técnico</Link></li>
            <li><Link to="/contact"><Mail size={14} /> Contacto</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="legal-notice">
          © {new Date().getFullYear()} YurBuster. Reservados todos los derechos.<br />
          Manuel Carrión - Hamurabi #1526, Maipú, Santiago, Chile | soporte@yurbuster.com<br />
          Este sitio web contiene contenido para adultos. Al ingresar, usted confirma que es mayor de edad en su jurisdicción. 
        </div>
        <div className="flex gap-4">
          <Shield size={24} className="text-muted opacity-50" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
