"use client";

import { useEffect } from "react";
import { CommandResult, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { playText } from "@/lib/tts";
import AnswerMic from "@/components/AnswerMic";
import Button from "@/components/ui/Button";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "hi", label: "हिंदी" },
  { code: "bn", label: "বাংলা" },
  { code: "en", label: "English" },
];

export default function WelcomeScreen({
  selected,
  onSelect,
  onContinue,
}: {
  selected: Language | null;
  onSelect: (lang: Language) => void;
  onContinue: () => void;
}) {
  const promptLang = selected ?? "hi";

  useEffect(() => {
    const speech = playText(copy[promptLang].promptWelcome, promptLang);
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(result: CommandResult) {
    if (result.intent === "select" && ["hi", "bn", "en"].includes(result.language)) {
      const lang = result.language as Language;
      // Voice pick is the full answer — set the language and move straight on.
      onSelect(lang);
      onContinue();
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="text-6xl" aria-hidden>
          🌾
        </span>
        <h1 className="text-3xl font-bold text-primary">Speak Yield</h1>
      </div>

      <div className="flex w-full flex-col gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onSelect(lang.code)}
            className={`min-h-[56px] w-full rounded-2xl border-2 px-6 text-xl font-semibold transition-colors duration-150 ${
              selected === lang.code
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-primary hover:border-primary"
            }`}
          >
            {lang.label}
          </button>
        ))}

        <div className="mt-4 flex flex-col gap-4">
          <AnswerMic language={promptLang} decision="language" onResult={handleAnswer} />
          <Button variant="accent" disabled={!selected} onClick={onContinue}>
            {copy[selected ?? "hi"].continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
