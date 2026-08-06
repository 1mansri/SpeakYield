"use client";

import { useState } from "react";
import { Mic, X } from "lucide-react";
import { Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { useHydrated } from "@/lib/useHydrated";

const HINT_SEEN_KEY = "speakyield.mic-hint-seen";

/** Wrapped because private-browsing modes throw on storage access rather than
 *  returning null — and a thrown coach mark would take the whole shell down. */
function hintAlreadySeen(): boolean {
  try {
    return localStorage.getItem(HINT_SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * The one control that is always on screen.
 *
 * Voice is the app's premise, so the way in cannot be something the farmer has to
 * navigate to — it floats above every tab from the moment they land, and it is the only
 * thing here that never scrolls away. It rides *over* the market rather than standing in
 * for it: the market is what the app is, speaking is how you act on it.
 *
 * While the tab bar is hidden it collapses to a disc and drops into the vacated space,
 * so it keeps its reach without covering the row the farmer is reading.
 */
export default function SpeakButton({
  language,
  onPress,
  /** True while the farmer is scrolling down — the button shrinks rather than leaving. */
  collapsed,
  /** Height of the tab bar it rides above — and how far it drops once that retracts. */
  dropBy,
}: {
  language: Language;
  onPress: () => void;
  collapsed: boolean;
  dropBy: number;
}) {
  const t = copy[language];
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  // First run only. Derived rather than synced in through an effect, and gated on
  // hydration because the server has no `localStorage` to consult — so the hint appears
  // with the button instead of popping in a frame later. A coach mark that returns on
  // every visit is nagging, not onboarding.
  const showHint = hydrated && !dismissed && !hintAlreadySeen();

  function dismissHint() {
    setDismissed(true);
    try {
      localStorage.setItem(HINT_SEEN_KEY, "1");
    } catch {
      // Nothing to do; the hint just returns next launch.
    }
  }

  function handlePress() {
    dismissHint();
    onPress();
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-end gap-2 px-5 transition-transform duration-300 ease-out"
      style={{
        // Rides above the tab bar at rest, and drops into its place once it retracts.
        paddingBottom: dropBy + 12,
        transform: `translateY(${collapsed ? dropBy : 0}px)`,
      }}
    >
      {/* The hint follows the button, so it stands down while the farmer is scrolling
          rather than trailing a tooltip down the page. */}
      {showHint && !collapsed && (
        <div className="pointer-events-auto flex max-w-[16rem] items-start gap-2 rounded-xl rounded-br-sm border border-border bg-surface px-3 py-2 shadow-[0_6px_20px_rgba(38,36,32,0.14)]">
          <p className="flex-1 text-sm leading-snug text-text-primary">{t.firstTimeHint}</p>
          <button
            type="button"
            onClick={dismissHint}
            aria-label={t.gotIt}
            className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1 text-text-secondary hover:bg-background"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handlePress}
        aria-label={t.tapToSpeak}
        className={`pointer-events-auto flex min-h-[56px] items-center gap-2.5 rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(232,135,30,0.42)] transition-all duration-300 ease-out hover:bg-accent-dark active:scale-95 ${
          collapsed ? "w-14 justify-center px-0" : "py-3.5 pl-5 pr-6"
        } ${showHint ? "ring-4 ring-accent/25" : ""}`}
      >
        <Mic size={26} className="shrink-0" />
        {/* Width-animated rather than unmounted, so the label doesn't pop back in. */}
        <span
          className={`overflow-hidden whitespace-nowrap text-base font-bold transition-all duration-300 ease-out ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100"
          }`}
        >
          {t.speakToTrade}
        </span>
      </button>
    </div>
  );
}
