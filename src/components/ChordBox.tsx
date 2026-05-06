import React from 'react';
// @ts-ignore
import guitarData from '@tombatossals/chords-db/lib/guitar.json';

interface ChordBoxProps {
  chordName: string;
}

// Componente SVG nativo: 100% stabile, zero dipendenze esterne fragili
const ChordDiagramSVG: React.FC<{ 
  frets: number[], 
  fingers: number[], 
  barres: number[], 
  baseFret: number,
  chordName: string 
}> = ({ frets, fingers, barres, baseFret, chordName }) => {
  const width = 140;
  const height = 160;
  const margin = { top: 30, right: 20, bottom: 20, left: 30 };
  const boardWidth = width - margin.left - margin.right;
  const boardHeight = height - margin.top - margin.bottom;
  const numStrings = 6;
  const numFrets = 5;
  const stringSpacing = boardWidth / (numStrings - 1);
  const fretSpacing = boardHeight / numFrets;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: 'white', borderRadius: '8px' }}>
      <text x={width / 2} y={18} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e40af">{chordName}</text>
      
      {/* Indicazione tasto base se > 1 */}
      {baseFret > 1 && (
        <text x={margin.left - 22} y={margin.top + fretSpacing / 2 + 5} fontSize="11" fontWeight="bold" fill="#666">{baseFret}fr</text>
      )}

      {/* Griglia tasti */}
      {[...Array(numFrets + 1)].map((_, i) => (
        <line 
          key={`fret-${i}`}
          x1={margin.left} 
          y1={margin.top + i * fretSpacing} 
          x2={margin.left + boardWidth} 
          y2={margin.top + i * fretSpacing} 
          stroke={i === 0 && baseFret === 1 ? "#000" : "#ddd"} 
          strokeWidth={i === 0 && baseFret === 1 ? 3 : 1}
        />
      ))}

      {/* Griglia corde */}
      {[...Array(numStrings)].map((_, i) => (
        <line 
          key={`string-${i}`}
          x1={margin.left + i * stringSpacing} 
          y1={margin.top} 
          x2={margin.left + i * stringSpacing} 
          y2={margin.top + boardHeight} 
          stroke="#ddd" 
          strokeWidth="1"
        />
      ))}

      {/* Mute (X) e Open (O) */}
      {frets.map((fret, i) => {
        const x = margin.left + i * stringSpacing;
        if (fret === -1) {
          return <text key={`mute-${i}`} x={x} y={margin.top - 6} textAnchor="middle" fontSize="12" fill="#ef4444" fontWeight="bold">×</text>;
        } else if (fret === 0) {
          return <circle key={`open-${i}`} cx={x} cy={margin.top - 8} r="3" fill="none" stroke="#10b981" strokeWidth="1.5" />;
        }
        return null;
      })}

      {/* Disegno Barre (Semplificato: una linea spessa se il database lo indica) */}
      {barres && barres.length > 0 && barres.map((barreFret, idx) => {
        const y = margin.top + (barreFret - 0.5) * fretSpacing;
        // Troviamo la prima e l'ultima corda con quel tasto per disegnare il barre
        const stringsWithFret = frets.map((f, i) => f === barreFret ? i : -1).filter(i => i !== -1);
        if (stringsWithFret.length > 1) {
          const firstX = margin.left + stringsWithFret[0] * stringSpacing;
          const lastX = margin.left + stringsWithFret[stringsWithFret.length - 1] * stringSpacing;
          return <line key={`barre-${idx}`} x1={firstX} y1={y} x2={lastX} y2={y} stroke="#2563eb" strokeWidth="8" strokeLinecap="round" opacity="0.6" />;
        }
        return null;
      })}

      {/* Dita (Pallini con numero) */}
      {frets.map((fret, i) => {
        if (fret > 0) {
          const x = margin.left + i * stringSpacing;
          const y = margin.top + (fret - 0.5) * fretSpacing;
          return (
            <g key={`finger-${i}`}>
              <circle cx={x} cy={y} r="7" fill="#2563eb" />
              {fingers && fingers[i] > 0 && (
                <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{fingers[i]}</text>
              )}
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
};

const ChordBox: React.FC<ChordBoxProps> = ({ chordName }) => {
  // Database di emergenza se tutto il resto fallisce
  const fallbackDb: any = {
    'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
    'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },
    'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  };

  const getChordData = () => {
    try {
      // 1. Normalizzazione
      let cleanName = chordName
        .replace(/Do/g, 'C').replace(/Re/g, 'D').replace(/Mi/g, 'E')
        .replace(/Fa/g, 'F').replace(/Sol/g, 'G').replace(/La/g, 'A').replace(/Si/g, 'B')
        .replace(/-/g, 'm').replace(/min/g, 'm').replace(/Δ/g, 'maj7');
      
      const baseName = cleanName.split('/')[0].trim();
      
      // 2. Mappatura chiavi per chords-db (usa # e b)
      const keyMatch = baseName.match(/^([A-G][#b]?)/);
      if (keyMatch && guitarData?.chords) {
        let key = keyMatch[0];
        // Adattamento per b/flat
        if (key === 'Db') key = 'C#'; // Normalizziamo su una delle due per il DB
        if (key === 'Gb') key = 'F#';
        
        const suffix = baseName.replace(key, '') || 'major';
        const formattedSuffix = suffix === 'm' ? 'minor' : (suffix === '7' ? '7' : suffix);

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
              baseFret: pos.baseFret || 1
            };
          }
        }
      }

      // 3. Fallback
      const simpleKey = baseName.charAt(0);
      const isMinor = baseName.includes('m');
      const fb = fallbackDb[isMinor ? `${simpleKey}m` : simpleKey] || fallbackDb['C'];
      return { ...fb, barres: [], baseFret: 1 };
    } catch (e) {
      return { ...fallbackDb['C'], barres: [], baseFret: 1 };
    }
  };

  const data = getChordData();

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      style={{ 
        width: '140px', 
        height: '160px', 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '0',
        overflow: 'hidden'
      }}
    >
      <ChordDiagramSVG 
        frets={data.frets}
        fingers={data.fingers}
        barres={data.barres}
        baseFret={data.baseFret}
        chordName={chordName}
      />
    </div>
  );
};

export default ChordBox;
