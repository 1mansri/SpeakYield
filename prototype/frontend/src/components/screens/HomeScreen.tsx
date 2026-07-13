"use client";

import { Globe, Mic, ShoppingBag, Wheat } from "lucide-react";
import { Action, Language } from "@/lib/types";
import { copy } from "@/lib/copy";

export default function HomeScreen({
  language,
  userName,
  mode,
  onModeChange,
  onMicPress,
  onLanguageSwitch,
}: {
  language: Language;
  userName?: string;
  mode: Action;
  onModeChange: (mode: Action) => void;
  onMicPress: () => void;
  onLanguageSwitch: () => void;
}) {
  const t = copy[language];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-xl font-bold text-primary">{t.appName}</h1>
          {userName && <p className="text-sm text-text-secondary">{userName}</p>}
        </div>
        <button
          type="button"
          onClick={onLanguageSwitch}
          aria-label="Switch language"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
        >
          <Globe size={24} />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onModeChange("sell")}
            className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 px-5 text-base font-semibold transition-colors duration-150 ${
              mode === "sell"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-primary"
            }`}
          >
            <Wheat size={20} />
            {t.sell}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("buy")}
            className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 px-5 text-base font-semibold transition-colors duration-150 ${
              mode === "buy"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-primary"
            }`}
          >
            <ShoppingBag size={20} />
            {t.buy}
          </button>
        </div>

        <button
          type="button"
          onClick={onMicPress}
          aria-label={t.tapToSpeak}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_16px_rgba(232,135,30,0.35)] transition-transform duration-150 hover:bg-accent-dark active:scale-95"
        >
          <Mic size={48} />
        </button>

        <p className="text-lg font-semibold text-text-secondary">{t.tapToSpeak}</p>
      </div>
    </div>
  );
}
