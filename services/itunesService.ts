
import { SongMedia } from '../types.ts';

/**
 * Searches the iTunes API for a song and returns its media URLs.
 * @param songTitle The title of the song.
 * @param artist The artist of the song.
 * @returns A promise that resolves to a SongMedia object or null if not found.
 */
export const findSongMedia = async (songTitle: string, artist: string): Promise<SongMedia | null> => {
  const searchTerm = encodeURIComponent(`${songTitle} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1&country=TR`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`iTunes API request failed with status: ${response.status}`);
      return null;
    }
    const data = await response.json();
    
    if (data.resultCount > 0 && data.results[0].previewUrl) {
      const song = data.results[0];
      // Get a higher resolution artwork image by replacing '100x100' with '600x600'.
      const imageUrl = song.artworkUrl100.replace('100x100', '600x600');
      
      return {
        audioUrl: song.previewUrl,
        imageUrl: imageUrl,
      };
    }
    
    console.warn(`No results with preview found on iTunes for: "${songTitle}" by ${artist}`);
    return null;
  } catch (error) {
    console.error("Error fetching from iTunes API:", error);
    return null;
  }
};