import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta?.env?.VITE_API_URL || 'https://api.yurbuster.com';

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
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const navigate = useNavigate();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const uploadFileDirectToR2 = async (file, type) => {
    const token = localStorage.getItem('token');
    const contentType = file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg');

    // 1. Pedir presigned URL al backend (incluye contentType para la firma)
    const { data } = await axios.get(`${API_BASE}/api/upload/presigned-url`, {
      params: { type, contentType },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!data.isCloud) {
      throw new Error('El almacenamiento cloud no está disponible.');
    }

    // 2. Subir directamente a R2 usando XHR con Content-Type exacto que se firmó
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', data.url);
      // Enviar el mismo Content-Type que se usó para firmar la URL
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.upload.onprogress = (e) => {
        if (type === 'video' && e.total) {
          const pct = Math.round((e.loaded / e.total) * 85);
          setProgress(pct);
          setProgressLabel(`Subiendo video... ${pct}%`);
        }
      };
      xhr.onload = () => {
        if (xhr.status < 400) {
          resolve();
        } else {
          reject(new Error(`R2 error ${xhr.status}: ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Error de red al subir archivo'));
      xhr.send(file);
    });

    return { fileId: data.fileId, key: data.key };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Selecciona un video');
    if (!isOwner) return setError('Debes confirmar que eres el propietario legal del video');
    if (!hasConsent) return setError('Debes confirmar el consentimiento de terceros (si aplica)');

    setLoading(true);
    setError('');
    setProgress(0);

    try {
      const token = localStorage.getItem('token');

      setProgressLabel('Preparando subida del video...');
      const { fileId: videoId, key: videoKey } = await uploadFileDirectToR2(file, 'video');

      let thumbnailKey = '';
      if (thumbnail) {
        setProgress(87);
        setProgressLabel('Subiendo miniatura...');
        const { key } = await uploadFileDirectToR2(thumbnail, 'thumbnail');
        thumbnailKey = key;
      }

      setProgress(95);
      setProgressLabel('Registrando video...');
      await axios.post(`${API_BASE}/api/upload/confirm`, {
        videoId,
        title,
        description,
        price,
        videoKey,
        thumbnailKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProgress(100);
      setProgressLabel('¡Listo!');
      const link = `${window.location.origin}/?video=${videoId}`;
      setShareLink(link);

    } catch (err) {
      console.error('[UPLOAD] Error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error inesperado';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <h2 className="auth-title">Subir Nuevo Video</h2>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {shareLink ? (
          <div className="text-center">
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '4px', marginBottom: '1rem' }}>
              ¡Video subido exitosamente!
            </div>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>Copia el enlace para promocionar tu video:</p>
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
              <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Escena exclusiva en el balcón" required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción Corta</label>
              <textarea className="form-control" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cuéntale a tus fans de qué trata este video..." />
            </div>
            <div className="form-group">
              <label className="form-label">Precio (CLP $)</label>
              <input type="number" step="1" min="1" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 5000" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Archivo de Video (.mp4)</label>
                <input type="file" accept="video/*" className="form-control" onChange={(e) => setFile(e.target.files[0])} required style={{ padding: '0.4rem' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Miniatura (Preview)</label>
                <input type="file" accept="image/*" className="form-control" onChange={(e) => setThumbnail(e.target.files[0])} style={{ padding: '0.4rem' }} />
              </div>
            </div>

            <div className="card p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Consentimiento Legal</h4>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                <input type="checkbox" id="isOwner" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} style={{ marginTop: '0.25rem' }} />
                <label htmlFor="isOwner" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Confirmo que soy el propietario legal de este video y tengo todos los derechos de autor para su distribución.
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <input type="checkbox" id="hasConsent" checked={hasConsent} onChange={(e) => setHasConsent(e.target.checked)} style={{ marginTop: '0.25rem' }} />
                <label htmlFor="hasConsent" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Aseguro contar con el consentimiento expreso y verificable de cualquier otra persona que aparezca en el video.
                </label>
              </div>
            </div>

            {loading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>{progressLabel}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#a855f7', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
              {loading ? progressLabel || 'Subiendo...' : 'Publicar Video'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Upload;
