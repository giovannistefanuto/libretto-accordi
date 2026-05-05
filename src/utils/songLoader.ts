import ChordSheetJS from 'chordsheetjs';

export interface SongMetadata {
  id: string;
  title: string;
  artist?: string | string[] | null;
  raw: string;
}

export const loadSongs = async (): Promise<SongMetadata[]> => {
  // Utilizziamo la sintassi aggiornata di Vite per importare i file come testo raw
  const modules = import.meta.glob('../songs/*.chordpro', { query: '?raw', import: 'default', eager: true });
  const parser = new ChordSheetJS.ChordProParser();

  const songs: SongMetadata[] = Object.entries(modules).map(([path, raw]) => {
    const song = parser.parse(raw as string);
    const id = path.split('/').pop()?.replace('.chordpro', '') || 'unknown';
    
    return {
      id,
      title: song.title || id,
      artist: song.artist,
      raw: raw as string
    };
  });

  return songs.sort((a, b) => a.title.localeCompare(b.title));
};
