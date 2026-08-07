"use client";

import { ChevronRight } from "lucide-react";
import { Language, SupplySummary } from "@/lib/types";
import { commodityName, copy, fill } from "@/lib/copy";
import { localUnit } from "@/lib/commodities";

/**
 * One farm input's live supply: how many dealers stock it, the band they charge, and
 * where the nearest one sits inside that band.
 *
 * The deliberate mirror of DemandCard — same rail, opposite reading. Selling, the rail
 * is measured against the mandi tick and reaching *right* is the win. Buying, there is
 * no board rate for urea, so the rail is measured against the dealers themselves and
 * *left* is the win: the marked-up end is the one to avoid. The nearest dealer's tick is
 * the point of the whole card. It answers the question a farmer with money actually
 * asks — is the cheap shop the far one? — which a price list alone never answers.
 */
export default function SupplyCard({
  language,
  supply,
  onBuy,
}: {
  language: Language;
  supply: SupplySummary;
  onBuy: (commodityLabel: string) => void;
}) {
  const t = copy[language];

  // Pad past the extremes so neither end of the band sits flush against the rail edge,
  // where it would read as clipped rather than as a value.
  const pad = Math.max(1, (supply.priceMax - supply.priceMin) * 0.18);
  const from = supply.priceMin - pad;
  const span = supply.priceMax + pad - from || 1;
  const pct = (value: number) => ((value - from) / span) * 100;

  const name = commodityName(supply, language);
  const unit = localUnit(supply.unit, language);
  // Worth calling out only when the closest shop is also the cheapest — otherwise the
  // farmer is being asked to weigh distance against price, and the rail shows that.
  const nearestIsCheapest = supply.nearestPrice === supply.priceMin;

  return (
    <button
      type="button"
      onClick={() => onBuy(name)}
      aria-label={`${name} — ${fill(t.dealersStocking, { n: supply.dealers })}, ${fill(
        t.priceRange,
        { min: supply.priceMin, max: supply.priceMax },
      )} ${fill(t.ratePerUnit, { price: supply.nearestPrice, unit })}. ${fill(t.nearestDealer, {
        d: supply.nearestKm,
      })}. ${t.buyThis}`}
      className="group flex w-full flex-col gap-2.5 border-b border-border px-1 py-3.5 text-left last:border-b-0"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="text-xl">
          {supply.emoji}
        </span>
        <span className="flex-1 truncate text-lg font-semibold text-text-primary">{name}</span>
        <span className="text-base tabular-nums text-text-secondary">
          {fill(t.dealersStocking, { n: supply.dealers })}
        </span>
        <ChevronRight
          size={18}
          className="text-text-secondary transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </div>

      {/* The asking band, with the nearest dealer's price marked inside it. */}
      <div className="relative h-6" aria-hidden>
        <span className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-border" />
        <span
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pct(supply.priceMin)}%`, right: `${100 - pct(supply.priceMax)}%` }}
        />
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-text-secondary"
          style={{ left: `${pct(supply.nearestPrice)}%` }}
        />
        {/* The cheapest end carries the dot, because that's the end the buyer wants. */}
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
          style={{ left: `${pct(supply.priceMin)}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="tabular-nums text-text-secondary">
          {fill(t.nearestDealer, { d: supply.nearestKm })}
        </span>
        <span className="tabular-nums text-text-primary">
          <span className="font-semibold text-primary">
            {fill(t.priceRange, { min: supply.priceMin, max: supply.priceMax })}
          </span>
          <span className="ml-1 text-text-secondary">/{unit}</span>
          {nearestIsCheapest && (
            <span className="ml-1.5 text-success">
              {fill(t.lowestPrice, { p: supply.priceMin })}
            </span>
          )}
        </span>
      </div>
    </button>
  );
}
