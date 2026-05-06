import React from 'react';
// @ts-ignore
import ChordImport from '@tombatossals/react-chords/lib/Chord';
// @ts-ignore
import guitarData from '@tombatossals/chords-db/lib/guitar.json';

// Gestione robusta dell'importazione (Vite/ESM vs CommonJS)
const Chord = (ChordImport as any).default || ChordImport;

interface ChordBoxProps {
  chordName: string;
}

const SafeChord = (props: any) => {
  try {
    if (!Chord || (typeof Chord !== 'function' && typeof Chord !== 'object')) {
      return <div style={{ color: 'red', fontSize: '10px' }}>Libreria non pronta</div>;
    }
    return <Chord {...props} />;
  } catch (e) {
    return <div style={{ color: 'red', fontSize: '10px' }}>Errore rendering</div>;
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
      .replace(/-/g, 'm').replace(/min/g, 'm').replace(/Δ/g, 'maj7').replace(/#/g, 'sharp').replace(/b/g, 'flat');

    const baseName = cleanName.split('/')[0].trim();

    try {
      const keyMatch = baseName.match(/^([A-G](sharp|flat)?)/);
      if (keyMatch && guitarData?.chords) {
        const key = keyMatch[0];
        const suffix = baseName.replace(key, '') || 'major';
        const formattedSuffix = suffix === 'm' ? 'minor' : suffix;

        const keyChords = (guitarData.chords as any)[key];
        if (keyChords) {
          const chordMatch = keyChords.find((c: any) => 
            c.suffix.toLowerCase() === formattedSuffix.toLowerCase() ||
            (formattedSuffix === 'major' && c.suffix === '')
          );

          if (chordMatch?.positions?.length > 0) {
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
    } catch (e) {}

    const simpleKey = baseName.charAt(0);
    const isMinor = baseName.includes('m');
    const fallback = fallbackDb[isMinor ? `${simpleKey}m` : simpleKey] || fallbackDb['C'];
    return { ...fallback, capo: false, baseFret: 1 };
  };

  const chordData = findChordData(chordName);

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      style={{ 
        width: '150px', 
        height: '180px', 
        background: '#fff', 
        borderRadius: '8px', 
        padding: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <SafeChord
        chord={{
          frets: chordData.frets,
          fingers: chordData.fingers,
          barres: chordData.barres,
          capo: chordData.capo,
          baseFret: chordData.baseFret
        }}
        instrument={{
          strings: 6,
          fretsOnChord: 4,
          name: 'Guitar',
          keys: [],
          tunings: { standard: ['E', 'A', 'D', 'G', 'B', 'E'] }
        }}
        lite={false}
      />
      <div style={{ textAlign: 'center', color: '#333', marginTop: '5px', fontWeight: 'bold', fontSize: '14px' }}>
        {chordName}
      </div>
    </div>
  );
};

export default ChordBox;
