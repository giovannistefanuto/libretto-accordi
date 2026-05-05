import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Music, ChevronRight, Search, PlusCircle } from 'lucide-react';
import { loadSongs } from '../utils/songLoader';
import type { SongMetadata } from '../utils/songLoader';

const Home: React.FC = () => {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSongs().then(setSongs);
  }, []);

  const handleRemoveCommand = async (songId: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente "${songId}"?`)) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: songId }),
      });
      
      if (response.ok) {
        alert('Canzone eliminata! Il sito si aggiornerà tra circa 60 secondi.');
        setSongs(prev => prev.filter(s => s.id !== songId));
        setSearchTerm('');
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

  const removeMatch = searchTerm.match(/^-remove\s+(.+)$/i);
  const songToRemove = removeMatch ? songs.find(s => 
    s.title.toLowerCase() === removeMatch[1].toLowerCase() || 
    s.id.toLowerCase() === removeMatch[1].toLowerCase()
  ) : null;

  const filteredSongs = useMemo(() => {
    if (removeMatch) return []; // Non mostrare la lista se stiamo usando un comando
    return songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof song.artist === 'string' && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [songs, searchTerm, removeMatch]);

  return (
    <div className="container">
      <header className="home-header">
        <h1>Libretto Accordi</h1>
        <p>Il tuo canzoniere digitale</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-container" style={{ margin: 0, flex: 1 }}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Cerca o usa -remove TITOLO..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <button style={{ borderRadius: '50px', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
              <PlusCircle size={20} /> Aggiungi
            </button>
          </Link>
        </div>

        {songToRemove && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>COMANDO ELIMINAZIONE:</span>
              <p style={{ margin: 0 }}>Vuoi eliminare <strong>{songToRemove.title}</strong>?</p>
            </div>
            <button 
              onClick={() => handleRemoveCommand(songToRemove.id)}
              disabled={isDeleting}
              style={{ background: '#ef4444', color: 'white', border: 'none' }}
            >
              {isDeleting ? 'Eliminazione...' : 'Conferma ed Elimina'}
            </button>
          </div>
        )}
      </div>

      <div className="song-list">
        {filteredSongs.map((song) => (
          <Link key={song.id} to={`/song/${song.id}`} className="song-item">
            <div className="song-info">
              <h3>{song.title}</h3>
              <p>{Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || 'Artista sconosciuto')}</p>
            </div>
            <ChevronRight size={20} opacity={0.5} />
          </Link>
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
