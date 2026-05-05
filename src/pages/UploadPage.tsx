import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!image || !title) {
      alert('Inserisci titolo e seleziona un\'immagine');
      return;
    }

    setStatus('loading');
    setMessage('Gemini sta analizzando la foto...');

    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, title }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Canzone salvata su GitHub! Il sito si aggiornerà tra circa 1 minuto.');
        setTimeout(() => navigate('/'), 3000);
      } else {
        throw new Error(data.error || 'Errore durante l\'upload');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="container">
      <button className="back-button" onClick={() => navigate('/')}>
        <ArrowLeft size={20} /> Torna all'Indice
      </button>

      <div className="song-container" style={{ textAlign: 'center' }}>
        <h2>Aggiungi Canzone</h2>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Scatta una foto al tuo libretto fisico</p>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Titolo della canzone"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="search-input"
            style={{ marginBottom: '1rem', textAlign: 'center' }}
            disabled={status === 'loading'}
          />

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              id="camera-input"
              style={{ display: 'none' }}
              disabled={status === 'loading'}
            />
            <label
              htmlFor="camera-input"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '2rem',
                border: '2px dashed var(--chord-color)',
                borderRadius: '12px',
                cursor: 'pointer',
                background: image ? 'transparent' : 'rgba(37, 99, 235, 0.05)'
              }}
            >
              {image ? (
                <img src={image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              ) : (
                <>
                  <Camera size={48} color="var(--chord-color)" />
                  <span>Scatta foto o scegli galleria</span>
                </>
              )}
            </label>
          </div>
        </div>

        {status === 'idle' || status === 'loading' ? (
          <button
            onClick={handleUpload}
            disabled={!image || !title || status === 'loading'}
            style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {message}
              </>
            ) : (
              <>
                <Upload size={20} /> Invia a Gemini
              </>
            )}
          </button>
        ) : (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
