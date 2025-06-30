export const GAME_DURATION_SECONDS = 60;
export const EFFECT_UPDATE_INTERVAL_SECONDS = 10;

// Visual Effects
export const BLUR_LEVELS = [25, 20, 15, 10, 5, 0];
export const GRAY_LEVELS = [1, 0.8, 0.6, 0.4, 0.2, 0];

// Audio Effects
export const SONG_VOLUME_LEVELS = [0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0];
export const NOISE_VOLUME_LEVELS = [0.12, 0.1, 0.08, 0.06, 0.04, 0.0];

// Echo/Delay Effect Levels (Web Audio API)
export const ECHO_DELAY_LEVELS = [0.4, 0.3, 0.2, 0.1, 0.05, 0];
export const ECHO_FEEDBACK_LEVELS = [0.45, 0.35, 0.25, 0.15, 0.05, 0]; // Gain for feedback loop
export const ECHO_WET_LEVELS = [0.5, 0.4, 0.3, 0.2, 0.1, 0]; // Mix for echo signal
export const ECHO_DRY_LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]; // Mix for original signal

// Noise files
export const STATIC_NOISE_URL =
  "https://www.soundjay.com/human/crowd-talking-1.mp3";
export const STATIC_NOISE_URL2 =
  "https://www.soundjay.com/nature/ocean-wave-1.mp3";
