"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  MapPin,
  RotateCcw,
  Wheat,
} from "lucide-react";
import { Draft, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { readBackText } from "@/lib/readback";
import { speak } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

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

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    speak(readBackText(draft, language), language)
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

      <div>
        <p className="text-base text-text-secondary">{t.youSaid}</p>
        <p className="text-xl font-semibold text-text-primary">&quot;{transcript}&quot;</p>
      </div>

      {isLowConfidence && (
        <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-base font-medium text-error">
          <AlertCircle size={20} />
          <span>{t.lowConfidence}</span>
        </div>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Wheat size={22} className="text-primary" />
          <span className="text-lg font-semibold">{draft.commodity}</span>
        </div>
        <div className="flex items-center gap-3 pl-8.5">
          <span className="text-lg">
            {draft.quantity} {draft.unit}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <IndianRupee size={22} className="text-primary" />
          <span className="text-lg">
            {draft.price} / {draft.unit}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={22} className="text-primary" />
          <span className="text-lg">{draft.location}</span>
        </div>
      </Card>

      <div
        className={`flex min-h-6 items-center justify-center gap-2 text-base font-medium ${
          isPlaying ? "text-accent" : "text-text-secondary"
        }`}
      >
        {isPlaying && (
          <>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            <span>{t.readBack}</span>
          </>
        )}
      </div>

      <div className="mt-auto flex gap-3">
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
  );
}
