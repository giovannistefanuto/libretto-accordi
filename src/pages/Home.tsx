import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Music, ChevronRight, Search, PlusCircle } from 'lucide-react';
import { loadSongs } from '../utils/songLoader';
import type { SongMetadata } from '../utils/songLoader';

const Home: React.FC = () => {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [songToDelete, setSongToDelete] = useState<SongMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [pressTimer, setPressTimer] = useState<number | null>(null);

  useEffect(() => {
    loadSongs().then(setSongs);
  }, []);

  const handleRemoveCommand = async () => {
    if (!songToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: songToDelete.id }),
      });
      
      if (response.ok) {
        setSongs(prev => prev.filter(s => s.id !== songToDelete.id));
        setSongToDelete(null);
        setPassword('');
      } else {
        const data = await response.json();
        alert('Errore: ' + data.error);
      }
    } catch (err) {
      alert('Errore di connessione');
    } finally {
      setIsDeleting(false);
    }
  };

  // Gestione Pressione Prolungata (Long Press)
  const handleTouchStart = (song: SongMetadata) => {
    const timer = window.setTimeout(() => {
      setSongToDelete(song);
      if (window.navigator.vibrate) window.navigator.vibrate(50); // Feedback vibrazione se supportato
    }, 800); // 800ms per attivare
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const filteredSongs = useMemo(() => {
    return songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof song.artist === 'string' && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [songs, searchTerm]);

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <header className="home-header">
        <h1>Libretto Canti Digitale</h1>
        <p>Finalmente possiamo alzare/abbassare le tonalità senza Davide Camporese!</p>
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
          <Search size={18} /> Cerca Brani
        </button>
        <Link to="/upload" style={{ flex: 1, textDecoration: 'none' }}>
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
            <PlusCircle size={18} /> Aggiungi Nuova
          </button>
        </Link>
      </nav>

      <div className="search-container" style={{ marginBottom: '2rem' }}>
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Cerca per titolo o autore..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* MODAL ELIMINAZIONE */}
      {songToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--header-bg)', padding: '2rem', borderRadius: '16px',
            width: '100%', maxWidth: '400px', border: '1px solid #333', textAlign: 'center'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Elimina Canzone?</h2>
            <p>Vuoi davvero eliminare <strong>{songToDelete.title}</strong>?</p>
            
            <input 
              type="password"
              placeholder="Inserisci password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: '#1a1a1a', border: '1px solid #333', color: 'white',
                textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => { setSongToDelete(null); setPassword(''); }}
                style={{ flex: 1, background: '#333' }}
              >
                Annulla
              </button>
              <button 
                onClick={handleRemoveCommand}
                disabled={password !== 'gio' || isDeleting}
                style={{ 
                  flex: 1, 
                  background: password === 'gio' ? '#ef4444' : '#222',
                  opacity: password === 'gio' ? 1 : 0.5,
                  cursor: password === 'gio' ? 'pointer' : 'not-allowed'
                }}
              >
                {isDeleting ? '...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="song-list">
        {filteredSongs.map((song) => (
          <div 
            key={song.id} 
            className="song-item-wrapper"
            onMouseDown={() => handleTouchStart(song)}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onTouchStart={() => handleTouchStart(song)}
            onTouchEnd={handleTouchEnd}
          >
            <Link to={`/song/${song.id}`} className="song-item">
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || 'Artista sconosciuto')}</p>
              </div>
              <ChevronRight size={20} opacity={0.5} />
            </Link>
          </div>
        ))}
        {filteredSongs.length === 0 && songs.length > 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
            <p>Nessun risultato per "{searchTerm}"</p>
          </div>
        )}
        {songs.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
            <Music size={48} style={{ marginBottom: '1rem' }} />
            <p>Nessuna canzone trovata. Aggiungi file .chordpro in src/songs/</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
