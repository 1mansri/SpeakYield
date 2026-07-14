"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { recordWithAutoStop, RecordingSession } from "@/lib/recorder";
import Button from "@/components/ui/Button";

const BAR_COUNT = 5;

export default function ListeningScreen({
  language,
  onCancel,
  onRecorded,
}: {
  language: Language;
  onCancel: () => void;
  onRecorded: (audio: Blob) => void;
}) {
  const t = copy[language];
  const [micError, setMicError] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const sessionRef = useRef<RecordingSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    const session = recordWithAutoStop({
      onLevel: (l) => {
        if (!cancelled) setLevel(l);
      },
      onSpeech: () => {
        if (!cancelled) setSpeaking(true);
      },
    });
    sessionRef.current = session;

    session.done
      .then((blob) => {
        if (!cancelled) onRecorded(blob);
      })
      .catch(() => {
        if (!cancelled) setMicError(true);
      });

    return () => {
      cancelled = true;
      sessionRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCancel() {
    sessionRef.current?.cancel();
    onCancel();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {micError ? (
          <>
            <AlertCircle size={40} className="text-error" />
            <p className="max-w-xs text-center text-lg font-semibold text-error">
              Couldn&apos;t access the microphone. Check your browser permissions.
            </p>
          </>
        ) : (
          <>
            {/* Bars react to live mic loudness — the farmer sees the app is hearing them. */}
            <div className="flex h-20 items-end gap-2" aria-hidden>
              {Array.from({ length: BAR_COUNT }).map((_, i) => {
                const spread = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / BAR_COUNT;
                const height = 12 + level * 56 * spread + (speaking ? 4 : 0);
                return (
                  <span
                    key={i}
                    className="w-3 rounded-full bg-accent transition-[height] duration-75"
                    style={{ height: `${Math.round(height)}px` }}
                  />
                );
              })}
            </div>
            <p className="text-xl font-semibold text-primary">
              {speaking ? t.understanding : t.listening}
            </p>
            <p className="max-w-xs text-center text-base text-text-secondary">{t.keepSpeaking}</p>
          </>
        )}
      </div>

      <div className="w-full">
        <Button variant="outline" onClick={handleCancel}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}
