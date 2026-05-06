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
    // 1. Normalizzazione dei nomi italiani -> internazionali
    let cleanName = name
      .replace(/Do/g, 'C').replace(/Re/g, 'D').replace(/Mi/g, 'E')
      .replace(/Fa/g, 'F').replace(/Sol/g, 'G').replace(/La/g, 'A').replace(/Si/g, 'B');
    
    // 2. Normalizzazione simboli (es: - -> m, min -> m, Δ -> maj7)
    cleanName = cleanName
      .replace(/-/g, 'm')
      .replace(/min/g, 'm')
      .replace(/maj/g, 'maj')
      .replace(/Δ/g, 'maj7')
      .replace(/#/g, '#')
      .replace(/b/g, 'b');

    // 3. Gestione del basso (es: C/G -> C)
    const baseName = cleanName.split('/')[0].trim();

    // 4. Ricerca nel database professionale
    try {
      // Cerchiamo una corrispondenza esatta
      let dbMatch = guitarDb.find((c: any) => c.name.toLowerCase() === baseName.toLowerCase());
      
      // Se non trovato, proviamo a cercare una variante (es: C7 invece di C 7)
      if (!dbMatch) {
        dbMatch = guitarDb.find((c: any) => c.name.replace(/\s+/g, '').toLowerCase() === baseName.toLowerCase());
      }

      if (dbMatch && dbMatch.shapes && dbMatch.shapes.length > 0) {
        const shape = dbMatch.shapes[0];
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

    // 5. Fallback sul DB interno o logica di base
    const fallbackBase = baseName.replace(/7|maj|m|sus|add/g, '').split(' ')[0] || 'C';
    const fallback = fallbackDb[baseName] || fallbackDb[fallbackBase] || fallbackDb['C'];
    
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
