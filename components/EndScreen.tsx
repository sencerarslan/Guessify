
import React from 'react';
import { RefreshIcon } from './shared/Icons.tsx';
import { ScoreEntry } from '../types.ts';

interface EndScreenProps {
  score: number;
  onRestart: () => void;
  highScores: ScoreEntry[];
  playerName: string;
}

const EndScreen: React.FC<EndScreenProps> = ({ score, onRestart, highScores, playerName }) => {
  // Find if the current player's score is in the top scores to highlight it.
  // This handles the case where the player might have the same score as another but a different name.
  const isPlayerInHighScores = highScores.some(entry => entry.name === playerName && entry.score === score);

  return (
    <div className="text-center w-full max-w-2xl flex flex-col items-center justify-center animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-300 mb-2">Oyun Bitti!</h2>
      <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
        {score} Puan
      </p>

      {/* High Score Table */}
      {highScores.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <h3 className="text-2xl font-bold text-yellow-400 mb-3">🏆 En İyi 3 Oyuncu</h3>
          <div className="bg-black/30 rounded-lg p-4 border border-fuchsia-700/50">
            <ol className="space-y-2">
              {highScores.map((entry, index) => {
                 const isCurrentPlayer = entry.name === playerName && entry.score === score && isPlayerInHighScores;
                 return (
                    <li 
                      key={index} 
                      className={`flex justify-between items-center text-lg p-2 rounded transition-all duration-300 ${isCurrentPlayer ? 'bg-yellow-400/30 ring-2 ring-yellow-400' : 'bg-white/5'}`}
                    >
                      <span className={`font-semibold ${isCurrentPlayer ? 'text-yellow-200' : 'text-cyan-300'}`}>
                        {index + 1}. {entry.name}
                      </span>
                      <span className={`font-bold ${isCurrentPlayer ? 'text-white' : 'text-yellow-400'}`}>{entry.score} Puan</span>
                    </li>
                 );
              })}
            </ol>
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="flex items-center gap-3 bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-cyan-800/40 transform hover:scale-105 transition-all duration-300 ease-in-out text-2xl"
      >
        <RefreshIcon />
        Tekrar Oyna
      </button>
    </div>
  );
};

export default EndScreen;