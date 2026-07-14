"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Mic } from "lucide-react";
import { CommandResult, Decision, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { parseCommand, transcribe } from "@/lib/api";
import { recordWithAutoStop, RecordingSession } from "@/lib/recorder";

type State = "idle" | "recording" | "processing" | "error";

// Tap-to-answer mic for decision screens. The farmer taps it, speaks a short answer, and
// we hand the parsed intent back via onResult. The screen's own buttons stay as a fallback,
// so this never has to be the only way forward — an unclear answer just resets to idle.
export default function AnswerMic({
  language,
  decision,
  choices,
  onResult,
  disabled = false,
}: {
  language: Language;
  decision: Decision;
  choices?: string[];
  onResult: (result: CommandResult) => void;
  disabled?: boolean;
}) {
  const t = copy[language];
  const [state, setState] = useState<State>("idle");
  const [level, setLevel] = useState(0);
  const sessionRef = useRef<RecordingSession | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionRef.current?.cancel();
    };
  }, []);

  function start() {
    if (state === "recording" || state === "processing" || disabled) return;
    setState("recording");
    setLevel(0);

    const session = recordWithAutoStop({
      onLevel: (l) => mountedRef.current && setLevel(l),
    });
    sessionRef.current = session;

    session.done
      .then(async (audio) => {
        if (!mountedRef.current) return;
        setState("processing");
        try {
          const { transcript } = await transcribe(audio, language);
          const result = await parseCommand(transcript, language, decision, choices);
          if (!mountedRef.current) return;
          if (result.intent === "unknown") {
            setState("error");
          } else {
            setState("idle");
            onResult(result);
          }
        } catch {
          if (mountedRef.current) setState("error");
        }
      })
      .catch(() => {
        if (mountedRef.current) setState("error");
      });
  }

  const recording = state === "recording";
  const processing = state === "processing";
  // Grow the ring with live mic loudness so the farmer sees they're being heard.
  const ringScale = 1 + (recording ? level * 0.35 : 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={start}
        disabled={disabled || processing}
        aria-label={t.tapToAnswer}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-[0_3px_12px_rgba(232,135,30,0.35)] transition-transform duration-150 hover:bg-accent-dark active:scale-95 disabled:opacity-60"
      >
        {recording && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-accent/30 transition-transform duration-75"
            style={{ transform: `scale(${ringScale})` }}
          />
        )}
        {processing ? (
          <Loader2 size={28} className="animate-spin" />
        ) : state === "error" ? (
          <AlertCircle size={28} />
        ) : (
          <Mic size={28} className="relative" />
        )}
      </button>
      <p
        className={`min-h-6 text-center text-base font-medium ${
          state === "error" ? "text-error" : "text-text-secondary"
        }`}
      >
        {recording
          ? t.listening
          : processing
            ? t.understanding
            : state === "error"
              ? t.lowConfidence
              : t.tapToAnswer}
      </p>
    </div>
  );
}
