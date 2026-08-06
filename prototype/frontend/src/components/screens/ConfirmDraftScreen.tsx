"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, RotateCcw, Volume2 } from "lucide-react";
import { CommandResult, Draft, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { readBackText } from "@/lib/readback";
import { speak } from "@/lib/api";
import AnswerMic from "@/components/AnswerMic";
import OrderSlip from "@/components/OrderSlip";
import Button from "@/components/ui/Button";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

/** Stable four-digit slip number for a draft — a cheap deterministic hash, not an id. */
function slipNumber(draft: Draft): string {
  const seed = `${draft.action}|${draft.commodity}|${draft.quantity}|${draft.unit}|${draft.location}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9000;
  }
  return `SY-${1000 + hash}`;
}

export default function ConfirmDraftScreen({
  language,
  transcript,
  draft,
  onBack,
  onRetry,
  onConfirm,
}: {
  language: Language;
  transcript: string;
  draft: Draft;
  onBack: () => void;
  onRetry: () => void;
  onConfirm: () => void;
}) {
  const t = copy[language];
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLowConfidence = draft.confidence < LOW_CONFIDENCE_THRESHOLD;
  // A slip number, derived from the draft itself so it's stable across re-renders and
  // identical for an identical request. Paperwork has numbers; conversations don't.
  const slipNo = useMemo(() => slipNumber(draft), [draft]);

  function handleAnswer(result: CommandResult) {
    if (result.intent === "confirm") onConfirm();
    else if (result.intent === "retry") onRetry();
    else if (result.intent === "cancel") onBack();
  }

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    // Read the draft back, then ask the confirm question aloud — the farmer can answer by
    // voice (AnswerMic below) or tap Confirm/Retry.
    speak(`${readBackText(draft, language)}. ${t.promptConfirm}`, language)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        // play() can reject (browser autoplay policy, or an unsupported audio source) —
        // swallow it; the visible draft card is the source of truth, read-back is a bonus.
        audio.play().catch(() => setIsPlaying(false));
      })
      .catch(() => {
        // Read-back is a nice-to-have — if TTS fails, the draft card is still readable.
      });

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
      >
        <ArrowLeft size={24} />
      </button>

      {/* The transcript is provenance, not the point — a small grey line under the slip's
          heading. Quoting the farmer's words back as the hero element was the loudest
          chatbot tell in the app. Retry is the edit affordance. */}
      <p className="text-base text-text-secondary">
        {t.youSaid} <span className="italic">{transcript}</span>
      </p>

      {isLowConfidence && (
        <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-base font-medium text-error">
          <AlertCircle size={20} />
          <span>{t.lowConfidence}</span>
        </div>
      )}

      {/* Farmers rarely say every field. The slip shows what was captured and marks the
          rest "not set" / "market price" rather than inventing zeros — the options screen
          fills the price gap. */}
      <OrderSlip language={language} draft={draft} slipNo={slipNo} />

      <div
        className={`flex min-h-6 items-center justify-center gap-2 text-base font-medium ${
          isPlaying ? "text-accent" : "text-text-secondary"
        }`}
      >
        {isPlaying && (
          <>
            <Volume2 size={18} className="animate-pulse" />
            <span>{t.readBack}</span>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <AnswerMic language={language} decision="confirm" onResult={handleAnswer} />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw size={20} />
            {t.retry}
          </Button>
          <Button variant="accent" onClick={onConfirm}>
            <CheckCircle size={20} />
            {t.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
