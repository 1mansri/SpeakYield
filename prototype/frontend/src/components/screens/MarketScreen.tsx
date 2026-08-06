"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, ShoppingBag, Wheat } from "lucide-react";
import { Action, DealsData, DemandSummary, Language, Market } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { getDeals, getMarket } from "@/lib/api";
import { grouped } from "@/lib/format";
import MandiBoard from "@/components/MandiBoard";
import MandiTicker from "@/components/MandiTicker";
import DemandCard from "@/components/DemandCard";
import ActiveDealStrip from "@/components/ActiveDealStrip";
import Button from "@/components/ui/Button";

/**
 * The market dashboard — the app's home.
 *
 * The screen is arranged the way a farmer walks into a mandi: their own standing in the
 * book first, then anything they have running, then the board on the wall, then what
 * they can overhear happening, then who is bidding. The mic is not on this screen at
 * all — it floats in the shell above every tab — because a mic occupying the home
 * screen is what made this read as a voice assistant with a market attached, rather
 * than a market you can talk to.
 */
export default function MarketScreen({
  language,
  userName,
  userId,
  refreshKey,
  mode,
  onModeChange,
  onSellCommodity,
  onOpenDeals,
}: {
  language: Language;
  userName?: string;
  userId?: string;
  /** Bumped after a deal completes so the dashboard reflects it without a reload. */
  refreshKey: number;
  mode: Action;
  onModeChange: (mode: Action) => void;
  onSellCommodity: (commodity: string) => void;
  /** Tapping the in-flight deal takes the farmer to their record, where the full card is. */
  onOpenDeals: () => void;
}) {
  const t = copy[language];
  const [market, setMarket] = useState<Market | null>(null);
  const [deals, setDeals] = useState<DealsData | null>(null);
  const [failed, setFailed] = useState(false);

  const loadMarket = useCallback(() => {
    setFailed(false);
    return getMarket()
      .then(setMarket)
      .catch(() => setFailed(true));
  }, []);

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

  // The board goes stale while the screen sits open — a mandi moves whether or not
  // anyone is looking at it. Re-read it on a slow tick and whenever the farmer comes
  // back to the tab, so the rates on screen are ones they can act on.
  useEffect(() => {
    const id = setInterval(loadMarket, 120_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadMarket();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadMarket]);

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
    <div className="flex flex-col gap-5 pt-3">
      {/* The farmer's own line in the book — a passbook entry, not a hero card. Their
          standing belongs above the market's, but it doesn't outrank it. */}
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold leading-tight text-text-primary">
            {userName ?? t.appName}
          </span>
          <span className="text-sm text-text-secondary">{t.yourLedger}</span>
        </div>
        {deals && deals.dealCount > 0 && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-xl font-bold leading-none tabular-nums text-primary">
              ₹{grouped(deals.earnedThisMonth)}
            </span>
            <span className="text-sm text-text-secondary">
              {t.earnedThisMonth} · {fill(t.dealsCount, { n: deals.dealCount })}
            </span>
          </div>
        )}
      </div>

      {activeDeal && (
        <section className="flex flex-col gap-2">
          <SectionHead title={t.activeDeal} />
          <ActiveDealStrip language={language} deal={activeDeal} onOpen={onOpenDeals} />
        </section>
      )}

      {failed && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-base text-text-secondary">{t.marketError}</p>
          <Button variant="outline" onClick={loadMarket}>
            <RotateCcw size={18} />
            {t.retry}
          </Button>
        </div>
      )}

      {!market && !failed && <BoardSkeleton label={t.marketLoading} />}

      {market && (
        <>
          <MandiBoard language={language} market={market} />

          <MandiTicker language={language} items={market.ticker} />

          <section className="flex flex-col gap-1">
            <SectionHead
              title={t.liveDemand}
              trailing={fill(t.buyersTaking, {
                n: market.demand.reduce((sum, d) => sum + d.buyers, 0),
              })}
            />
            <div className="flex flex-col">
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

          {/* Sell/buy is only a hint for the voice flow — spoken intent still wins — but
              stating it plainly on the home screen is how the app says this market runs
              both ways, not just outward from the farm. */}
          <section className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
            <span className="text-sm text-text-secondary">{t.intentLabel}</span>
            <div className="ml-auto flex overflow-hidden rounded-lg border border-border">
              <ModeChip
                active={mode === "sell"}
                icon={<Wheat size={15} />}
                label={t.sell}
                onClick={() => onModeChange("sell")}
              />
              <span className="w-px bg-border" />
              <ModeChip
                active={mode === "buy"}
                icon={<ShoppingBag size={15} />}
                label={t.buy}
                onClick={() => onModeChange("buy")}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/** A heading that sits on a rule rather than shouting in small caps — it separates the
 *  sections without adding another band of loud type to the page. */
function SectionHead({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="shrink-0 text-base font-semibold text-text-primary">{title}</h2>
      <span className="h-px flex-1 bg-border" />
      {trailing && <span className="shrink-0 text-sm text-text-secondary">{trailing}</span>}
    </div>
  );
}

/** The board's own shape while it loads, so the first paint is the page arriving rather
 *  than a line of text that the real content later shoves aside. */
function BoardSkeleton({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-board p-4" aria-busy aria-label={label}>
      <div className="mb-4 h-4 w-28 animate-pulse rounded bg-board-line" />
      <div className="flex flex-col gap-3.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-3.5 flex-1 animate-pulse rounded bg-board-line"
              style={{ animationDelay: `${i * 90}ms` }}
            />
            <div
              className="h-3.5 w-16 animate-pulse rounded bg-board-line"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          </div>
        ))}
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
      aria-pressed={active}
      className={`flex min-h-[36px] items-center gap-1.5 px-3 text-sm font-semibold transition-colors duration-150 ${
        active ? "bg-primary text-white" : "bg-surface text-text-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
