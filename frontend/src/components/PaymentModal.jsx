import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import axios from 'axios';

const PaymentModal = ({ video, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/payment/create-charge', { videoId: video.id });
      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      } else {
        alert("El servidor no devolvió una URL de pago válida.");
        setLoading(false);
      }
    } catch (err) {
      console.error("DEBUG FRONTEND ERROR:", err);
      const errorMsg = err.response?.data?.details || err.message || "Error desconocido";
      const mainError = err.response?.data?.error || "Error al conectar con Flow";
      alert(`${mainError}\nDetalles: ${errorMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <button onClick={onClose} className="modal-close"><X size={24} /></button>
        <div className="modal-header">
          <h2 style={{ marginBottom: '0.5rem' }}>Finalizar Compra</h2>
          <p className="text-muted">Estás arrendando <strong>{video.title}</strong> por 24h</p>
        </div>
        
        <div className="payment-summary">
          <span>Total a pagar:</span>
          <span className="video-price" style={{ fontSize: '1.8rem' }}>
            {Number(video.price).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
          </span>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={handlePayment} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: '#e21a22', border: 'none' }} 
            disabled={loading}
          >
            {loading ? 'Redirigiendo a Pasarela Segura...' : `Pagar con Webpay / Flow`}
          </button>
        </div>
        
        <div className="secure-badge mt-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#888' }}>
          <Lock size={14} /> Pago seguro vía Webpay / Flow
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
