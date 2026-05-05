import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Music, ChevronRight, Search } from 'lucide-react';
import { loadSongs } from '../utils/songLoader';
import type { SongMetadata } from '../utils/songLoader';

const Home: React.FC = () => {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSongs().then(setSongs);
  }, []);

  const filteredSongs = useMemo(() => {
    return songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof song.artist === 'string' && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [songs, searchTerm]);

  return (
    <div className="container">
      <header className="home-header">
        <h1>Libretto Accordi</h1>
        <p>Il tuo canzoniere digitale</p>
      </header>

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Cerca una canzone o un artista..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
