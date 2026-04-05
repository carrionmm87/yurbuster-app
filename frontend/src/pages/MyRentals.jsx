import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const res = await axios.get('/api/rentals');
      setRentals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container text-center mt-8">Cargando...</div>;

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Mis Arriendos Activos</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Videos que puedes ver por 24 horas</p>
        </div>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center mt-8 text-muted" style={{ color: 'var(--text-muted)' }}>No has arrendado ningún video aún.</div>
      ) : (
        <div className="grid">
          {rentals.map(r => {
            const isExpired = new Date(r.expires_at) < new Date();
            return (
              <div key={r.id} className="video-card" style={{ opacity: isExpired ? 0.6 : 1 }}>
                <div className="video-info" style={{ paddingTop: '1.5rem' }}>
                  <h3 className="video-title">{r.title}</h3>
                  <div className="video-meta">
                    <span>Expira: {new Date(r.expires_at).toLocaleString()}</span>
                  </div>
                  <div className="video-actions mt-auto" style={{ paddingTop: '1rem' }}>
                    {isExpired ? (
                      <span style={{ color: '#ef4444', fontWeight: 500 }}>Expirado</span>
                    ) : (
                      <Link to={`/watch/${r.token}`} className="btn btn-primary" style={{ width: '100%' }}>
                        <Play size={18} /> Ver Ahora
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRentals;
