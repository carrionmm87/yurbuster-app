import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Hls from 'hls.js';

const Player = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [playbackMode, setPlaybackMode] = useState(null); // 'hls' | 'raw'
  const [isPrivacyViolated, setIsPrivacyViolated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  const videoSrc = `/api/stream/${token}`;

  // Detect which playback mode to use (HLS or Raw)
  useEffect(() => {
    const detectMode = async () => {
      try {
        // We use a small range request to see the headers without downloading everything
        const res = await fetch(videoSrc, {
          headers: { 'Range': 'bytes=0-100' }
        });
        const contentType = res.headers.get('Content-Type') || '';
        console.log('Detected Content-Type:', contentType);
        
        if (contentType.includes('mpegurl') || contentType.includes('mpegURL')) {
          setPlaybackMode('hls');
        } else {
          setPlaybackMode('raw');
        }
      } catch (err) {
        console.error('Failure detecting video type, falling back to raw:', err);
        setPlaybackMode('raw');
      }
    };
    detectMode();
  }, [videoSrc]);

  useEffect(() => {
    let focusTimer;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPrivacyViolated(true);
        if (videoRef.current) videoRef.current.pause();
      }
    };

    const handleBlur = () => {
      // 1.5 second grace period to prevent false positives when using browser UI/controls
      focusTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          setIsPrivacyViolated(true);
          if (videoRef.current) videoRef.current.pause();
        }
      }, 1500);
    };

    const handleFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, []);

  useEffect(() => {
    if (!playbackMode || !videoRef.current) return;

    if (playbackMode === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr) => { xhr.withCredentials = false; },
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
        });

        console.log('Mode: HLS. Loading Source:', videoSrc);
        hls.loadSource(videoSrc);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          videoRef.current.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Fatal Error:', data);
            // If HLS fails, we could try to fallback to raw as a last resort
            if (data.details === 'manifestParsingError') {
               console.warn('HLS Parsing failed, attempting fallback to raw mode...');
               setPlaybackMode('raw');
            } else {
               setError('Error de streaming HLS. Recarga la página.');
            }
          }
        });

        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoSrc;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          videoRef.current.play().catch(() => {});
        });
      }
    } else {
      // RAW MODE (mp4, mov, etc)
      console.log('Mode: RAW. Loading Source Directly:', videoSrc);
      videoRef.current.src = videoSrc;
      videoRef.current.addEventListener('loadeddata', () => {
        setIsLoading(false);
        videoRef.current.play().catch(() => {});
      });
      videoRef.current.onerror = () => {
        setError('El formato de video no es compatible o el enlace ha expirado.');
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoSrc, playbackMode]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // document.hidden catches tab switching and window minimization
      if (document.hidden) {
        setIsPrivacyViolated(true);
        if (videoRef.current) videoRef.current.pause();
      }
    };

    const handleBlur = () => {
      // blur catches when the window losing focus (like opening another app)
      setIsPrivacyViolated(true);
      if (videoRef.current) videoRef.current.pause();
    };

    const handleKeyDown = (e) => {
      // Prevent PrintScreen and Inspect Element shortcuts (Best effort)
      if (
        e.key === 'PrintScreen' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleResume = () => {
    setIsPrivacyViolated(false);
    // Note: Some browsers might block auto-play resume without user interaction, 
    // but since this is called from a button click, it should be fine.
    if (videoRef.current) videoRef.current.play();
  };

  return (
    <div 
      className="container animate-fade-in video-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button onClick={() => navigate(-1)} className="btn btn-secondary mb-4" style={{ border: 'none' }}>
        <ArrowLeft size={18} /> Volver
      </button>

      <div style={{ 
        position: 'relative', 
        backgroundColor: '#000', 
        borderRadius: '16px', 
        padding: '0.5rem', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {error ? (
           <div className="text-center" style={{ padding: '3rem', color: '#ef4444' }}>{error}</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <video 
              ref={videoRef}
              controls 
              autoPlay 
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              className={isPrivacyViolated ? 'privacy-blur' : ''}
              style={{ width: '100%', borderRadius: '8px', maxHeight: '75vh', backgroundColor: '#000', display: 'block' }}
              onError={() => {
                if (!videoRef.current?.src.includes('blob:')) {
                   setError('El enlace ha expirado o el video no está disponible (token inválido).');
                }
              }}
            >
              Tu navegador no soporta el elemento de video.
            </video>
            
            {/* Text Watermark - Bottom Right */}
            <div 
              className="video-watermark" 
              style={{ 
                opacity: isPrivacyViolated ? 0 : 0.4,
                color: 'white',
                fontSize: '2rem',
                fontWeight: '900',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '2px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                width: 'auto'
              }} 
            >
              YURBUSTER
            </div>

            {/* Privacy Shield Overlay */}
            {isPrivacyViolated && (
              <div className="privacy-overlay">
                <div className="text-center">
                  <ShieldAlert size={60} style={{ marginBottom: '1.5rem', color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Contenido Protegido</h3>
                  <p style={{ color: '#cbd5e1', marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem' }}>
                    La reproducción se ha detenido por seguridad al detectar que saliste de la aplicación.
                  </p>
                  <button onClick={handleResume} className="btn btn-primary">
                    Reanudar Video
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
        <p>Este enlace especial de arriendo es válido solo por 24 horas.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
          Las grabaciones y capturas de pantalla están restringidas para proteger los derechos de autor.
        </p>
      </div>
    </div>
  );
};

export default Player;
