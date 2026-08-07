"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, ShoppingBag, Wheat } from "lucide-react";
import { Action, DealsData, DemandSummary, Language, Market, SupplySummary } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { getDeals, getMarket } from "@/lib/api";
import { grouped } from "@/lib/format";
import MandiBoard from "@/components/MandiBoard";
import MandiTicker from "@/components/MandiTicker";
import DemandCard from "@/components/DemandCard";
import SupplyCard from "@/components/SupplyCard";
import ActiveDealStrip from "@/components/ActiveDealStrip";
import Button from "@/components/ui/Button";

/**
 * The market dashboard — the app's home.
 *
 * The screen is arranged the way a farmer walks into a mandi: their own standing in the
 * book first, then anything they have running, then the board on the wall, then what
 * they can overhear happening, then who is trading. The mic is not on this screen at
 * all — it floats in the shell above every tab — because a mic occupying the home
 * screen is what made this read as a voice assistant with a market attached, rather
 * than a market you can talk to.
 *
 * Sell and Buy are two directions of the *same* market, not two apps, so the switch sits
 * at the top and turns the surface rather than replacing it. What stays put: the mandi
 * board and the feed — a rate is a rate whichever way you're trading. What turns: the
 * ledger line (earned ⇄ spent), the counterparty section (who's buying ⇄ who's selling),
 * and the verb on every card. Previously this control sat at the *bottom* and did
 * nothing but hint the voice extractor, which made the one place the app named the
 * direction the one place changing it had no visible effect.
 */
export default function MarketScreen({
  language,
  userName,
  userId,
  refreshKey,
  mode,
  onModeChange,
  onStartFlow,
  onOpenDeals,
}: {
  language: Language;
  userName?: string;
  userId?: string;
  /** Bumped after a deal completes so the dashboard reflects it without a reload. */
  refreshKey: number;
  mode: Action;
  onModeChange: (mode: Action) => void;
  /** Enter the transaction flow aimed at one commodity, in the direction on screen. */
  onStartFlow: (commodity: string, action: Action) => void;
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
  const selling = mode === "sell";

  // The ledger reads in the direction being traded: a farmer looking at inputs to buy
  // should not be shown "earned" against money that went out.
  const ledgerAmount = selling ? deals?.earnedThisMonth : deals?.spentThisMonth;
  const ledgerLabel = selling ? t.earnedThisMonth : t.spentThisMonth;
  const ledgerCount = selling
    ? fill(t.dealsCount, { n: deals?.sellCount ?? 0 })
    : fill(t.ordersCount, { n: deals?.buyCount ?? 0 });
  const hasLedger = (selling ? deals?.sellCount : deals?.buyCount) ?? 0;

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
        {hasLedger > 0 && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-xl font-bold leading-none tabular-nums text-primary">
              ₹{grouped(ledgerAmount ?? 0)}
            </span>
            <span className="text-sm text-text-secondary">
              {ledgerLabel} · {ledgerCount}
            </span>
          </div>
        )}
      </div>

      {/* The direction switch, at the top where it governs everything below it. */}
      <section className="flex items-center gap-3">
        <span className="shrink-0 text-sm text-text-secondary">{t.intentLabel}</span>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-border">
          <ModeChip
            active={selling}
            icon={<Wheat size={15} />}
            label={t.sell}
            onClick={() => onModeChange("sell")}
          />
          <span className="w-px bg-border" />
          <ModeChip
            active={!selling}
            icon={<ShoppingBag size={15} />}
            label={t.buy}
            onClick={() => onModeChange("buy")}
          />
        </div>
      </section>

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

          {/* The counterparty section — the half of the screen the direction owns.
              Selling, it's who's bidding for the crop; buying, it's who stocks what the
              next crop needs. Same shape, so flipping direction reads as the market
              turning rather than as a different screen loading. */}
          {selling ? (
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
                    onSell={(commodity) => onStartFlow(commodity, "sell")}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="flex flex-col gap-1">
              {/* No trailing count here: each row already says how many dealers stock
                  that input, and any total across rows would double-count the shops
                  that stock several. */}
              <SectionHead title={t.liveSupply} />
              {market.supply.length === 0 ? (
                <p className="py-6 text-center text-base text-text-secondary">{t.noSupply}</p>
              ) : (
                <div className="flex flex-col">
                  {market.supply.map((s: SupplySummary) => (
                    <SupplyCard
                      key={s.commodity}
                      language={language}
                      supply={s}
                      onBuy={(commodity) => onStartFlow(commodity, "buy")}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
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
