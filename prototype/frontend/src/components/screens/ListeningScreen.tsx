"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { createRecorder, Recorder } from "@/lib/recorder";
import Button from "@/components/ui/Button";

const BAR_COUNT = 5;
const RECORD_DURATION_MS = 4000;

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
  const recorderRef = useRef<Recorder | null>(null);

  useEffect(() => {
    let cancelled = false;
    const recorder = createRecorder();
    recorderRef.current = recorder;

    recorder
      .start()
      .then(() => {
        return new Promise<void>((resolve) => setTimeout(resolve, RECORD_DURATION_MS));
      })
      .then(() => recorder.stop())
      .then((blob) => {
        if (!cancelled) onRecorded(blob);
      })
      .catch(() => {
        if (!cancelled) setMicError(true);
      });

    return () => {
      cancelled = true;
      recorderRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCancel() {
    recorderRef.current?.cancel();
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
            <div className="flex h-16 items-end gap-2" aria-hidden>
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className="w-3 animate-pulse rounded-full bg-accent"
                  style={{
                    height: `${24 + ((i * 13) % 40)}px`,
                    animationDelay: `${i * 120}ms`,
                    animationDuration: "900ms",
                  }}
                />
              ))}
            </div>
            <p className="text-xl font-semibold text-primary">{t.listening}</p>
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
