import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle2 } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 2) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const executeRequest = async (isTest: boolean = false) => {
    if (!isTest && (images.length === 0 || !title)) {
      alert('Inserisci titolo e almeno un\'immagine');
      return;
    }

    setStatus('loading');
    setLogs(["[Inizio] Avvio richiesta al server..."]);

    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: isTest ? [] : images, 
          title: isTest ? "Test API" : title,
          testMode: isTest 
        }),
      });

      const data = await response.json();
      if (data.logs) setLogs(data.logs);

      if (response.ok) {
        setStatus('success');
        if (!isTest) {
          setTimeout(() => navigate('/'), 5000);
        }
      } else {
        throw new Error(data.error || 'Errore nel processo');
      }
    } catch (err: any) {
      setStatus('error');
    }
  };

  return (
    <div className="container">
      <button className="back-button" onClick={() => navigate('/')}>
        <ArrowLeft size={20} /> Torna all'Indice
      </button>

      <div className="song-container">
        <h2 style={{ textAlign: 'center' }}>Aggiungi Canzone</h2>
        
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

          <div style={{ textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              id="camera-input"
              style={{ display: 'none' }}
              disabled={status === 'loading' || images.length >= 2}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: images.length > 1 ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
              {images.map((img, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img src={img} alt={`Preview ${index}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }} />
                  <button 
                    onClick={() => removeImage(index)}
                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ff4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {images.length < 2 && (
                <label
                  htmlFor="camera-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    border: '2px dashed var(--chord-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: 'rgba(37, 99, 235, 0.05)',
                    height: '150px'
                  }}
                >
                  <Camera size={32} color="var(--chord-color)" />
                  <span style={{ fontSize: '0.8rem' }}>{images.length === 0 ? 'Aggiungi foto' : 'Aggiungi seconda pagina'}</span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => executeRequest(false)}
            disabled={images.length === 0 || !title || status === 'loading'}
            style={{ flex: 2, justifyContent: 'center' }}
          >
            {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            Invia a Gemini
          </button>
          
          <button
            onClick={() => executeRequest(true)}
            disabled={status === 'loading'}
            style={{ flex: 1, justifyContent: 'center', background: 'var(--header-bg)', color: 'var(--text-color)', border: '1px solid var(--text-color)' }}
          >
            Test API
          </button>
        </div>

        {/* LOG TERMINAL */}
        {(status !== 'idle' || logs.length > 0) && (
          <div style={{
            background: '#1e1e1e',
            color: '#00ff00',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            marginTop: '1.5rem',
            textAlign: 'left',
            maxHeight: '300px',
            overflowY: 'auto',
            border: status === 'error' ? '1px solid #ff4444' : '1px solid #333'
          }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '0.5rem', paddingBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Console Log</span>
              {status === 'loading' && <Loader2 className="animate-spin" size={14} />}
            </div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.25rem', color: log.includes('ERRORE') ? '#ff4444' : '#00ff00' }}>
                {log}
              </div>
            ))}
            {status === 'success' && (
              <div style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> OPERAZIONE COMPLETATA CON SUCCESSO!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
