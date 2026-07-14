import { Language } from "./types";
import { speak } from "./api";

export interface Speech {
  // Fires when audio actually starts / ends, so a screen can show a "speaking" pulse.
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechHandle {
  // Stop playback and release the audio object URL. Safe to call more than once.
  stop: () => void;
}

// Fetch Sarvam TTS for `text` and play it. Spoken prompts are always a nice-to-have —
// every failure path is swallowed so a missing/blocked audio never blocks the screen
// (the visible UI is the source of truth). Returns a handle to stop on unmount.
export function playText(text: string, language: Language, hooks: Speech = {}): SpeechHandle {
  let cancelled = false;
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  speak(text, language)
    .then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      audio.onplay = () => hooks.onStart?.();
      audio.onended = () => hooks.onEnd?.();
      // play() can reject under browser autoplay policy — treat as "didn't speak".
      audio.play().catch(() => hooks.onEnd?.());
    })
    .catch(() => {
      // TTS unavailable — the screen text still carries the meaning.
    });

  return {
    stop: () => {
      cancelled = true;
      audio?.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
  };
}
