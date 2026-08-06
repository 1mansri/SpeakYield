"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, ReceiptText, TrendingUp, User as UserIcon, WifiOff } from "lucide-react";
import { Language, Tab } from "@/lib/types";
import { copy } from "@/lib/copy";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import SpeakButton from "@/components/SpeakButton";

const TABS: { key: Tab; icon: typeof LayoutGrid; labelKey: string }[] = [
  { key: "market", icon: LayoutGrid, labelKey: "tabMarket" },
  { key: "deals", icon: ReceiptText, labelKey: "tabDeals" },
  { key: "rates", icon: TrendingUp, labelKey: "tabRates" },
  { key: "profile", icon: UserIcon, labelKey: "tabProfile" },
];

/** Tab bar height in px. Shared by the scroll padding and the mic's drop distance, so
 *  the three stay in step if it ever changes. */
const NAV_HEIGHT = 64;

/**
 * The persistent marketplace chrome: a slim identity bar, the scrolling surface, a
 * translucent tab bar pinned to the bottom, and the mic floating over all of it.
 *
 * The tab bar is fixed rather than in flow, and content runs *under* it — so the market
 * reads as a continuous surface the chrome sits on, not a box with the bottom sliced
 * off. It retracts while the farmer scrolls down and returns the moment they scroll up
 * or reach either end of the list.
 *
 * The flow screens (listening -> review) deliberately render *without* this shell — a
 * transaction should be single-focus — but everything else lives inside it, so the app
 * always reads as a place you are in rather than a conversation you are having.
 */
export default function AppShell({
  language,
  location,
  tab,
  onTabChange,
  onMicPress,
  children,
}: {
  language: Language;
  location: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onMicPress: () => void;
  children: React.ReactNode;
}) {
  const t = copy[language];
  const scrollRef = useRef<HTMLElement>(null);
  const chromeHidden = useHideOnScroll(scrollRef, tab);
  const online = useOnline();

  // A tab switch is a new surface — start it at the top rather than at the last one's
  // scroll offset, which would drop the farmer into the middle of an unfamiliar list.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-5 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-base font-bold tracking-tight text-primary">{t.appName}</span>
          <span className="truncate text-sm text-text-secondary">{location}</span>
        </div>
        {!online && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
            <WifiOff size={13} />
            {t.offline}
          </span>
        )}
      </header>

      {/* Bottom padding clears the retracted chrome so the last row of any list is
          reachable rather than parked permanently under the tab bar. */}
      <main
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5"
        style={{ paddingBottom: NAV_HEIGHT + 88 }}
      >
        {children}
      </main>

      <SpeakButton
        language={language}
        onPress={onMicPress}
        collapsed={chromeHidden}
        dropBy={NAV_HEIGHT}
      />

      <nav
        aria-label="Main"
        className="absolute inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/92 backdrop-blur-md transition-transform duration-300 ease-out"
        style={{
          height: NAV_HEIGHT,
          transform: chromeHidden ? `translateY(${NAV_HEIGHT}px)` : "translateY(0)",
        }}
      >
        {TABS.map(({ key, icon: Icon, labelKey }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-xs ${active ? "font-bold" : "font-medium"}`}>
                {t[labelKey]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Connectivity, watched live. Rural pilots lose signal constantly, and a farmer acting
 *  on a rate they can't tell is stale is the failure mode that costs them money. */
function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
