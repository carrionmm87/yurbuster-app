import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Selecciona un video');
    if (!isOwner) return setError('Debes confirmar que eres el propietario legal del video');
    if (!hasConsent) return setError('Debes confirmar el consentimiento de terceros (si aplica)');
    
    setLoading(true);
    try {
      // 1. Get Presigned URL
      const contentType = file.type || 'video/mp4';
      const presignedRes = await axios.get(`/api/upload/presigned-url?contentType=${encodeURIComponent(contentType)}`);
      const { url, videoId } = presignedRes.data;

      // 2. Upload file directly to S3/R2 using the full presigned URL
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('El Storage Cloud rechazó la subida');
      }

      // 3. Confirm upload with Backend
      const completeRes = await axios.post('/api/upload/complete', {
         videoId,
         title,
         price,
         description
      });
      
      const link = `${window.location.origin}/?video=${videoId}`;
      setShareLink(link);
    } catch (err) {
      console.error("Error al subir video:", err);
      setError(err.response?.data?.error || 'Error de conexión con Almacenamiento Cloud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <h2 className="auth-title">Subir Nuevo Video</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}
        
        {shareLink ? (
          <div className="text-center">
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '4px', marginBottom: '1rem' }}>
              ¡Video subido exitosamente!
            </div>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>Copia el siguiente enlace para promocionar tu video:</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" readOnly value={shareLink} className="form-control" />
              <button type="button" onClick={handleCopyLink} className="btn btn-primary">
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <button onClick={() => navigate('/')} className="btn btn-outline" style={{ width: '100%' }}>
              Ir al Catálogo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título del Video</label>
            <input 
              type="text" 
              className="form-control" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Escena exclusiva en el balcón"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción Corta</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntale a tus fans de qué trata este video..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Precio (CLP $)</label>
            <input 
              type="number" 
              step="1"
              min="1"
              className="form-control" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 5000 (Sin puntos)"
              required 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Archivo de Video (.mp4)</label>
              <input 
                type="file" 
                accept="video/*"
                className="form-control" 
                onChange={(e) => setFile(e.target.files[0])}
                required 
                style={{ padding: '0.4rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Miniatura (Preview)</label>
              <input 
                type="file" 
                accept="image/*"
                className="form-control" 
                onChange={(e) => setThumbnail(e.target.files[0])}
                style={{ padding: '0.4rem' }}
              />
            </div>
          </div>

          <div className="card p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Consentimiento Legal</h4>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                id="isOwner" 
                checked={isOwner} 
                onChange={(e) => setIsOwner(e.target.checked)}
                style={{ marginTop: '0.25rem' }}
              />
              <label htmlFor="isOwner" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Confirmo que soy el propietario legal de este video y tengo todos los derechos de autor para su distribución.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                id="hasConsent" 
                checked={hasConsent} 
                onChange={(e) => setHasConsent(e.target.checked)}
                style={{ marginTop: '0.25rem' }}
              />
              <label htmlFor="hasConsent" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Aseguro contar con el consentimiento expreso y verificable de cualquier otra persona que aparezca en el video.
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Subiendo...' : 'Publicar Video'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default Upload;
