"use client";

import { ChevronRight, Users } from "lucide-react";
import { DemandSummary, Language } from "@/lib/types";
import { commodityName, copy, fill } from "@/lib/copy";

/**
 * One commodity's live demand: how many buyers want it and the spread they're paying.
 * Tapping it starts a sell flow pre-aimed at that commodity — so the farmer can enter the
 * market by *seeing an opportunity*, not only by speaking a request into an empty screen.
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

  return (
    <button
      type="button"
      onClick={() => onSell(commodityName(demand, language))}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors duration-150 hover:border-primary"
    >
      <span aria-hidden className="text-3xl">
        {demand.emoji}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-lg font-semibold text-text-primary">
          {commodityName(demand, language)}
        </span>
        <span className="flex items-center gap-1.5 text-base text-text-secondary">
          <Users size={16} />
          {fill(t.buyersTaking, { n: demand.buyers })}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="flex flex-col items-end">
          <span className="text-lg font-bold tabular-nums text-primary">
            {fill(t.priceRange, { min: demand.priceMin, max: demand.priceMax })}
          </span>
          <span className="text-sm text-text-secondary">
            {t.mandiRate} ₹{demand.mandiPrice}
          </span>
        </div>
        <ChevronRight size={20} className="text-text-secondary" />
      </div>
    </button>
  );
}
