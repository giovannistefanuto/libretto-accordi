import React from 'react';
// @ts-ignore
import Chord from '@tombatossals/react-chords/lib/Chord';
// @ts-ignore
import guitarDb from 'guitar-chord-definitions';

interface ChordBoxProps {
  chordName: string;
}

const ChordBox: React.FC<ChordBoxProps> = ({ chordName }) => {
  // Database di fallback semplificato
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

  // Funzione per cercare nel database professionale
  const findChordData = (name: string) => {
    // Normalizziamo il nome (es: Do -> C, Mi- -> Em)
    let cleanName = name
      .replace('Do', 'C').replace('Re', 'D').replace('Mi', 'E')
      .replace('Fa', 'F').replace('Sol', 'G').replace('La', 'A').replace('Si', 'B')
      .replace('-', 'm').replace('min', 'm');
    
    // Rimuoviamo il basso (C/G -> C)
    const baseName = cleanName.split('/')[0];

    // Proviamo a cercare nel database guitar-chord-definitions
    try {
      const dbMatch = guitarDb.find((c: any) => c.name === baseName || c.name === baseName.toUpperCase());
      if (dbMatch && dbMatch.shapes && dbMatch.shapes.length > 0) {
        const shape = dbMatch.shapes[0]; // Prendiamo la prima posizione (solitamente la più comune)
        return {
          frets: shape.frets,
          fingers: shape.fingers || [],
          barres: shape.barres || [],
          capo: shape.capo || false
        };
      }
    } catch (e) {
      console.warn("Errore nel DB accordi:", e);
    }

    // Fallback sul DB interno se non trovato
    const fallback = fallbackDb[baseName] || fallbackDb['C'];
    return {
      frets: fallback.frets,
      fingers: fallback.fingers || [],
      barres: fallback.barres || [],
      capo: fallback.capo || false
    };
  };

  const chordData = findChordData(chordName);

  const MyChord = {
    frets: chordData.frets,
    fingers: chordData.fingers,
    barres: chordData.barres,
    capo: chordData.capo,
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
    <div style={{ width: '150px', height: '180px', background: '#fff', borderRadius: '8px', padding: '10px' }}>
      <Chord
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
