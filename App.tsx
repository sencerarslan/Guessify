import React, { useState, useCallback, useEffect, useRef } from "react";
import { GameStatus, QuizRoundData, QuizItem, ScoreEntry } from "./types.ts";
import StartScreen from "./components/StartScreen.tsx";
import GameScreen from "./components/GameScreen.tsx";
import EndScreen from "./components/EndScreen.tsx";
import { findSongMedia } from "./services/itunesService.ts";
import Spinner from "./components/shared/Spinner.tsx";
import { FastAverageColor } from "fast-average-color"; 
import { getHighScores, addHighScore } from "./services/scoreService.ts";
import { songs } from "./data/songs";

const MAX_LOAD_ATTEMPTS = 5;
const TOTAL_ROUNDS = 5;

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Start);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [playerName, setPlayerName] = useState<string>("");
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [currentQuizItem, setCurrentQuizItem] = useState<QuizRoundData | null>(
    null
  );
  const [dominantColor, setDominantColor] = useState<string>("#f9a8d4"); // Default fuchsia
    const [usedSongs, setUsedSongs] = useState<QuizItem[]>([]);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighScores(getHighScores());
  }, []);

  useEffect(() => {
    const fac = new FastAverageColor();
    const body = document.body;
    const defaultBg = "#111827";
    const defaultColor = "#f9a8d4";

    if (gameStatus === GameStatus.Playing && currentQuizItem?.imageUrl) {
      fac
        .getColorAsync(currentQuizItem.imageUrl, { crossOrigin: "anonymous" })
        .then((color) => {
          if (color) {
            setDominantColor(color.hex);
            // Creates a more vibrant glow of the dominant color from the center.
          } else {
            setDominantColor(defaultColor);
            body.style.background = defaultBg;
          }
        })
        .catch((e) => {
          console.error("Error getting average color:", e);
          setDominantColor(defaultColor);
          body.style.background = defaultBg;
        });
    } else {
      // Reset to default style for start/end/loading screens
      setDominantColor(defaultColor);
      body.style.background = defaultBg;
    }

    return () => {
      fac.destroy();
    };
  }, [gameStatus, currentQuizItem]);

  const handleRhythmUpdate = useCallback((shadow: string) => {
    if (mainContainerRef.current) {
      mainContainerRef.current.style.boxShadow = shadow;
    }
  }, []);

  useEffect(() => {
    if (gameStatus !== GameStatus.Playing) {
      handleRhythmUpdate("none");
    }
  }, [gameStatus, handleRhythmUpdate]);

  const loadNewQuiz = useCallback(async () => {
    setGameStatus(GameStatus.Loading);

    let availableSongs = songs.filter(
      (song) => !usedSongs.find((used) => used.songTitle === song.songTitle)
    );
    if (availableSongs.length === 0) {
      console.log("All songs used. Resetting list.");
      availableSongs = [...songs];
      setUsedSongs([]);
    }

    let foundSong = false;
    let attempts = 0;

    while (
      !foundSong &&
      attempts < MAX_LOAD_ATTEMPTS &&
      availableSongs.length > 0
    ) {
      attempts++;
      const randomIndex = Math.floor(Math.random() * availableSongs.length);
      const quizData = availableSongs[randomIndex];
      // Remove the tried song from the list for this loading session to avoid retrying it if it fails
      availableSongs.splice(randomIndex, 1);

      try {
        const media = await findSongMedia(quizData.songTitle, quizData.artist);

        if (media) {
          setCurrentQuizItem({ ...quizData, ...media });
          setUsedSongs((prev) => [...prev, quizData]);
          setGameStatus(GameStatus.Playing);
          foundSong = true;
        } else {
          console.warn(
            `Could not find media for "${quizData.songTitle}". Attempt ${attempts}. Retrying with another song...`
          );
        }
      } catch (error) {
        console.error(
          `Attempt ${attempts} failed to load quiz data for "${quizData.songTitle}":`,
          error
        );
      }
    }

    if (!foundSong) {
      alert("Yeni bir şarkı yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      setGameStatus(GameStatus.Start);
    }
  }, [usedSongs]);

  const handleGameStart = (name: string) => {
    setPlayerName(name);
    setScore(0);
    setRound(1);
    loadNewQuiz();
  };

  const handleRestart = () => {
    setGameStatus(GameStatus.Start);
  };

  const handleNextRound = (roundScore: number) => {
    const newScore = score + roundScore;
    setScore(newScore);

    if (round < TOTAL_ROUNDS) {
      setRound((prev) => prev + 1);
      loadNewQuiz();
    } else {
      addHighScore(playerName, newScore);
      setHighScores(getHighScores());
      setGameStatus(GameStatus.Finished);
    }
  };

  const renderContent = () => {
    switch (gameStatus) {
      case GameStatus.Start:
        return <StartScreen onStart={handleGameStart} highScores={highScores} />;
      case GameStatus.Loading:
        return (
          <div className="w-full h-full flex flex-col justify-center items-center">
            <Spinner />
            <p className="text-xl text-fuchsia-300 mt-4">
              Yeni şarkı aranıyor... (Tur {round}/{TOTAL_ROUNDS})
            </p>
          </div>
        );
      case GameStatus.Playing:
        return currentQuizItem ? (
          <GameScreen
            quizItem={currentQuizItem}
            onNextRound={handleNextRound}
            totalScore={score}
            currentRound={round}
            totalRounds={TOTAL_ROUNDS}
            dominantColor={dominantColor}
            onRhythmUpdate={handleRhythmUpdate}
          />
        ) : null;
      case GameStatus.Finished:
        return (
          <EndScreen
            score={score}
            onRestart={handleRestart}
            highScores={highScores}
            playerName={playerName}
          />
        );
      default:
        return <StartScreen onStart={handleGameStart} highScores={highScores} />;
    }
  };

  return (
    <main className="text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-fuchsia-500 selection:text-white">
      <div
        ref={mainContainerRef}
        className="w-full max-w-4xl h-[80vh] min-h-[600px] bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl shadow-2xl shadow-fuchsia-900/50 border border-fuchsia-800/50 flex flex-col items-center justify-center p-6 transition-shadow duration-100"
      >
        {renderContent()}
      </div>
    </main>
  );
};

export default App;