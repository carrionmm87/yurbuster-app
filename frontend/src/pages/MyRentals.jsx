import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const MyRentals = ({ isAgeVerified }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const res = await api.get('/api/rentals');
      console.log("[MY-RENTALS] Datos recibidos:", res.data);
      setRentals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container text-center mt-8">Cargando tus arriendos...</div>;

  return (
    <div className="container animate-fade-in">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="mb-1">Mis Arriendos Activos</h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Videos que puedes ver por 24 horas</p>
        </div>
      </div>

      {rentals.length === 0 ? (
        <div className="text-center mt-12 py-20 bg-card rounded-xl border border-dashed border-border/50">
          <p className="text-muted text-lg mb-4">No has arrendado ningún video aún.</p>
          <Link to="/" className="btn btn-primary">Explorar Catálogo</Link>
        </div>
      ) : (
        <div className="grid">
          {rentals.map(r => {
            const isExpired = new Date(r.expires_at) < new Date();
            const video = r.video;
            return (
              <div key={r.id} className="video-card" style={{ opacity: isExpired ? 0.6 : 1 }}>
                <div className="video-thumbnail" style={{ position: 'relative', overflow: 'hidden' }}>
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt="thumbnail" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: !isAgeVerified ? 'blur(20px)' : 'none',
                        transition: 'filter 0.3s ease'
                      }}
                    />
                  ) : (
                    <Play size={48} opacity={0.5} />
                  )}
                  {!isAgeVerified && (
                    <div className="privacy-overlay" style={{ fontSize: '0.7rem' }}>
                      Contenido Protegido
                    </div>
                  )}
                </div>
                <div className="video-info">
                  <h3 className="video-title" style={{ marginBottom: '0.5rem' }}>{video.title}</h3>
                  <div className="video-meta" style={{ marginBottom: '1.5rem' }}>
                    <span className="flex items-center gap-1">
                      <span className="text-xs font-bold uppercase opacity-50">Expira:</span> 
                      {new Date(r.expires_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="video-actions mt-auto">
                    {isExpired ? (
                      <div className="btn bg-red-500/10 text-red-500 w-full cursor-not-allowed" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        Acceso Expirado
                      </div>
                    ) : (
                      <Link to={`/watch/${r.token}`} className="btn btn-primary w-full">
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
