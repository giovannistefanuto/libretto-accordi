import React, { useState, useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ChordSheetJS from 'chordsheetjs';
import ChordBox from './ChordBox';

// Semplice Error Boundary per catturare i crash del tooltip
class ChordErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chord Tooltip Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ background: 'white', color: 'red', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>Errore nel diagramma</div>;
    }
    return this.props.children;
  }
}

interface SongViewerProps {
  chordProData: string;
  transpose: number;
  fontSize: number;
}

const SongViewer: React.FC<SongViewerProps> = ({ chordProData, transpose, fontSize }) => {
  const [activeChord, setActiveChord] = useState<{ name: string; x: number; y: number } | null>(null);
  
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(chordProData);
  
  let transposedSong = song;
  if (transpose !== 0) {
    try {
      transposedSong = song.transpose(transpose);
    } catch (error) {
      console.error("Errore durante la trasposizione:", error);
    }
  }

  useEffect(() => {
    const handleClickOutside = () => setActiveChord(null);
    if (activeChord) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeChord]);

  const handleChordClick = (e: React.MouseEvent, chordName: string) => {
    e.stopPropagation();
    
    // IMPORTANTE: Calcoliamo la posizione relativa al container .song-viewer
    // perché il container ha position: relative
    const container = e.currentTarget.closest('.song-viewer') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const chordRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setActiveChord({
      name: chordName,
      x: chordRect.left - containerRect.left + chordRect.width / 2,
      y: chordRect.top - containerRect.top - 10
    });
  };

  return (
    <div className="song-viewer" style={{ fontSize: `${fontSize}rem`, position: 'relative' }}>
      <h1>{song.title}</h1>
      {song.artist && <h2 style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '0.5rem' }}>{song.artist}</h2>}
      
      {/* Tooltip con Error Boundary */}
      {activeChord && (
        <div 
          style={{ 
            position: 'absolute',
            left: `${activeChord.x}px`,
            top: `${activeChord.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
            pointerEvents: 'auto' // Permettiamo l'interazione
          }}
        >
          <ChordErrorBoundary>
            <ChordBox chordName={activeChord.name} />
          </ChordErrorBoundary>
          
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
                            padding: '0 4px',
                            borderRadius: '4px',
                            background: activeChord?.name === item.chords ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
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
