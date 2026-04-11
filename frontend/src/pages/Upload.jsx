import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Usamos nuestra instancia configurada con https://api.yurbuster.com

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
  const [storageStatus, setStorageStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/storage/status')
      .then(res => setStorageStatus(res.data))
      .catch(err => console.warn("No se pudo obtener el estado:", err));
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const uploadFileDirect = async (fileToUpload, type) => {
    const contentType = fileToUpload.type || (type === 'video' ? 'video/mp4' : 'image/jpeg');
    
    // 1. Pedir URL firmada
    const { data } = await api.get('/api/upload/presigned-url', {
      params: { type, contentType }
    });

    if (!data.isCloud) throw new Error('Servicio Cloud no disponible');

    // 2. Subir directamente a R2 (Sin límite de tiempo para archivos gigantes)
    await axios.put(data.url, fileToUpload, {
      headers: { 
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' // Obligatorio para R2
      },
      timeout: 0, // ¡PACIENCIA INFINITA! No cortar por tiempo
      onUploadProgress: (progressEvent) => {
        if (type === 'video') {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
            setProgressLabel(`Subiendo video a Cloudflare R2... ${pct}%`);
        }
      }
    });

    return { fileId: data.fileId, key: data.key };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Selecciona un video');
    if (!isOwner || !hasConsent) return setError('Debes confirmar los términos legales');
    
    setLoading(true);
    setError('');
    setProgress(0);
    setProgressLabel('Solicitando acceso a la nube...');

    try {
      // PROCESO 1: Subir Video DIRECTO
      const { fileId, key: videoKey } = await uploadFileDirect(file, 'video');
      
      // PROCESO 2: Subir Miniatura (opcional) DIRECTO
      let thumbnailKey = '';
      if (thumbnail) {
          setProgressLabel('Subiendo miniatura...');
          const thumbUpload = await uploadFileDirect(thumbnail, 'thumbnail');
          thumbnailKey = thumbUpload.key;
      }

      // PROCESO 3: Confirmar en Backend
      setProgressLabel('Publicando video...');
      const res = await api.post('/api/upload/confirm', {
          videoId: fileId,
          title,
          description,
          price,
          videoKey,
          thumbnailKey
      });
      
      setShareLink(`${window.location.origin}/?video=${fileId}`);
    } catch (err) {
      console.error("[UPLOAD] Error:", err);
      setError(`Fallo: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado Visual ---
  return (
    <div className="container animate-fade-in py-8">
      <div className="auth-card mx-auto" style={{ maxWidth: '600px' }}>
        <h2 className="auth-title text-3xl font-bold mb-6">Subir Nuevo Video (Modo Global)</h2>
        
        {error && <div className="alert-error mb-4">{error}</div>}
        
        {shareLink ? (
          <div className="success-screen p-6 bg-slate-800 rounded-lg text-center">
             <h3 className="text-emerald-400 text-xl mb-4">¡Publicado con éxito!</h3>
             <input type="text" readOnly value={shareLink} className="form-control mb-4 text-center" />
             <button onClick={handleCopyLink} className="btn btn-primary w-full mb-2">
                 {copied ? '¡Copiado!' : 'Copiar Enlace'}
             </button>
             <button onClick={() => navigate('/')} className="btn btn-outline w-full">Volver al Inicio</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">Título</label>
              <input type="text" className="form-control" required value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="form-label">Video (.mp4)</label>
                  <input type="file" accept="video/*" className="form-control" required onChange={e => setFile(e.target.files[0])} />
               </div>
               <div>
                  <label className="form-label">Miniatura (.jpg/.png)</label>
                  <input type="file" accept="image/*" className="form-control" onChange={e => setThumbnail(e.target.files[0])} />
               </div>
            </div>

            <div>
              <label className="form-label text-emerald-400">Precio (CLP $)</label>
              <input type="number" className="form-control" required value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 5000" />
            </div>

            {loading && (
              <div className="progress-container mb-6">
                 <div className="text-sm mb-1 text-blue-400 font-medium">{progressLabel}</div>
                 <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
            )}

            <div className="legal-box p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-xs space-y-3">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isOwner} onChange={e => setIsOwner(e.target.checked)} />
                  <span>Soy el propietario legal del video y tengo derechos totales.</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasConsent} onChange={e => setHasConsent(e.target.checked)} />
                  <span>Cuento con el consentimiento de todas las partes involucradas.</span>
               </label>
            </div>

            <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Subiendo archivo pesado...' : 'Publicar Ahora'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Upload;
