"use client";

import { Globe, LayoutGrid, MapPin, ReceiptText, TrendingUp, User as UserIcon } from "lucide-react";
import { Language, Tab } from "@/lib/types";
import { copy } from "@/lib/copy";

const TABS: { key: Tab; icon: typeof LayoutGrid; labelKey: string }[] = [
  { key: "market", icon: LayoutGrid, labelKey: "tabMarket" },
  { key: "deals", icon: ReceiptText, labelKey: "tabDeals" },
  { key: "rates", icon: TrendingUp, labelKey: "tabRates" },
  { key: "profile", icon: UserIcon, labelKey: "tabProfile" },
];

/**
 * The persistent marketplace chrome: brand + the mandi the farmer is trading in, and a
 * bottom tab bar. The flow screens (listening -> review) deliberately render *without*
 * this shell — a transaction should be single-focus — but everything else lives inside
 * it, so the app always reads as a place you are in rather than a conversation you are having.
 */
export default function AppShell({
  language,
  location,
  tab,
  onTabChange,
  onLanguageSwitch,
  children,
}: {
  language: Language;
  location: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onLanguageSwitch: () => void;
  children: React.ReactNode;
}) {
  const t = copy[language];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-lg font-bold leading-tight text-primary">{t.appName}</span>
          <span className="flex items-center gap-1 text-sm text-text-secondary">
            <MapPin size={14} />
            <span className="truncate">{location}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onLanguageSwitch}
          aria-label="Switch language"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-background"
        >
          <Globe size={22} />
        </button>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto px-5 pb-4">{children}</main>

      <nav className="flex border-t border-border bg-surface" aria-label="Main">
        {TABS.map(({ key, icon: Icon, labelKey }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
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
