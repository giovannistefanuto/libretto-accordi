import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Upload, Loader2, CheckCircle2, Music, PlusCircle, Search } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === 'gio') {
      setIsAuthenticated(true);
    } else {
      alert('Password errata');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="song-container" style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <Music size={48} color="var(--chord-color)" style={{ marginBottom: '1.5rem' }} />
          <h2>Area Riservata</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Inserisci la password per aggiungere nuove canzoni.</p>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="search-input"
              style={{ marginBottom: '1.5rem', textAlign: 'center' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => navigate('/')} style={{ flex: 1, background: 'transparent', border: '1px solid #333' }}>
                Annulla
              </button>
              <button type="submit" style={{ flex: 2, justifyContent: 'center' }}>
                Accedi
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const processImage = (file: File, currentImages: string[]): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
        // Calcoliamo il peso stimato. 
        // Per la massima precisione degli accordi, alziamo la risoluzione a 2500px.
        const estimatedTotalSize = currentImages.reduce((acc, img) => acc + img.length, 0) + file.size;

        // Limite Vercel 4.5MB. Stiamo cauti a 3.5MB per il payload base64.
        const isTooLarge = estimatedTotalSize > 3500000; 

        const canvas = document.createElement('canvas');
        const MAX_SIZE = isTooLarge ? 2000 : 2500; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Manteniamo la qualità al 90% per non perdere i dettagli degli accordi piccoli
        const quality = isTooLarge ? 0.8 : 0.9;
        resolve(canvas.toDataURL('image/jpeg', quality));
        };      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 2) {
      const processed = await processImage(file, images);
      setImages(prev => [...prev, processed]);
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: `Errore HTTP ${response.status}: ${response.statusText}` };
        }
        
        if (errorData.logs) setLogs(errorData.logs);
        throw new Error(errorData.error || 'Errore nel processo');
      }

      const data = await response.json();
      if (data.logs) setLogs(data.logs);
      setStatus('success');
      
      if (!isTest) {
        setTimeout(() => navigate('/'), 5000);
      }
    } catch (err: any) {
      setStatus('error');
      setLogs(prev => [...prev, `❌ ERRORE CRITICO: ${err.message}`]);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <header className="home-header">
        <h1>Aggiungi Canzone</h1>
        <p>Trasforma una foto in testo e accordi</p>
      </header>

      <nav style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        background: 'rgba(255,255,255,0.03)',
        padding: '0.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Link to="/" style={{ flex: 1, textDecoration: 'none' }}>
          <button style={{ 
            width: '100%',
            background: 'transparent', 
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-color)',
            opacity: 0.7
          }}>
            <Search size={18} /> Cerca Brani
          </button>
        </Link>
        <button style={{ 
          flex: 1, 
          background: 'var(--chord-color)', 
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <PlusCircle size={18} /> Aggiungi Nuova
        </button>
      </nav>

      <div className="song-container">
        {/* GUIDA USABILITÀ SEMPLIFICATA */}
        <div style={{ 
          background: 'rgba(37, 99, 235, 0.1)', 
          padding: '1.25rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          fontSize: '0.95rem'
        }}>
          <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--chord-color)' }}>
            <Camera size={20} /> Come fare? È semplicissimo:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li style={{ display: 'flex', gap: '0.5rem' }}><strong>1.</strong> Scrivi il titolo della canzone.</li>
            <li style={{ display: 'flex', gap: '0.5rem' }}><strong>2.</strong> Clicca sul riquadro tratteggiato e scatta una foto nitida al foglio (se servono, 2 foto).</li>
            <li style={{ display: 'flex', gap: '0.5rem' }}><strong>3.</strong> Clicca "Crea Canzone".</li>
            <li style={{ display: 'flex', gap: '0.5rem' }}><strong>4.</strong> Attendi uno o due minuti: la canzone apparirà nell'elenco!</li>
          </ul>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Titolo della canzone:</label>
          <input
            type="text"
            placeholder="Esempio: Albachiara"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="search-input"
            style={{ marginBottom: '1.5rem', textAlign: 'center' }}
            disabled={status === 'loading'}
          />

          <div style={{ textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Foto del foglio (max 2):</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              id="camera-input"
              style={{ display: 'none' }}
              disabled={status === 'loading' || images.length >= 2}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: images.length > 1 ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {images.map((img, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img src={img} alt={`Pagina ${index + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #444' }} />
                  <button 
                    onClick={() => removeImage(index)}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
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
                    gap: '0.75rem',
                    padding: '1.5rem',
                    border: '2px dashed #444',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    height: '180px'
                  }}
                >
                  <Camera size={40} opacity={0.5} />
                  <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>{images.length === 0 ? 'Tocca per scattare foto' : 'Aggiungi seconda pagina'}</span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => executeRequest(false)}
            disabled={images.length === 0 || !title || status === 'loading'}
            style={{ flex: 2, justifyContent: 'center', height: '3.5rem', fontSize: '1.1rem' }}
          >
            {status === 'loading' ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
            Crea Canzone
          </button>
        </div>

        {/* LOG TERMINAL - SOLO SE NECESSARIO */}
        {(status !== 'idle' || logs.length > 0) && (
          <div style={{
            background: '#111',
            color: '#888',
            padding: '1rem',
            borderRadius: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            marginTop: '1rem',
            textAlign: 'left',
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #222'
          }}>
            <div style={{ borderBottom: '1px solid #222', marginBottom: '0.5rem', paddingBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Dettagli Tecnici (Sotto il cofano)</span>
              {status === 'loading' && <Loader2 className="animate-spin" size={12} />}
            </div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.2rem', color: log.includes('ERRORE') ? '#ef4444' : (log.includes('SUCCESSO') ? '#10b981' : '#888') }}>
                {log}
              </div>
            ))}
            {status === 'success' && (
              <div style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} /> CANZONE SALVATA CON SUCCESSO!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
