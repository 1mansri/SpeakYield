"use client";

import { ChevronRight } from "lucide-react";
import { DemandSummary, Language } from "@/lib/types";
import { commodityName, copy, fill } from "@/lib/copy";

/**
 * One commodity's live demand: how many buyers want it, and the band they're bidding in
 * relative to the mandi rate.
 *
 * The rail is the whole point. A range written as "₹20 to ₹25" is text; drawn against
 * the mandi tick it shows, at a glance, that the best bid sits *above* what the farmer
 * would get locally — which is the platform's entire argument. Tapping the row starts a
 * sell aimed at that commodity, so a farmer can enter the market by seeing an
 * opportunity rather than by speaking into an empty screen.
 */
export default function DemandCard({
  language,
  demand,
  onSell,
}: {
  language: Language;
  demand: DemandSummary;
  onSell: (commodityLabel: string) => void;
}) {
  const t = copy[language];

  // Pad the rail past the extremes so the mandi tick and the band ends never sit flush
  // against the edge, where they'd read as clipped rather than as values.
  const low = Math.min(demand.priceMin, demand.mandiPrice);
  const high = Math.max(demand.priceMax, demand.mandiPrice);
  const pad = Math.max(1, (high - low) * 0.18);
  const from = low - pad;
  const span = high + pad - from || 1;
  const pct = (value: number) => ((value - from) / span) * 100;

  const beatsMandi = demand.priceMax > demand.mandiPrice;
  const premium = Math.round(demand.priceMax - demand.mandiPrice);

  const name = commodityName(demand, language);

  return (
    <button
      type="button"
      onClick={() => onSell(name)}
      // The rail carries the price band visually; the label spells it out, so a screen
      // reader announces the whole offer rather than "wheat, 1".
      aria-label={`${name} — ${fill(t.buyersTaking, { n: demand.buyers })}, ${fill(t.priceRange, {
        min: demand.priceMin,
        max: demand.priceMax,
      })}. ${t.mandiRate} ₹${demand.mandiPrice}. ${t.sellThis}`}
      className="group flex w-full flex-col gap-2.5 border-b border-border px-1 py-3.5 text-left last:border-b-0"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="text-xl">
          {demand.emoji}
        </span>
        <span className="flex-1 truncate text-lg font-semibold text-text-primary">{name}</span>
        <span className="text-base tabular-nums text-text-secondary">
          {fill(t.buyersTaking, { n: demand.buyers })}
        </span>
        <ChevronRight
          size={18}
          className="text-text-secondary transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </div>

      {/* The bid band, laid over the mandi reference. */}
      <div className="relative h-6" aria-hidden>
        <span className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-border" />
        <span
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pct(demand.priceMin)}%`, right: `${100 - pct(demand.priceMax)}%` }}
        />
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-text-secondary"
          style={{ left: `${pct(demand.mandiPrice)}%` }}
        />
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
          style={{ left: `${pct(demand.priceMax)}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="tabular-nums text-text-secondary">
          {t.mandiRate} ₹{demand.mandiPrice}
        </span>
        <span className="tabular-nums text-text-primary">
          <span className="font-semibold text-primary">
            {fill(t.priceRange, { min: demand.priceMin, max: demand.priceMax })}
          </span>
          {beatsMandi && premium > 0 && (
            <span className="ml-1.5 text-success">{fill(t.aboveMandi, { d: premium })}</span>
          )}
        </span>
      </div>
    </button>
  );
}
