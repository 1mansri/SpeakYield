"use client";

import { useEffect, useState } from "react";
import { Language, Market, MarketRate } from "@/lib/types";
import { commodityName, copy, fill } from "@/lib/copy";
import { getMarket } from "@/lib/api";
import { grouped } from "@/lib/format";
import MandiBoard from "@/components/MandiBoard";
import Sparkline from "@/components/Sparkline";

/**
 * The rates tab: the same board the home screen carries, plus the week behind each
 * number. Home answers "what is it worth today"; this answers "and is that a good day
 * to sell" — which is the question a farmer actually holds their crop on.
 */
export default function RatesScreen({ language }: { language: Language }) {
  const t = copy[language];
  const [market, setMarket] = useState<Market | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMarket()
      .then((data) => {
        if (!cancelled) setMarket(data);
      })
      .catch(() => {
        // The dashboard surfaces market failures; this tab just stays quiet.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!market) {
    return <p className="py-8 text-base text-text-secondary">{t.marketLoading}</p>;
  }

  const totalArrivals = market.rates.reduce((sum, r) => sum + r.arrivalsQtl, 0);

  return (
    <div className="flex flex-col gap-5 pt-3">
      <MandiBoard language={language} market={market} />

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="shrink-0 text-base font-semibold text-text-primary">{t.weekTrend}</h2>
          <span className="h-px flex-1 bg-border" />
          <span className="shrink-0 text-sm tabular-nums text-text-secondary">
            {t.colArrivals} {fill(t.arrivalsQtl, { n: grouped(totalArrivals) })}
          </span>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {market.rates.map((rate) => (
            <WeekRow key={rate.commodity} language={language} rate={rate} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** One commodity's week: where it opened, where it stands, and the shape in between. */
function WeekRow({ language, rate }: { language: Language; rate: MarketRate }) {
  const t = copy[language];
  const opened = rate.trend[0] ?? rate.price;
  const change = Math.round((rate.price - opened) * 10) / 10;
  const up = change > 0;
  const flat = change === 0;
  const tone = flat
    ? "var(--color-text-secondary)"
    : up
      ? "var(--color-success)"
      : "var(--color-error)";

  return (
    <div className="flex items-center gap-3 py-3">
      <span aria-hidden className="text-xl">
        {rate.emoji}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold text-text-primary">
          {commodityName(rate, language)}
        </span>
        <span className="text-sm tabular-nums text-text-secondary">
          {fill(t.arrivalsQtl, { n: grouped(rate.arrivalsQtl) })} ·{" "}
          {fill(t.dayRange, { low: rate.low, high: rate.high })}
        </span>
      </div>

      <Sparkline values={rate.trend} color={tone} width={64} height={26} />

      <span
        className="w-[62px] text-right text-base font-semibold tabular-nums"
        style={{ color: tone }}
      >
        {flat ? "—" : `${up ? "+" : "−"}₹${Math.abs(change)}`}
      </span>
    </div>
  );
}
