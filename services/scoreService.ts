import { ScoreEntry } from '../types.ts';

const HIGH_SCORES_KEY = 'songGuessHighScores';
const MAX_SCORES = 3;

/**
 * Retrieves the list of high scores from localStorage.
 * @returns An array of ScoreEntry objects, sorted by score in descending order.
 */
export const getHighScores = (): ScoreEntry[] => {
  try {
    const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY);
    if (!scoresJSON) {
      return [];
    }
    const scores = JSON.parse(scoresJSON) as ScoreEntry[];
    // Basic validation to prevent runtime errors from malformed data
    if (!Array.isArray(scores) || scores.some(s => typeof s.name !== 'string' || typeof s.score !== 'number')) {
        localStorage.removeItem(HIGH_SCORES_KEY); // Clear corrupted data
        return [];
    }
    return scores;
  } catch (error) {
    console.error('Error reading high scores from localStorage:', error);
    return [];
  }
};

/**
 * Adds a new score to the high scores list if it's high enough.
 * @param name The name of the player.
 * @param score The score achieved by the player.
 */
export const addHighScore = (name: string, score: number): void => {
  if (!name || score < 0) return;

  const newEntry: ScoreEntry = { name: name.trim(), score };
  const highScores = getHighScores();
  
  // To prevent multiple entries for the same player in one game, we check if this exact entry already exists.
  // This helps when the end screen re-renders. A more robust solution might use unique IDs.
  const entryExists = highScores.some(entry => entry.name === newEntry.name && entry.score === newEntry.score);
  if(entryExists) return;

  highScores.push(newEntry);
  highScores.sort((a, b) => b.score - a.score);

  const newHighScores = highScores.slice(0, MAX_SCORES);

  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(newHighScores));
  } catch (error) {
    console.error('Error saving high scores to localStorage:', error);
  }
};
