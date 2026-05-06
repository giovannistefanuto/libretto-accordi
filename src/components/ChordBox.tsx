import React from 'react';
// @ts-ignore
import Chord from '@tombatossals/react-chords/lib/Chord';
// @ts-ignore
import guitarData from '@tombatossals/chords-db/lib/guitar.json';

interface ChordBoxProps {
  chordName: string;
}

// Sostituiamo il componente Chord se dovesse fallire
const SafeChord = (props: any) => {
  try {
    // Verifichiamo che Chord sia una funzione/componente valido
    if (typeof Chord !== 'function' && typeof Chord !== 'object') {
      console.error("Libreria Chord non caricata correttamente");
      return <div style={{ color: 'red', fontSize: '10px' }}>Errore caricamento libreria</div>;
    }
    return <Chord {...props} />;
  } catch (e) {
    console.error("Errore rendering accordo:", e);
    return <div style={{ color: 'red', fontSize: '10px' }}>Errore visualizzazione</div>;
  }
};

const ChordBox: React.FC<ChordBoxProps> = ({ chordName }) => {
  const fallbackDb: any = {
    'C': { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
    'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barres: [2] },
    'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  };

  const findChordData = (name: string) => {
    let cleanName = name
      .replace(/Do/g, 'C').replace(/Re/g, 'D').replace(/Mi/g, 'E')
      .replace(/Fa/g, 'F').replace(/Sol/g, 'G').replace(/La/g, 'A').replace(/Si/g, 'B');
    
    cleanName = cleanName
      .replace(/-/g, 'm')
      .replace(/min/g, 'm')
      .replace(/Δ/g, 'maj7')
      .replace(/#/g, 'sharp')
      .replace(/b/g, 'flat');

    const baseName = cleanName.split('/')[0].trim();

    try {
      const keyMatch = baseName.match(/^([A-G](sharp|flat)?)/);
      if (keyMatch && guitarData && guitarData.chords) {
        const key = keyMatch[0];
        const suffix = baseName.replace(key, '') || 'major';
        const formattedSuffix = suffix === 'm' ? 'minor' : suffix;

        const keyChords = (guitarData.chords as any)[key];
        if (keyChords) {
          const chordMatch = keyChords.find((c: any) => 
            c.suffix.toLowerCase() === formattedSuffix.toLowerCase() ||
            (formattedSuffix === 'major' && c.suffix === '')
          );

          if (chordMatch && chordMatch.positions && chordMatch.positions.length > 0) {
            const pos = chordMatch.positions[0];
            return {
              frets: pos.frets,
              fingers: pos.fingers || [],
              barres: pos.barres || [],
              capo: pos.capo || false,
              baseFret: pos.baseFret || 1
            };
          }
        }
      }
    } catch (e) {
      console.warn("Errore ricerca DB:", e);
    }

    const simpleKey = baseName.charAt(0);
    const isMinor = baseName.includes('m');
    const fallbackKey = isMinor ? `${simpleKey}m` : simpleKey;
    const fallback = fallbackDb[fallbackKey] || fallbackDb['C'];
    
    return {
      frets: fallback.frets,
      fingers: fallback.fingers || [],
      barres: fallback.barres || [],
      capo: false,
      baseFret: 1
    };
  };

  const chordData = findChordData(chordName);

  const MyChord = {
    frets: chordData.frets,
    fingers: chordData.fingers,
    barres: chordData.barres,
    capo: chordData.capo,
    baseFret: chordData.baseFret
  };

  const instrument = {
    strings: 6,
    fretsOnChord: 4,
    name: 'Guitar',
    keys: [],
    tunings: {
      standard: ['E', 'A', 'D', 'G', 'B', 'E']
    }
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()} // Importante per non chiudere il tooltip cliccandoci sopra
      style={{ 
        width: '150px', 
        height: '180px', 
        background: '#fff', 
        borderRadius: '8px', 
        padding: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <SafeChord
        chord={MyChord}
        instrument={instrument}
        lite={false}
      />
      <div style={{ textAlign: 'center', color: '#333', marginTop: '5px', fontWeight: 'bold', fontSize: '14px' }}>
        {chordName}
      </div>
    </div>
  );
};

export default ChordBox;
