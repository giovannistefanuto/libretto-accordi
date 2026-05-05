import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import SongViewer from '../components/SongViewer';
import { loadSongs } from '../utils/songLoader';
import type { SongMetadata } from '../utils/songLoader';

const SongPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongMetadata | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(1.1);

  // Screen Wake Lock logic
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock attivo');
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    loadSongs().then((allSongs) => {
      const found = allSongs.find((s) => s.id === id);
      if (found) {
        setSong(found);
      }
    });
  }, [id]);

  const handleTranspose = (delta: number) => {
    setTranspose((prev) => {
      const next = prev + delta;
      return next % 12;
    });
  };

  const handleZoom = (delta: number) => {
    setFontSize(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  if (!song) return <div className="container">Caricamento...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="back-button" onClick={() => navigate('/')} style={{ margin: 0 }}>
          <ArrowLeft size={20} /> Torna all'Indice
        </button>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleZoom(-0.1)} title="Rimpicciolisci">
            <ZoomOut size={18} />
          </button>
          <button onClick={() => handleZoom(0.1)} title="Ingrandisci">
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => handleTranspose(-1)} title="Trasponi giù">
          <Minus size={20} />
        </button>
        <span className="transpose-value">
          {transpose > 0 ? `+${transpose}` : transpose}
        </span>
        <button onClick={() => handleTranspose(1)} title="Trasponi su">
          <Plus size={20} />
        </button>
        {transpose !== 0 && (
          <button onClick={() => setTranspose(0)} style={{ background: 'var(--accent)' }} title="Reset tonalità">
            <RotateCcw size={20} />
          </button>
        )}
      </div>

      <div className="song-container">
        <SongViewer chordProData={song.raw} transpose={transpose} fontSize={fontSize} />
      </div>
    </div>
  );
};

export default SongPage;
