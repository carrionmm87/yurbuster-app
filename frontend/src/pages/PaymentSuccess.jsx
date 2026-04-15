import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verificando pago...');
  const [retries, setRetries] = useState(0);
  const verifyInProgressRef = useRef(false);
  const pollingIntervalRef = useRef(null);

  const verifyPayment = async () => {
    if (verifyInProgressRef.current) return;
    verifyInProgressRef.current = true;

    const token = searchParams.get('token');
    const videoId = searchParams.get('videoId');

    if (!token) {
      setStatus('Faltan datos de pago de Flow. Por favor vuelve al inicio.');
      verifyInProgressRef.current = false;
      return;
    }

    try {
      console.log(`[PAY-VERIFY] Intento ${retries + 1}: verificando token ${token}`);
      const res = await api.post('/api/rent', { token, videoId });

      // Éxito: redirigir a reproducción
      clearInterval(pollingIntervalRef.current);
      setStatus('✅ Pago confirmado. Redirigiendo...');
      setTimeout(() => navigate(`/watch/${res.data.token}`), 1000);
    } catch (err) {
      console.error('[PAY-VERIFY] Error:', err.message);
      const errorMsg = err.response?.data?.error || err.message;

      // Si dice "aún no ha sido confirmado", reintentar en 2 segundos
      if (errorMsg.includes('aún no ha sido confirmado')) {
        setStatus(`Procesando pago... (intento ${retries + 1})`);
        setRetries(r => r + 1);
      } else {
        // Error definitivo
        setStatus(`❌ ${errorMsg}`);
        clearInterval(pollingIntervalRef.current);
      }
    } finally {
      verifyInProgressRef.current = false;
    }
  };

  useEffect(() => {
    verifyPayment();

    // Polling cada 2 segundos hasta máximo 10 intentos (20 segundos)
    if (retries < 10) {
      pollingIntervalRef.current = setTimeout(() => {
        setRetries(r => r + 1);
        verifyPayment();
      }, 2000);
    } else {
      setStatus('❌ Tiempo agotado. Verifica con soporte si se cobró correctamente.');
    }

    return () => {
      if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
    };
  }, [retries]);

  return (
    <div className="container text-center mt-8 animate-fade-in">
      <h2>Verificación de Pago</h2>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{status}</p>
      <button onClick={() => navigate('/my-rentals')} className="btn btn-outline" style={{ marginTop: '2rem' }}>
        Volver a Mis Arriendos
      </button>
    </div>
  );
};

export default PaymentSuccess;
