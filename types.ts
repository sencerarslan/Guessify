export enum GameStatus {
  Start,
  Loading,
  Playing,
  Finished,
}

export interface QuizItem {
  songTitle: string;
  artist: string;
  distractors: string[];
}

export interface SongMedia {
  audioUrl: string;
  imageUrl: string;
}

export type QuizRoundData = QuizItem & SongMedia;

export interface ScoreEntry {
  name: string;
  score: number;
}
