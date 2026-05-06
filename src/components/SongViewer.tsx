import React, { useState, useEffect } from 'react';
import ChordSheetJS from 'chordsheetjs';
import ChordBox from './ChordBox';

interface SongViewerProps {
  chordProData: string;
  transpose: number;
  fontSize: number;
}

const SongViewer: React.FC<SongViewerProps> = ({ chordProData, transpose, fontSize }) => {
  const [activeChord, setActiveChord] = useState<{ name: string; x: number; y: number } | null>(null);
  
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(chordProData);
  
  // Applichiamo la trasposizione se necessaria
  let transposedSong = song;
  if (transpose !== 0) {
    try {
      transposedSong = song.transpose(transpose);
    } catch (error) {
      console.error("Errore durante la trasposizione:", error);
    }
  }

  // Chiudi il tooltip quando si clicca altrove
  useEffect(() => {
    const handleClickOutside = () => setActiveChord(null);
    if (activeChord) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeChord]);

  const handleChordClick = (e: React.MouseEvent, chordName: string) => {
    e.stopPropagation(); // Evita la chiusura immediata del tooltip
    
    // Calcoliamo la posizione per il tooltip
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setActiveChord({
      name: chordName,
      x: rect.left + scrollLeft + rect.width / 2,
      y: rect.top + scrollTop - 10
    });
  };

  return (
    <div className="song-viewer" style={{ fontSize: `${fontSize}rem`, position: 'relative' }}>
      <h1>{song.title}</h1>
      {song.artist && <h2 style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '0.5rem' }}>{song.artist}</h2>}
      {song.metadata.getSingleMetadataValue('capo') && (
        <div style={{ 
          display: 'inline-block', 
          background: 'rgba(37, 99, 235, 0.1)', 
          color: 'var(--chord-color)', 
          padding: '0.2rem 0.6rem', 
          borderRadius: '4px', 
          fontSize: '0.7em', 
          fontWeight: 'bold',
          marginBottom: '1rem' 
        }}>
          CAPOTASTO: {song.metadata.getSingleMetadataValue('capo')}° TASTO
        </div>
      )}
      
      {/* Tooltip per l'accordo */}
      {activeChord && (
        <div 
          style={{ 
            position: 'absolute',
            left: `${activeChord.x}px`,
            top: `${activeChord.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
            pointerEvents: 'none' // Evita interferenze con il mouse
          }}
        >
          <ChordBox chordName={activeChord.name} />
          {/* Triangolino sotto il fumetto */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid white',
            margin: '-1px auto 0'
          }} />
        </div>
      )}

      <div className="song-content">
        {transposedSong.paragraphs.map((paragraph, pIdx) => (
          <div key={pIdx} className="paragraph" style={{ marginBottom: '1.5em' }}>
            {paragraph.lines.map((line, lIdx) => (
              <div key={lIdx} className="line" style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5em' }}>
                {line.items.map((item, iIdx) => {
                  if (item instanceof ChordSheetJS.ChordLyricsPair) {
                    return (
                      <div key={iIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span 
                          className="chord" 
                          onClick={(e) => handleChordClick(e, item.chords)}
                          style={{ 
                            cursor: 'pointer', 
                            color: 'var(--chord-color)',
                            fontWeight: 'bold',
                            padding: '0 2px'
                          }}
                        >
                          {item.chords}
                        </span>
                        <span className="lyrics">{item.lyrics || '\u00A0'}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongViewer;
