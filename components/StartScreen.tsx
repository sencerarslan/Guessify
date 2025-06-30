
import React, { useState } from 'react';
import { MusicNoteIcon } from './shared/Icons.tsx';
import { ScoreEntry } from '../types.ts';

interface StartScreenProps {
  onStart: (name: string) => void;
  highScores: ScoreEntry[];
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, highScores }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="text-center w-full max-w-2xl flex flex-col items-center justify-center animate-fade-in">
      <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500 mb-4">
        Şarkı Tahmin Oyunu
      </h1>
      <p className="text-lg text-gray-300 max-w-2xl mb-8">
        Bulanıklaşan bir klip ve parazitli bir sesle şarkıyı tahmin edebilir misin? Her 10 saniyede bir görüntü ve ses netleşecek. Ne kadar hızlı olursan o kadar çok puan kazanırsın!
      </p>
      
      {/* High Score Table */}
      {highScores.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <h3 className="text-2xl font-bold text-yellow-400 mb-3">🏆 En İyi 3 Oyuncu</h3>
          <div className="bg-black/30 rounded-lg p-4 border border-fuchsia-700/50">
            <ol className="space-y-2">
              {highScores.map((entry, index) => (
                <li key={`${entry.name}-${index}`} className="flex justify-between items-center text-lg p-2 rounded bg-white/5">
                  <span className="font-semibold text-cyan-300">
                    {index + 1}. {entry.name}
                  </span>
                  <span className="font-bold text-yellow-400">{entry.score} Puan</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Name Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adınızı girin..."
          maxLength={15}
          className="w-full bg-gray-800 text-white placeholder-gray-500 text-center text-xl px-4 py-3 rounded-full border-2 border-fuchsia-700 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all"
          required
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex items-center gap-3 bg-gradient-to-br from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-fuchsia-800/40 transform hover:scale-105 transition-all duration-300 ease-in-out text-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <MusicNoteIcon />
          Oyuna Başla
        </button>
      </form>
    </div>
  );
};

export default StartScreen;