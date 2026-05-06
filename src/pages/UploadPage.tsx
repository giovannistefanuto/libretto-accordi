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
          // Calcoliamo il peso totale stimato in memoria (in byte)
          // Un carattere base64 è circa 1 byte, ma qui ragioniamo sui file originali
          const estimatedTotalSize = currentImages.reduce((acc, img) => acc + img.length, 0) + file.size;
          
          // Se siamo ampiamente sotto il limite di Vercel (4.5MB base64 -> ~3.3MB raw)
          // Manteniamo una qualità altissima.
          const isLarge = estimatedTotalSize > 3000000; 
          
          const canvas = document.createElement('canvas');
          // Alziamo la risoluzione massima a 2000px per una precisione OCR superiore
          const MAX_SIZE = isLarge ? 1600 : 2000; 
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
          
          // Qualità dinamica: 0.9 se c'è spazio, 0.7 solo se necessario
          const quality = isLarge ? 0.7 : 0.9;
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
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
        <h1>Aggiungi Brano</h1>
        <p>Digitalizza il tuo libretto fisico</p>
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
            <Search size={18} /> Cerca
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
          <PlusCircle size={18} /> Aggiungi
        </button>
      </nav>

      <div className="song-container">
        {/* GUIDA USABILITÀ */}
        <div style={{ 
          background: 'rgba(37, 99, 235, 0.1)', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} /> Come aggiungere una canzone?
          </h4>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', opacity: 0.8, lineHeight: '1.4' }}>
            <li>Inserisci il <strong>Titolo</strong> corretto.</li>
            <li>Scatta una <strong>foto nitida</strong> del libretto (max 2 pagine).</li>
            <li>Invia a <strong>Gemini</strong>: l'IA trascriverà testo e accordi.</li>
            <li>Attendi 60s per il <strong>Deploy automatico</strong> su GitHub.</li>
          </ol>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Esempio: Albachiara - Vasco Rossi"
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
                  <span style={{ fontSize: '0.8rem' }}>{images.length === 0 ? 'Scatta Foto' : 'Aggiungi Pagina 2'}</span>
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
            Test
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
              <span>Console Log (Sotto il cofano)</span>
              {status === 'loading' && <Loader2 className="animate-spin" size={14} />}
            </div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.25rem', color: log.includes('ERRORE') ? '#ff4444' : '#00ff00' }}>
                {log}
              </div>
            ))}
            {status === 'success' && (
              <div style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> TRASCRIZIONE COMPLETATA!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
