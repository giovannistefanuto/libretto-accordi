import React from 'react';
import ChordSheetJS from 'chordsheetjs';

interface SongViewerProps {
  chordProData: string;
  transpose: number;
  fontSize: number;
}

const SongViewer: React.FC<SongViewerProps> = ({ chordProData, transpose, fontSize }) => {
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

  return (
    <div className="song-viewer" style={{ fontSize: `${fontSize}rem` }}>
      <h1>{song.title}</h1>
      {song.artist && <h2 style={{ fontSize: '0.8em', opacity: 0.7 }}>{song.artist}</h2>}
      
      <div className="song-content">
        {transposedSong.paragraphs.map((paragraph, pIdx) => (
          <div key={pIdx} className="paragraph" style={{ marginBottom: '1.5em' }}>
            {paragraph.lines.map((line, lIdx) => (
              <div key={lIdx} className="line" style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.5em' }}>
                {line.items.map((item, iIdx) => {
                  if (item instanceof ChordSheetJS.ChordLyricsPair) {
                    return (
                      <div key={iIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="chord">{item.chords}</span>
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
