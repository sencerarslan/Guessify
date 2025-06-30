import React, { useState, useEffect, useRef, useCallback } from "react";
import { QuizRoundData } from "../types.ts";
import {
  GAME_DURATION_SECONDS,
  EFFECT_UPDATE_INTERVAL_SECONDS,
  BLUR_LEVELS,
  GRAY_LEVELS,
  SONG_VOLUME_LEVELS,
  NOISE_VOLUME_LEVELS,
  STATIC_NOISE_URL,
  STATIC_NOISE_URL2,
  ECHO_DELAY_LEVELS,
  ECHO_FEEDBACK_LEVELS,
  ECHO_WET_LEVELS,
  ECHO_DRY_LEVELS,
} from "../constants.ts";

interface GameScreenProps {
  quizItem: QuizRoundData;
  onNextRound: (score: number) => void;
  totalScore: number;
  currentRound: number;
  totalRounds: number;
  dominantColor: string;
  onRhythmUpdate: (shadow: string) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  quizItem,
  onNextRound,
  totalScore,
  currentRound,
  totalRounds,
  dominantColor,
  onRhythmUpdate,
}) => {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [effectLevel, setEffectLevel] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [playbackRates, setPlaybackRates] = useState<number[]>([
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
  ]);

  const songAudioRef = useRef<HTMLAudioElement>(null);
  const noiseAudioRef = useRef<HTMLAudioElement>(null);
  const noiseAudioRef2 = useRef<HTMLAudioElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Expanded refs for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackGainNodeRef = useRef<GainNode | null>(null);
  const wetGainNodeRef = useRef<GainNode | null>(null);
  const dryGainNodeRef = useRef<GainNode | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const options = [quizItem.songTitle, ...quizItem.distractors];
    setShuffledOptions(options.sort(() => Math.random() - 0.5));

    const startRate = Math.random() < 0.5 ? 0.4 : 1.7; // More extreme pitch/rate
    const rates = Array(6)
      .fill(0)
      .map((_, i) => startRate + (1.0 - startRate) * (i / 5));
    setPlaybackRates(rates);

    setTimeLeft(GAME_DURATION_SECONDS);
    setEffectLevel(0);
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (
      songAudioRef.current &&
      noiseAudioRef.current &&
      noiseAudioRef2.current
    ) {
      songAudioRef.current.volume = SONG_VOLUME_LEVELS[0];
      songAudioRef.current.playbackRate = rates[0];
      noiseAudioRef.current.volume = NOISE_VOLUME_LEVELS[0];
      noiseAudioRef2.current.volume = NOISE_VOLUME_LEVELS[0];
      songAudioRef.current.currentTime = 0;
      noiseAudioRef.current.currentTime = 0;
      noiseAudioRef2.current.currentTime = 0;
      songAudioRef.current
        .play()
        .catch((e) => console.error("Song audio play failed:", e));
      noiseAudioRef.current
        .play()
        .catch((e) => console.error("Noise audio play failed:", e));
      noiseAudioRef2.current
        .play()
        .catch((e) => console.error("Noise audio play failed:", e));
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      songAudioRef.current?.pause();
      noiseAudioRef.current?.pause();
      noiseAudioRef2.current?.pause();
      onRhythmUpdate("none");
    };
  }, [quizItem, onRhythmUpdate]);

  // Combined effect for audio graph setup and visual glow animation
  useEffect(() => {
    if (!songAudioRef.current || isAnswered) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      onRhythmUpdate("none");
      return;
    }

    const audioEl = songAudioRef.current;

    const setupAudio = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser.", e);
          return false;
        }
      }
      const audioContext = audioContextRef.current;
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      // Build the static part of the graph ONCE
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        delayNodeRef.current = audioContext.createDelay(5.0);
        feedbackGainNodeRef.current = audioContext.createGain();
        wetGainNodeRef.current = audioContext.createGain();
        dryGainNodeRef.current = audioContext.createGain();

        const analyser = analyserRef.current;
        const dryGain = dryGainNodeRef.current;
        const wetGain = wetGainNodeRef.current;
        const delay = delayNodeRef.current;
        const feedbackGain = feedbackGainNodeRef.current;
        
        // Connect static parts of the graph
        analyser.connect(dryGain);
        dryGain.connect(audioContext.destination);
        analyser.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(audioContext.destination);
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
      }
      
      // Connect the dynamic source if it's new
      if (!sourceRef.current || sourceRef.current.mediaElement !== audioEl) {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        sourceRef.current = audioContext.createMediaElementSource(audioEl);
        sourceRef.current.connect(analyserRef.current);
      }
      return true;
    };

    const animateGlow = () => {
      if (!analyserRef.current || isAnswered) {
        if (animationFrameId.current)
          cancelAnimationFrame(animationFrameId.current);
        onRhythmUpdate("none");
        return;
      }

      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const bass = (dataArray[2] + dataArray[3] + dataArray[4]) / 2.5;
      const intensity = Math.pow(bass / 255, 3) * 2.5;

      const glowSize = 10 + 60 * intensity;
      const glowSpread = 4 + 8 * intensity;

      const colorWithOpacity = `${dominantColor}6b`;
      const shadowStyle = `0 0 ${glowSize}px ${glowSpread}px ${colorWithOpacity}`;

      onRhythmUpdate(shadowStyle);
      animationFrameId.current = requestAnimationFrame(animateGlow);
    };

    if (setupAudio()) {
      animateGlow();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      onRhythmUpdate("none");
    };
  }, [isAnswered, dominantColor, quizItem.audioUrl, onRhythmUpdate]);

  const handleAnswer = useCallback(
    (answer: string | null) => {
      if (isAnswered) return;

      setIsAnswered(true);
      setSelectedAnswer(answer);
      onRhythmUpdate("none");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (songAudioRef.current) {
        songAudioRef.current.playbackRate = 1.0;
      }

      setEffectLevel(BLUR_LEVELS.length - 1);

      const score = answer === quizItem.songTitle ? timeLeft : 0;

      setTimeout(() => {
        onNextRound(score);
      }, 3000);
    },
    [isAnswered, quizItem.songTitle, timeLeft, onNextRound, onRhythmUpdate]
  );

  useEffect(() => {
    if (isAnswered) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    if (timeLeft <= 0) {
      handleAnswer(null); // Timeout
      return;
    }

    if (imageContainerRef.current) {
      const progress = (timeLeft / GAME_DURATION_SECONDS) * 360;
      let color = "#22c55e";
      if (timeLeft <= 20) {
        color = "#ef4444";
      } else if (timeLeft <= 40) {
        color = "#eab308";
      }
      imageContainerRef.current.style.background = `conic-gradient(${color} ${progress}deg, rgba(255, 255, 255, 0.15) 0deg)`;
    }

    const secondsPassed = GAME_DURATION_SECONDS - timeLeft;
    if (
      secondsPassed > 0 &&
      secondsPassed % EFFECT_UPDATE_INTERVAL_SECONDS === 0
    ) {
      const newLevel = Math.floor(
        secondsPassed / EFFECT_UPDATE_INTERVAL_SECONDS
      );
      setEffectLevel(Math.min(newLevel, BLUR_LEVELS.length - 1));

      if (timerRef.current) {
        timerRef.current.classList.remove("animate-bounce-short");
        void timerRef.current.offsetWidth;
        timerRef.current.classList.add("animate-bounce-short");
      }
    }
  }, [timeLeft, isAnswered, handleAnswer]);

  // This effect updates all audio parameters based on the current effect level.
  useEffect(() => {
    // HTMLAudioElement properties
    if (songAudioRef.current) {
      songAudioRef.current.volume = SONG_VOLUME_LEVELS[effectLevel];
      if (!isAnswered) {
        songAudioRef.current.playbackRate = playbackRates[effectLevel];
      }
    }
    if (noiseAudioRef.current) {
      noiseAudioRef.current.volume = NOISE_VOLUME_LEVELS[effectLevel];
    }
    if (noiseAudioRef2.current) {
      noiseAudioRef2.current.volume = NOISE_VOLUME_LEVELS[effectLevel];
    }

    // Web Audio API effect parameters
    if (audioContextRef.current && audioContextRef.current.state === "running") {
      const isFinished = isAnswered;
      const context = audioContextRef.current;
      const now = context.currentTime;
      const rampTime = 0.5; // Smooth transition time

      if (delayNodeRef.current) {
        delayNodeRef.current.delayTime.setTargetAtTime(
          isFinished ? 0 : ECHO_DELAY_LEVELS[effectLevel],
          now,
          rampTime
        );
      }
      if (feedbackGainNodeRef.current) {
        feedbackGainNodeRef.current.gain.setTargetAtTime(
          isFinished ? 0 : ECHO_FEEDBACK_LEVELS[effectLevel],
          now,
          rampTime
        );
      }
      if (wetGainNodeRef.current) {
        wetGainNodeRef.current.gain.setTargetAtTime(
          isFinished ? 0 : ECHO_WET_LEVELS[effectLevel],
          now,
          rampTime
        );
      }
      if (dryGainNodeRef.current) {
        dryGainNodeRef.current.gain.setTargetAtTime(
          isFinished ? 1.0 : ECHO_DRY_LEVELS[effectLevel],
          now,
          rampTime
        );
      }
    }
  }, [effectLevel, isAnswered, playbackRates]);

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return "bg-gray-700 hover:bg-fuchsia-800";
    }
    if (option === quizItem.songTitle) {
      return "bg-green-600 animate-pulse-correct";
    }
    if (option === selectedAnswer) {
      return "bg-red-600";
    }
    return "bg-gray-800 opacity-50";
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <audio
        ref={songAudioRef}
        src={quizItem.audioUrl}
        loop
        crossOrigin="anonymous"
      />
      <audio ref={noiseAudioRef} src={STATIC_NOISE_URL} loop />
      <audio ref={noiseAudioRef2} src={STATIC_NOISE_URL2} loop />

      <div className="w-full flex justify-between items-center text-2xl font-bold p-2 bg-black/30 rounded-t-xl">
        <div className="text-cyan-400">Puan: {totalScore}</div>
        <div className="text-purple-400">
          Tur: {currentRound}/{totalRounds}
        </div>
        <div
          ref={timerRef}
          className={`font-mono transition-colors duration-500 ${
            timeLeft <= 30 ? "text-red-500 font-bold" : "text-yellow-400"
          }`}
        >
          Süre: {timeLeft}s
        </div>
      </div>

      <div
        ref={imageContainerRef}
        className="relative w-full aspect-video max-w-2xl my-4 rounded-lg"
        style={{ padding: "6px" }}
      >
        <div className="relative w-full h-full rounded-md overflow-hidden bg-gray-800">
          <img
            src={quizItem.imageUrl}
            alt={`"${quizItem.songTitle}" için kapak resmi`}
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
            style={{
              filter: `blur(${
                isAnswered ? 0 : BLUR_LEVELS[effectLevel]
              }px) grayscale(${isAnswered ? 0 : GRAY_LEVELS[effectLevel]})`,
            }}
          />
          <div
            className="absolute inset-0 bg-black transition-opacity duration-1000 ease-in-out pointer-events-none"
            style={{
              opacity: isAnswered ? 0 : timeLeft * -1 * 100,
            }}
          ></div>
          {isAnswered && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-center animate-fade-in">
              <p className="text-2xl font-bold text-green-400">
                {quizItem.songTitle}
              </p>
              <p className="text-lg text-gray-300">{quizItem.artist}</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {shuffledOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={isAnswered}
            className={`p-4 rounded-lg font-semibold text-lg text-white transition-all duration-300 disabled:cursor-not-allowed ${getButtonClass(
              option
            )}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameScreen;
