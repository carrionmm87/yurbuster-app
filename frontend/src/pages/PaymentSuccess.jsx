import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verificando pago...');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;
      const token = searchParams.get('token');
      const videoId = searchParams.get('videoId'); // Capturamos el videoId que viene de la redirección

      if (!token) {
        setStatus('Faltan datos de pago de Flow. Por favor vuelve al inicio.');
        return;
      }

      try {
        const res = await axios.post('/api/rent', { token, videoId });
        navigate(`/watch/${res.data.token}`);
      } catch (err) {
        console.error(err);
        setStatus(err.response?.data?.error || 'Error al completar el arriendo. Verifica con soporte si se cobró correctamente.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="container text-center mt-8 animate-fade-in">
      <h2>Verificación de Pago</h2>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{status}</p>
      <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: '2rem' }}>
        Volver al Inicio
      </button>
    </div>
  );
};

export default PaymentSuccess;
