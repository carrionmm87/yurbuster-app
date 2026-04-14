import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlayCircle, UserPlus, Film, UploadCloud, ArrowRight } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

const Home = ({ user, isAgeVerified }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [creatorFilter, setCreatorFilter] = useState('');
  const debounceTimer = useRef(null);
  const navigate = useNavigate();

  // Fetch videos whenever category changes (immediate)
  useEffect(() => {
    fetchVideos();
  }, [categoryFilter]);

  // Fetch videos with debounce when creator filter changes
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      fetchVideos();
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [creatorFilter]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter && categoryFilter !== 'todos') params.category = categoryFilter;
      if (creatorFilter) params.creator = creatorFilter;
      const res = await axios.get('/api/videos', { params });
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videos.length > 0) {
      const videoId = searchParams.get('video');
      if (videoId) {
        const videoToOpen = videos.find(v => v.id === videoId);
        if (videoToOpen) {
          handleSelectVideo(videoToOpen);
        }
        // Remove 'video' from URL after processing so it doesn't trigger on reload
        searchParams.delete('video');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [videos, searchParams]);

  const handleSelectVideo = (video) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedVideo(video);
  };

  const handleRentSuccess = async (videoId) => {
    try {
      const res = await axios.post('/api/rent', { videoId });
      setSelectedVideo(null);
      navigate(`/watch/${res.data.token}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al completar el arriendo');
    }
  };

  if (loading) return <div className="container text-center mt-8">Cargando videos...</div>;

  return (
    <>
      <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-video-container">
          <video 
            className="hero-video"
            autoPlay 
            muted 
            loop 
            playsInline
            poster="https://cdn.pixabay.com/video/2025/03/06/262860_large.mp4"
          >
            <source src="https://cdn.pixabay.com/video/2025/03/06/262860_large.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay"></div>
        </div>
        
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title">Tu Nuevo Videoclub Digital</h1>
          <p className="hero-subtitle">
            El videoclub definitivo para contenidos digitales exclusivos. Arrienda estrenos y material de tus creadores favoritos por 24 horas, o conviértete en creador subiendo tus propios videos para monetizar al instante en Chile.
          </p>
          
          <div style={{
            background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            border: '2px solid var(--accent)',
            borderRadius: '12px',
            padding: '1.2rem 2rem',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
            animation: 'hero-title-pulse 2s ease-in-out infinite alternate'
          }}>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '1.4rem', 
              fontWeight: '800', 
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              🚀 ¡GANA DINERO EXTRA! Y RECIBE TU PAGO TODOS LOS VIERNES 💸
            </h3>
          </div>

          <a href="#catalogo" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '50px' }}>
            Explorar Catálogo <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <div className="steps-container">
          <h2 className="steps-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon-wrapper">
                <UserPlus size={32} />
              </div>
              <h3 className="step-title">1. Regístrate</h3>
              <p className="step-desc">Antes de arrendar o subir videos al catálogo, crea tu cuenta gratuita y configura tus datos rápidamente.</p>
            </div>
            
            <div className="step-card">
              <div className="step-icon-wrapper">
                <Film size={32} />
              </div>
              <h3 className="step-title">2. Arrienda Videos</h3>
              <p className="step-desc">Navega por el catálogo y arrienda contenido con Webpay. Tendrás acceso ininterrumpido a la reproducción por 24 horas.</p>
            </div>
            
            <div className="step-card">
              <div className="step-icon-wrapper">
                <UploadCloud size={32} />
              </div>
              <h3 className="step-title">3. Sube y Gana</h3>
              <p className="step-desc">Publica tus propios videos en la plataforma. Por cada arriendo recibirás el 90% de las ganancias directamente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalogo" className="container catalog-section">
        <div className="page-header" style={{ marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #ec4899, #6366f1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Catálogo de Videos
            </h2>
            <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Encuentra los mejores videos para arrendar hoy</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Categoría</label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontSize: '0.9rem' }}
            >
              <option value="todos">Todos</option>
              <option value="general">General</option>
              <option value="estreno">Estreno 🎬</option>
              <option value="vip">VIP ⭐</option>
              <option value="exclusivo">Exclusivo 🔒</option>
              <option value="trending">Trending 🔥</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.9rem' }}>
              🔍 Buscar por Creador {creatorFilter && `(${videos.length} resultado${videos.length !== 1 ? 's' : ''})`}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Escribe el nombre..."
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                style={{ fontSize: '0.9rem', flex: 1 }}
              />
              {creatorFilter && (
                <button
                  onClick={() => setCreatorFilter('')}
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'var(--border)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'var(--primary)'}
                  onMouseOut={(e) => e.target.style.background = 'var(--border)'}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading indicator cuando está filtrando */}
        {loading && creatorFilter && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '500' }}>
            🔄 Filtrando creadores...
          </div>
        )}

      {videos.length === 0 ? (
        <div className="text-center mt-8" style={{ color: 'var(--text-muted)' }}>No hay videos disponibles por ahora.</div>
      ) : (
        <div className="grid">
          {videos.map(v => (
            <div key={v.id} className="video-card">
              <div className="video-thumbnail" style={{ position: 'relative', overflow: 'hidden' }}>
                {v.thumbnailUrl ? (
                  <img 
                    src={v.thumbnailUrl} 
                    alt="thumbnail" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      filter: 'blur(25px)', // Difuminación permanente para proteger el contenido
                      transition: 'filter 0.3s ease'
                    }}
                  />
                ) : (
                  <PlayCircle size={48} opacity={0.5} />
                )}
              </div>
              <div className="video-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 className="video-title" style={{ marginBottom: '0' }}>{v.title}</h3>
                  {v.category && v.category !== 'general' && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: v.category === 'estreno' ? '#f59e0b' :
                                      v.category === 'vip' ? '#a855f7' :
                                      v.category === 'exclusivo' ? '#ef4444' :
                                      v.category === 'trending' ? '#ec4899' : 'transparent',
                      color: '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {v.category}
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="text-muted" style={{
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    color: 'rgba(248, 250, 252, 0.7)'
                  }}>
                    {v.description}
                  </p>
                )}
                {v.duration && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    ⏱️ {Math.floor(v.duration / 60)}m {v.duration % 60}s
                    {v.is_temporary && ' • 24hrs'}
                  </p>
                )}
                <div className="video-meta">
                  <span>Subido por: {v.uploader}</span>
                </div>
                <div className="video-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="video-price">
                    {Number(v.price).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                  </span>
                  <button onClick={() => handleSelectVideo(v)} className="btn btn-accent">
                    Arrendar (24h)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </section>
      </div>

      {selectedVideo && (
        <PaymentModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          onSuccess={handleRentSuccess} 
        />
      )}
    </>
  );
};

export default Home;
