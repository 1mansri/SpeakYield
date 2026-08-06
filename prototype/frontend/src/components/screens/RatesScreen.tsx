"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Language, Market } from "@/lib/types";
import { commodityName, copy } from "@/lib/copy";
import { getMarket } from "@/lib/api";

/** The full mandi price board — the rates strip from the dashboard, opened out. */
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

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <h2 className="text-xl font-bold text-primary">{t.todayRates}</h2>

      {!market && <p className="text-base text-text-secondary">{t.marketLoading}</p>}

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {market?.rates.map((rate) => {
          const up = rate.delta > 0;
          const flat = rate.delta === 0;
          return (
            <div key={rate.commodity} className="flex items-center gap-3 p-4">
              <span aria-hidden className="text-2xl">
                {rate.emoji}
              </span>
              <span className="flex-1 text-lg font-semibold">{commodityName(rate, language)}</span>
              <span className="text-xl font-bold tabular-nums">
                ₹{rate.price}
                <span className="text-sm font-normal text-text-secondary">/{rate.unit}</span>
              </span>
              <span
                className={`flex w-16 items-center justify-end gap-1 text-base font-semibold tabular-nums ${
                  flat ? "text-text-secondary" : up ? "text-success" : "text-error"
                }`}
              >
                {flat ? (
                  "—"
                ) : (
                  <>
                    {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {up ? "+" : "−"}₹{Math.abs(rate.delta)}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
