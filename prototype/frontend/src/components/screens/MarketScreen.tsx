"use client";

import { useEffect, useState } from "react";
import { Mic, RotateCcw, ShoppingBag, Wheat } from "lucide-react";
import { Action, DealsData, DemandSummary, Language, Market } from "@/lib/types";
import { copy } from "@/lib/copy";
import { getDeals, getMarket } from "@/lib/api";
import RatesStrip from "@/components/RatesStrip";
import DemandCard from "@/components/DemandCard";
import DealCard from "@/components/DealCard";
import Button from "@/components/ui/Button";

/**
 * The market dashboard — the app's home.
 *
 * It replaces the old mic-on-an-empty-canvas home screen, which read as a voice assistant.
 * Here the market is on screen first (rates, who's buying, at what spread) and the mic is a
 * shortcut *into* it, docked over the content rather than standing in for it.
 */
export default function MarketScreen({
  language,
  userName,
  userId,
  refreshKey,
  mode,
  onModeChange,
  onMicPress,
  onSellCommodity,
}: {
  language: Language;
  userName?: string;
  userId?: string;
  /** Bumped after a deal completes so the dashboard reflects it without a reload. */
  refreshKey: number;
  mode: Action;
  onModeChange: (mode: Action) => void;
  onMicPress: () => void;
  onSellCommodity: (commodity: string) => void;
}) {
  const t = copy[language];
  const [market, setMarket] = useState<Market | null>(null);
  const [deals, setDeals] = useState<DealsData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMarket()
      .then((data) => {
        if (!cancelled) setMarket(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDeals(userId)
      .then((data) => {
        if (!cancelled) setDeals(data);
      })
      .catch(() => {
        // The deals tab is the authority here; the dashboard just stays quiet.
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const activeDeal = deals?.deals.find((d) => d.status !== "delivered");

  return (
    <div className="relative flex flex-1 flex-col gap-5 py-4">
      <div className="flex items-end justify-between gap-3">
        {userName && <p className="text-lg font-semibold text-text-primary">{userName}</p>}
        {deals && deals.dealCount > 0 && (
          <p className="text-right text-sm text-text-secondary">
            {t.earnedThisMonth}
            <span className="ml-1.5 text-lg font-bold tabular-nums text-primary">
              ₹{deals.earnedThisMonth}
            </span>
          </p>
        )}
      </div>

      {/* Sell/buy is a hint for the flow — spoken intent still wins — but on the home
          screen it also says, plainly, that this market runs both ways. */}
      <div className="flex gap-3">
        <ModeChip
          active={mode === "sell"}
          icon={<Wheat size={18} />}
          label={t.sell}
          onClick={() => onModeChange("sell")}
        />
        <ModeChip
          active={mode === "buy"}
          icon={<ShoppingBag size={18} />}
          label={t.buy}
          onClick={() => onModeChange("buy")}
        />
      </div>

      {failed && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-base text-text-secondary">{t.marketError}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw size={18} />
            {t.retry}
          </Button>
        </div>
      )}

      {!market && !failed && (
        <p className="py-8 text-center text-base text-text-secondary">{t.marketLoading}</p>
      )}

      {activeDeal && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">
            {t.activeDeal}
          </h2>
          <DealCard language={language} deal={activeDeal} />
        </section>
      )}

      {market && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              {t.todayRates}
            </h2>
            <RatesStrip language={language} rates={market.rates} />
          </section>

          <section className="flex flex-col gap-2 pb-24">
            <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              {t.liveDemand}
            </h2>
            <div className="flex flex-col gap-3">
              {market.demand.map((d: DemandSummary) => (
                <DemandCard
                  key={d.commodity}
                  language={language}
                  demand={d}
                  onSell={onSellCommodity}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Docked mic: prominent, but over the market rather than instead of it. */}
      <div className="pointer-events-none sticky bottom-3 z-10 mt-auto flex justify-end">
        <button
          type="button"
          onClick={onMicPress}
          aria-label={t.tapToSpeak}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-accent py-3.5 pl-5 pr-6 text-white shadow-[0_6px_20px_rgba(232,135,30,0.45)] transition-transform duration-150 hover:bg-accent-dark active:scale-95"
        >
          <Mic size={26} />
          <span className="text-base font-bold">{t.speakToTrade}</span>
        </button>
      </div>
    </div>
  );
}

function ModeChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border-2 px-4 text-base font-semibold transition-colors duration-150 ${
        active ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
