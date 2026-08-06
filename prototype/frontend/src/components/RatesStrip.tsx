"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Language, MarketRate } from "@/lib/types";
import { commodityName } from "@/lib/copy";

/**
 * Today's going rates, as a scrollable board. This is the first thing on the screen for a
 * reason: a price board is what a mandi looks like, and no assistant has one.
 */
export default function RatesStrip({
  language,
  rates,
}: {
  language: Language;
  rates: MarketRate[];
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex w-max gap-3">
        {rates.map((rate) => {
          const up = rate.delta > 0;
          const flat = rate.delta === 0;
          return (
            <div
              key={rate.commodity}
              className="flex min-w-[124px] flex-col gap-1 rounded-2xl border border-border bg-surface px-3 py-2.5"
            >
              <span className="flex items-center gap-1.5 text-base text-text-secondary">
                <span aria-hidden className="text-lg">
                  {rate.emoji}
                </span>
                {commodityName(rate, language)}
              </span>
              <span className="text-2xl font-bold tabular-nums text-text-primary">
                ₹{rate.price}
                <span className="text-sm font-normal text-text-secondary">/{rate.unit}</span>
              </span>
              {!flat && (
                <span
                  className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                    up ? "text-success" : "text-error"
                  }`}
                >
                  {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {up ? "+" : "−"}₹{Math.abs(rate.delta)}
                </span>
              )}
              {flat && <span className="text-sm text-text-secondary">—</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
